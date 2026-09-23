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

function reasonMentionsSourceDate(detention: Detention, sourceDate: string): boolean {
  const day = normalizeDetentionDate(sourceDate);
  const m = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const d = String(Number(m[3]));
  const mo = String(Number(m[2]));
  const raw = `${detention.reason || ''} ${detention.extraNotes || ''}`.toLowerCase();
  const text = foldNl(raw);
  return (
    new RegExp(`\\b${d}\\s*0?${mo}\\b`).test(text) ||
    new RegExp(`\\b${d}\\s*[\\/.-]\\s*0?${mo}\\b`).test(raw)
  );
}

function isCandidateFollowUp(
  candidate: Detention,
  source: Detention,
  usedIds: Set<string>
): boolean {
  if (usedIds.has(candidate.id) || candidate.id === source.id) return false;
  if (!isDoubleDetention(candidate) || studentKey(candidate) !== studentKey(source)) {
    return false;
  }
  if (!isRefusalFollowUpReason(candidate.reason, candidate.extraNotes)) return false;
  const days = differenceInCalendarDays(parseISO(candidate.date), parseISO(source.date));
  return days > 0 && days <= FOLLOW_UP_WINDOW_DAYS;
}

/**
 * Elke weigering krijgt hoogstens één strafstudie.
 * Eerst sourceDetentionId, daarna reden met die datum (bv. 14/9),
 * daarna de eerstvolgende vrije strafstudie in het venster.
 */
function assignUniqueFollowUps(
  sources: Detention[],
  all: Detention[],
  findBySourceId: (source: Detention, all: Detention[]) => Detention | undefined
): Record<string, Detention | undefined> {
  const linkedBySourceId: Record<string, Detention | undefined> = {};
  const used = new Set<string>();
  const sorted = [...sources].sort((a, b) =>
    normalizeDetentionDate(a.date).localeCompare(normalizeDetentionDate(b.date))
  );

  for (const source of sorted) {
    const byId = findBySourceId(source, all);
    if (byId) {
      linkedBySourceId[source.id] = byId;
      used.add(byId.id);
    }
  }

  for (const source of sorted) {
    if (linkedBySourceId[source.id]) continue;
    const dated = all
      .filter((d) => isCandidateFollowUp(d, source, used) && reasonMentionsSourceDate(d, source.date))
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (dated) {
      linkedBySourceId[source.id] = dated;
      used.add(dated.id);
    }
  }

  for (const source of sorted) {
    if (linkedBySourceId[source.id]) continue;
    const next = all
      .filter((d) => isCandidateFollowUp(d, source, used))
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (next) {
      linkedBySourceId[source.id] = next;
      used.add(next.id);
    }
  }

  return linkedBySourceId;
}

/** Strafstudie bij één geweigerde nablijven (zonder andere weigeringen mee te nemen). */
export function findLinkedDouble(
  source: Detention,
  all: Detention[]
): Detention | undefined {
  return assignUniqueFollowUps([source], all, (s, list) =>
    list.find((d) => isDoubleDetention(d) && d.sourceDetentionId === s.id)
  )[source.id];
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

/** Eén regel per weigering — twee weigeringen mogen niet één strafstudie delen. */
export function flattenFollowUpDisplayRows(rows: FollowUpReportRow[]): FollowUpDisplayRow[] {
  const result: FollowUpDisplayRow[] = [];
  for (const row of rows) {
    const sources = [...row.detentions].sort((a, b) =>
      normalizeDetentionDate(a.date).localeCompare(normalizeDetentionDate(b.date))
    );
    for (const source of sources) {
      const linked = row.linkedBySourceId[source.id];
      result.push({
        key: source.id,
        student: row.student,
        sources: [source],
        linked,
        hasOpenFollowUp: !linked,
      });
    }
  }
  return result;
}

function buildFollowUpRows(
  sources: Detention[],
  findBySourceId: (source: Detention, all: Detention[]) => Detention | undefined,
  all: Detention[]
): FollowUpReportRow[] {
  return groupByStudent(sources)
    .map((row) => {
      const linkedBySourceId = assignUniqueFollowUps(row.detentions, all, findBySourceId);
      const hasOpenFollowUp = row.detentions.some((source) => !linkedBySourceId[source.id]);
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
  return buildFollowUpRows(
    getTriggeredDoubleSource(detentions),
    (source, list) =>
      list.find((d) => isDoubleDetention(d) && d.sourceDetentionId === source.id),
    detentions
  );
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
  return assignUniqueFollowUps([source], all, (s, list) =>
    list.find(
      (d) => isDoubleDetention(d) && d.id !== s.id && d.sourceDetentionId === s.id
    )
  )[source.id];
}

/** Alle geweigerde strafstudies voor opvolging, open items eerst. */
export function getStrafstudieFollowUpRows(detentions: Detention[]): FollowUpReportRow[] {
  return buildFollowUpRows(
    getTriggeredStrafstudieSource(detentions),
    (source, list) =>
      list.find(
        (d) => isDoubleDetention(d) && d.id !== source.id && d.sourceDetentionId === source.id
      ),
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
