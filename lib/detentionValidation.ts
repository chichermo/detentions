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
