/** Groepeer redenen die inhoudelijk hetzelfde zijn in statistieken. */

function foldReason(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CHILL_OUT_LABEL = 'Teveel chill-outs';
const CHILL_OUT_RE = /\bte\s*veel\s*chil+\s*outs?\b/;

export function normalizeReasonLabel(reason: string): string {
  const raw = String(reason || '').trim();
  if (!raw) return '';
  if (CHILL_OUT_RE.test(foldReason(raw))) return CHILL_OUT_LABEL;
  return raw;
}
