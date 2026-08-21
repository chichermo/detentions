import type { Detention } from '@/types';

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
