import type { Detention } from '@/types';

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
