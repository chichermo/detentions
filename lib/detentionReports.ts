import { Detention } from '@/types';
import { parseISO, differenceInCalendarDays } from 'date-fns';
import { normalizeDetentionDate } from '@/lib/detentionValidation';

export function studentKey(detention: Detention): string {
  return detention.student.split(' - ')[0].trim();
}

export interface StudentReportRow {
  student: string;
  count: number;
  detentions: Detention[];
}

function groupByStudent(detentions: Detention[]): StudentReportRow[] {
  const map = new Map<string, Detention[]>();
  for (const d of detentions) {
    const key = studentKey(d);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  }
  return Array.from(map.entries())
    .map(([student, list]) => ({
      student,
      count: list.length,
      detentions: list.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => b.count - a.count || a.student.localeCompare(b.student));
}

/** Nablijven zonder strafstudie (ma/di/do) */
function isRegularDetention(d: Detention): boolean {
  return !d.isDoublePeriod;
}

/** Strafstudie op maandag */
function isDoubleDetention(d: Detention): boolean {
  return d.dayOfWeek === 'MAANDAG' && !!d.isDoublePeriod;
}

export function getStudentsWithDetentions(detentions: Detention[]): StudentReportRow[] {
  return groupByStudent(detentions);
}

export function getStudentsWithDoubleDetentions(detentions: Detention[]): StudentReportRow[] {
  return groupByStudent(detentions.filter(isDoubleDetention));
}

/** Strafstudie (maandag) waar leerling weigerde */
export function getDoubleMissedOrRejected(detentions: Detention[]): StudentReportRow[] {
  return groupByStudent(
    detentions.filter((d) => isDoubleDetention(d) && !!d.nablijvenGeweigerd)
  );
}

/** Geweigerd op gewone nablijven (ma/di/do) → verwachte strafstudie op (volgende) maandag */
export function getTriggeredDoubleSource(detentions: Detention[]): Detention[] {
  return detentions.filter(
    (d) => isRegularDetention(d) && !!d.nablijvenGeweigerd
  );
}

/** Strafstudie mag tot twee weken later vallen (donderdag → maandag daarna: tot 18 dagen). */
const FOLLOW_UP_WINDOW_DAYS = 21;

function foldNl(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function containsApproximate(text: string, phrase: string, maxDistance: number): boolean {
  if (text.includes(phrase)) return true;
  const plen = phrase.length;
  if (text.length <= plen + 6) return levenshtein(text, phrase) <= maxDistance;
  for (let i = 0; i <= text.length - plen + 2; i++) {
    if (levenshtein(text.slice(i, i + plen), phrase) <= maxDistance) return true;
  }
  return false;
}

/** Melding zoals "weigeren nablijven", met kleine afwijking of extra woorden. */
export function isRefusalFollowUpReason(reason?: string, extraNotes?: string): boolean {
  const text = foldNl(`${reason || ''} ${extraNotes || ''}`);
  if (!text) return false;
  if (/\b(weiger\w*|geweigerd)\b/.test(text)) return true;
  return containsApproximate(text, 'weigeren nablijven', 3);
}

/**
 * Zoek de strafstudie die bij een geweigerde nablijven hoort.
 * Alleen een expliciete koppeling, of een latere strafstudie (tot 2 weken)
 * met melding in de trant van "weigeren nablijven".
 */
export function findLinkedDouble(
  source: Detention,
  all: Detention[]
): Detention | undefined {
  const byId = all.find(
    (d) => isDoubleDetention(d) && d.sourceDetentionId === source.id
  );
  if (byId) return byId;

  const sourceDate = parseISO(source.date);
  const sourceName = studentKey(source);
  return all
    .filter((d) => {
      if (!isDoubleDetention(d) || studentKey(d) !== sourceName) return false;
      if (!isRefusalFollowUpReason(d.reason, d.extraNotes)) return false;
      const days = differenceInCalendarDays(parseISO(d.date), sourceDate);
      return days > 0 && days <= FOLLOW_UP_WINDOW_DAYS;
    })
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

export interface FollowUpReportRow extends StudentReportRow {
  hasOpenFollowUp: boolean;
  linkedBySourceId: Record<string, Detention | undefined>;
}

export interface FollowUpDisplayRow {
  key: string;
  student: string;
  sources: Detention[];
  linked?: Detention;
  hasOpenFollowUp: boolean;
}

/**
 * Groepeer weigeringen per leerling + strafstudie-datum.
 * Twee geweigerde nablijven die naar dezelfde strafstudie-dag wijzen
 * (Aisam 14 en 17 sep → 21 sep) worden één regel, met beide weigeringsdatums.
 */
export function flattenFollowUpDisplayRows(rows: FollowUpReportRow[]): FollowUpDisplayRow[] {
  const result: FollowUpDisplayRow[] = [];
  for (const row of rows) {
    const groups = new Map<string, FollowUpDisplayRow>();
    for (const source of row.detentions) {
      const linked = row.linkedBySourceId[source.id];
      const linkedDay = linked ? normalizeDetentionDate(linked.date) : '';
      const groupKey = linkedDay ? `linked:${linkedDay}` : 'open';
      const existing = groups.get(groupKey);
      if (existing) {
        existing.sources.push(source);
        if (!existing.linked && linked) existing.linked = linked;
        continue;
      }
      groups.set(groupKey, {
        key: `${row.student}::${groupKey}`,
        student: row.student,
        sources: [source],
        linked,
        hasOpenFollowUp: !linked,
      });
    }
    for (const group of groups.values()) {
      group.sources.sort((a, b) =>
        normalizeDetentionDate(a.date).localeCompare(normalizeDetentionDate(b.date))
      );
      result.push(group);
    }
  }
  return result;
}

function buildFollowUpRows(
  sources: Detention[],
  findLinked: (source: Detention, all: Detention[]) => Detention | undefined,
  all: Detention[]
): FollowUpReportRow[] {
  return groupByStudent(sources)
    .map((row) => {
      const linkedBySourceId: Record<string, Detention | undefined> = {};
      let hasOpenFollowUp = false;
      for (const source of row.detentions) {
        const linked = findLinked(source, all);
        linkedBySourceId[source.id] = linked;
        if (!linked) hasOpenFollowUp = true;
      }
      return { ...row, hasOpenFollowUp, linkedBySourceId };
    })
    .sort(
      (a, b) =>
        Number(b.hasOpenFollowUp) - Number(a.hasOpenFollowUp) ||
        b.count - a.count ||
        a.student.localeCompare(b.student, 'nl')
    );
}

/** Alle geweigerde nablijven voor opvolging, open items eerst. */
export function getFollowUpRows(detentions: Detention[]): FollowUpReportRow[] {
  return buildFollowUpRows(getTriggeredDoubleSource(detentions), findLinkedDouble, detentions);
}

/** Geweigerde strafstudie (maandag) → verwachte nieuwe strafstudie */
export function getTriggeredStrafstudieSource(detentions: Detention[]): Detention[] {
  return detentions.filter((d) => isDoubleDetention(d) && !!d.nablijvenGeweigerd);
}

/**
 * Zoek de volgende strafstudie bij een geweigerde strafstudie.
 * Expliciete koppeling, of een latere strafstudie (tot 2 weken)
 * met melding in de trant van "weigeren".
 */
export function findLinkedStrafstudieFollowUp(
  source: Detention,
  all: Detention[]
): Detention | undefined {
  const byId = all.find(
    (d) => isDoubleDetention(d) && d.id !== source.id && d.sourceDetentionId === source.id
  );
  if (byId) return byId;

  const sourceDate = parseISO(source.date);
  const sourceName = studentKey(source);
  return all
    .filter((d) => {
      if (d.id === source.id) return false;
      if (!isDoubleDetention(d) || studentKey(d) !== sourceName) return false;
      if (!isRefusalFollowUpReason(d.reason, d.extraNotes)) return false;
      const days = differenceInCalendarDays(parseISO(d.date), sourceDate);
      return days > 0 && days <= FOLLOW_UP_WINDOW_DAYS;
    })
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

/** Alle geweigerde strafstudies voor opvolging, open items eerst. */
export function getStrafstudieFollowUpRows(detentions: Detention[]): FollowUpReportRow[] {
  return buildFollowUpRows(
    getTriggeredStrafstudieSource(detentions),
    findLinkedStrafstudieFollowUp,
    detentions
  );
}

/** Leerlingen met openstaande strafstudie (nog geen maandag-registratie) */
export function getPendingDoubleDetentions(detentions: Detention[]): StudentReportRow[] {
  return getFollowUpRows(detentions).filter((row) => row.hasOpenFollowUp);
}

export interface DetailedReports {
  withDetentions: StudentReportRow[];
  withDoubleDetentions: StudentReportRow[];
  doubleMissedOrRejected: StudentReportRow[];
  pendingDouble: StudentReportRow[];
  followUp: FollowUpReportRow[];
  strafstudieFollowUp: FollowUpReportRow[];
}

export function buildDetailedReports(detentions: Detention[]): DetailedReports {
  const followUp = getFollowUpRows(detentions);
  const strafstudieFollowUp = getStrafstudieFollowUpRows(detentions);
  return {
    withDetentions: getStudentsWithDetentions(detentions),
    withDoubleDetentions: getStudentsWithDoubleDetentions(detentions),
    doubleMissedOrRejected: getDoubleMissedOrRejected(detentions),
    pendingDouble: followUp.filter((row) => row.hasOpenFollowUp),
    followUp,
    strafstudieFollowUp,
  };
}
