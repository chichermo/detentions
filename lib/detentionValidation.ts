import type { Detention } from '@/types';
import { normalizeDetentionStudent } from '@/lib/studentImport';

/** Naam uit detention.student ("Voornaam Achternaam - Klas"). */
export function getDetentionStudentName(student: string): string {
  const normalized = normalizeDetentionStudent(student || '');
  const sep = ' - ';
  const idx = normalized.indexOf(sep);
  return (idx === -1 ? normalized : normalized.slice(0, idx)).trim();
}

function studentKey(student: string): string {
  return getDetentionStudentName(student).toLowerCase();
}

/** Normaliseer datums zodat 2026-09-21 en 2026-09-21T00:00:00 dezelfde dag zijn. */
export function normalizeDetentionDate(date?: string): string {
  const raw = String(date || '').trim();
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const eu = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (eu) {
    return `${eu[3]}-${eu[2].padStart(2, '0')}-${eu[1].padStart(2, '0')}`;
  }
  return raw;
}

/** Maximaal aantal nablijven (leerlingen) per sessiedag. */
export const MAX_DETECTIONS_PER_SESSION = 20;

/** Verplichte velden bij aanmaken/bewerken van een nablijven. */
export function validateRequiredDetentionFields(
  d: Partial<Detention>
): string | null {
  if (!String(d.student || '').trim()) {
    return 'Selecteer een leerling.';
  }
  if (!String(d.teacher || '').trim()) {
    return 'Vul de naam van het personeel in.';
  }
  if (!String(d.reason || '').trim()) {
    return 'Vul een reden in.';
  }
  if (!String(d.lvsDate || '').trim()) {
    return 'Vul de datum LVS in.';
  }
  return null;
}

/** Controleer of er nog plaats is in de sessie (max 20). */
export function validateSessionCapacity(
  currentCount: number,
  addingCount = 1
): string | null {
  if (currentCount + addingCount > MAX_DETECTIONS_PER_SESSION) {
    const free = Math.max(0, MAX_DETECTIONS_PER_SESSION - currentCount);
    if (free === 0) {
      return `Maximum van ${MAX_DETECTIONS_PER_SESSION} leerlingen per sessie bereikt.`;
    }
    return `Maximum van ${MAX_DETECTIONS_PER_SESSION} leerlingen per sessie. Nog ${free} plaats${free === 1 ? '' : 'en'} over.`;
  }
  return null;
}

/**
 * Maximaal één inschrijving per leerling per sessiedatum.
 * timePeriod (16:00-16:50 vs 16:50-17:40) telt niet als twee plaatsen:
 * twee strafstudies op dezelfde dag voor dezelfde leerling is altijd verboden.
 */
export function validateUniqueStudentOnDate(
  detention: Partial<Detention>,
  existing: Detention[],
  excludeId?: string
): string | null {
  const name = getDetentionStudentName(detention.student || '');
  const date = normalizeDetentionDate(detention.date);
  if (!name || !date) return null;

  const key = studentKey(detention.student || '');
  const sameDay = existing.filter(
    (d) =>
      d.id !== excludeId &&
      normalizeDetentionDate(d.date) === date &&
      studentKey(d.student) === key
  );

  if (sameDay.length === 0) return null;

  const duplicate = sameDay[0];
  const newIsStrafstudie = !!detention.isDoublePeriod;
  const existingStrafstudie = sameDay.some((d) => d.isDoublePeriod);

  if (newIsStrafstudie || existingStrafstudie) {
    const slotHint =
      detention.timePeriod || duplicate.timePeriod
        ? ' Een ander tijdvak (16:00-16:50 / 16:50-17:40) telt niet als aparte strafstudie.'
        : '';
    return `${name} heeft al een ${existingStrafstudie ? 'strafstudie' : 'nablijven'} op ${date}. Er kan maar één strafstudie per leerling per dag worden ingepland.${slotHint}`;
  }

  const existingLabel = duplicate.isDoublePeriod ? 'strafstudie' : 'nablijven';
  return `${name} heeft al een ${existingLabel} op ${date}. Elke leerling kan maar één keer per dag ingepland worden.`;
}

/** Strafstudie mag tot twee weken later vallen (donderdag → maandag daarna). */
const STRAFSTUDIE_FOLLOW_UP_DAYS = 21;

function calendarDaysBetween(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00`);
  const to = Date.parse(`${toDate}T00:00:00`);
  if (Number.isNaN(from) || Number.isNaN(to)) return NaN;
  return Math.round((to - from) / 86400000);
}

function formatNlDateList(dates: string[]): string {
  const unique = Array.from(new Set(dates.filter(Boolean))).sort();
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} en ${unique[1]}`;
  return `${unique.slice(0, -1).join(', ')} en ${unique[unique.length - 1]}`;
}

/**
 * Eén strafstudie mag meerdere weigeringen afdekken.
 * Blokkeer een extra strafstudie als deze leerling al een (niet-geweigerde)
 * strafstudie heeft ná alle openstaande weigeringen (binnen 21 dagen).
 * timePeriod (16:00-16:50 vs 16:50-17:40) telt niet als tweede strafstudie;
 * zelfde dag wordt al geblokkeerd door validateUniqueStudentOnDate.
 */
export function validateStrafstudieCoversRefusals(
  detention: Partial<Detention>,
  existing: Detention[],
  excludeId?: string
): string | null {
  if (!detention.isDoublePeriod) return null;
  const name = getDetentionStudentName(detention.student || '');
  const date = normalizeDetentionDate(detention.date);
  if (!name || !date) return null;

  // Bestaande strafstudie mag je blijven bewerken; alleen een extra nieuwe slot blokkeren.
  const previous = excludeId
    ? existing.find((d) => d.id === excludeId)
    : undefined;
  if (previous?.isDoublePeriod) return null;

  const key = studentKey(detention.student || '');
  const refusals = existing.filter((d) => {
    if (d.id === excludeId) return false;
    if (d.isDoublePeriod) return false;
    if (!d.nablijvenGeweigerd) return false;
    if (studentKey(d.student) !== key) return false;
    const srcDate = normalizeDetentionDate(d.date);
    return !!srcDate && srcDate < date;
  });
  if (refusals.length === 0) return null;

  const covering = existing.filter((d) => {
    if (d.id === excludeId) return false;
    if (!d.isDoublePeriod) return false;
    if (d.nablijvenGeweigerd) return false;
    if (studentKey(d.student) !== key) return false;
    const strafDate = normalizeDetentionDate(d.date);
    if (!strafDate || strafDate >= date) return false;
    return refusals.every((r) => {
      const srcDate = normalizeDetentionDate(r.date);
      if (!srcDate || srcDate >= strafDate) return false;
      const days = calendarDaysBetween(srcDate, strafDate);
      return days > 0 && days <= STRAFSTUDIE_FOLLOW_UP_DAYS;
    });
  });
  if (covering.length === 0) return null;

  const existingDate = normalizeDetentionDate(covering[0].date);
  const refusalDates = formatNlDateList(
    refusals.map((r) => normalizeDetentionDate(r.date))
  );
  return `${name} heeft al een strafstudie op ${existingDate} die de weigering(en) van ${refusalDates} afdekt. Meerdere weigeringen horen bij één strafstudie, niet bij een tweede.`;
}

/** Geen dubbele leerlingen in één opslagactie (nieuwe sessie). */
export function validateNoDuplicateStudentsInBatch(
  detentions: Partial<Detention>[]
): string | null {
  const seen = new Set<string>();
  for (const d of detentions) {
    const name = getDetentionStudentName(d.student || '');
    if (!name) continue;
    const key = studentKey(d.student || '');
    if (seen.has(key)) {
      return `${name} staat meerdere keren in deze sessie. Elke leerling kan maar één keer per dag ingepland worden.`;
    }
    seen.add(key);
  }
  return null;
}
