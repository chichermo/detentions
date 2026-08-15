import { Detention } from '@/types';
import { parseISO, differenceInCalendarDays } from 'date-fns';

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

function hasLinkedDouble(source: Detention, all: Detention[]): boolean {
  return all.some(
    (d) =>
      isDoubleDetention(d) &&
      (d.sourceDetentionId === source.id ||
        (studentKey(d) === studentKey(source) &&
          parseISO(d.date) >= parseISO(source.date) &&
          differenceInCalendarDays(parseISO(d.date), parseISO(source.date)) <= 10))
  );
}

/** Leerlingen met openstaande strafstudie (nog geen maandag-registratie) */
export function getPendingDoubleDetentions(detentions: Detention[]): StudentReportRow[] {
  const sources = getTriggeredDoubleSource(detentions).filter(
    (s) => !hasLinkedDouble(s, detentions)
  );
  return groupByStudent(sources);
}

export interface DetailedReports {
  withDetentions: StudentReportRow[];
  withDoubleDetentions: StudentReportRow[];
  doubleMissedOrRejected: StudentReportRow[];
  pendingDouble: StudentReportRow[];
}

export function buildDetailedReports(detentions: Detention[]): DetailedReports {
  return {
    withDetentions: getStudentsWithDetentions(detentions),
    withDoubleDetentions: getStudentsWithDoubleDetentions(detentions),
    doubleMissedOrRejected: getDoubleMissedOrRejected(detentions),
    pendingDouble: getPendingDoubleDetentions(detentions),
  };
}
