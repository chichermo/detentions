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

/** Maximaal één inschrijving per leerling per sessiedatum (nablijven én strafstudie). */
export function validateUniqueStudentOnDate(
  detention: Partial<Detention>,
  existing: Detention[],
  excludeId?: string
): string | null {
  const name = getDetentionStudentName(detention.student || '');
  if (!name || !detention.date) return null;

  const key = studentKey(detention.student || '');
  const duplicate = existing.find(
    (d) =>
      d.id !== excludeId &&
      d.date === detention.date &&
      studentKey(d.student) === key
  );

  if (!duplicate) return null;

  const existingLabel = duplicate.isDoublePeriod ? 'strafstudie' : 'nablijven';
  return `${name} heeft al een ${existingLabel} op ${detention.date}. Elke leerling kan maar één keer per dag ingepland worden.`;
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
