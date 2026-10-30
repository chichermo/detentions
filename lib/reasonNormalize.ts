/** Vaste redenen voor nablijven, plus groepering van oude vrije tekst. */

export const ANDERE_REASON = 'Andere';
export const ANDERE_HINT = "indien gewenst geef meer details in het vak 'opmerkingen'";
export const ANDERE_OPTION_LABEL = `${ANDERE_REASON} (${ANDERE_HINT})`;

export const DETENTION_REASONS = [
  'Te veel chill-outs',
  '3x te laat',
  'Taak/inhaalwerk niet gemaakt',
  'Fysieke agressie',
  'Verbale agressie',
  'Weigeren nablijven',
  'Weigeren strafstudie',
  'Schooldomein / les verlaten',
  'GSM-gebruik / misbruik Chromebook',
  'Vapen',
  'Diefstal',
  'Pestgedrag',
  'Kledij of materiaal niet in orde',
  'Ronddolen op het schooldomein',
  ANDERE_REASON,
] as const;

export type DetentionReason = (typeof DETENTION_REASONS)[number];

const REASON_SET = new Set<string>(DETENTION_REASONS);

function foldReason(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripDatesAndDays(folded: string): string {
  return folded
    .replace(/\b\d{1,2}\s+\d{1,2}(?:\s+\d{2,4})?\b/g, ' ')
    .replace(
      /\b\d{1,2}\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|apr|jun|jul|aug|sep|sept|okt|nov|dec)\b/g,
      ' '
    )
    .replace(/\b(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\b/g, ' ')
    .replace(/\b(op|van|de|het|een)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const GROUPS: Array<{ label: DetentionReason; match: (text: string) => boolean }> = [
  {
    label: 'Weigeren strafstudie',
    match: (t) => /\b(weiger\w*|geweigerd)\b/.test(t) && /\bstrafstudie\b/.test(t),
  },
  {
    label: 'Weigeren nablijven',
    match: (t) =>
      (/\b(weiger\w*|geweigerd|weigering)\b/.test(t) && /\bnablij/.test(t)) ||
      /\bnablijven\s+weiger/.test(t),
  },
  {
    label: 'Te veel chill-outs',
    match: (t) =>
      /\bte\s*veel\s*chil+\s*outs?\b/.test(t) ||
      (/\bmisbruik\b/.test(t) && /\bchil+\s*outs?\b/.test(t)) ||
      (/\bafspraken\b/.test(t) && /\bchil+\s*outs?\b/.test(t)),
  },
  {
    label: '3x te laat',
    match: (t) => /\b3\s*x\s*te\s*laat\b/.test(t) || /\bte\s+laat\s+in\s+het\s+nablijven\b/.test(t),
  },
  {
    label: 'Diefstal',
    match: (t) => /\bdiefstal\b/.test(t) || /\bstelen\b/.test(t),
  },
  {
    label: 'GSM-gebruik / misbruik Chromebook',
    match: (t) =>
      /\bgsm\b/.test(t) ||
      /\bsmartphone\b/.test(t) ||
      /\bgsmgebruik\b/.test(t) ||
      (/\bchromebook\b/.test(t) && !/\b(stelen|diefstal)\b/.test(t)),
  },
  {
    label: 'Taak/inhaalwerk niet gemaakt',
    match: (t) =>
      /\bstraf\s*taa?k/.test(t) ||
      /\binhaalwerk\b/.test(t) ||
      /\bherstel\s*taa?k/.test(t) ||
      /\breflectie\s*taa?k/.test(t) ||
      /\bsorrybrief\b/.test(t) ||
      /\bwiskundeoefeningen\b/.test(t) ||
      (/\b\s*vt\s*\b/.test(` ${t} `) && /\b(niet|ingediend)\b/.test(t)) ||
      (/\btaak\b/.test(t) && /\b(niet|ingediend|ontvangen)\b/.test(t)),
  },
  {
    label: 'Schooldomein / les verlaten',
    match: (t) => {
      if (/\bnablij/.test(t) && !/\bles\b/.test(t) && !/\bschooldomein\b/.test(t) && !/\bmiddag\b/.test(t)) {
        return false;
      }
      if (/\bles\b/.test(t) && /\bverlaten\b/.test(t)) return true;
      if (/\bschooldomein\b/.test(t) && /\bverlaten\b/.test(t)) return true;
      if (/\bmiddag\b/.test(t) && /\b(buiten|verlaten)\b/.test(t)) return true;
      return /\bschool\b/.test(t) && /\bverlaten\b/.test(t);
    },
  },
  {
    label: 'Vapen',
    match: (t) => /\bvapen\b/.test(t),
  },
  {
    label: 'Pestgedrag',
    match: (t) => /\bpest/.test(t) || /\bcyberpest/.test(t),
  },
  {
    label: 'Verbale agressie',
    match: (t) =>
      /\bverbaal\b/.test(t) ||
      /\buitschelden\b/.test(t) ||
      /\bracistisch/.test(t) ||
      (/\bagress/.test(t) && /\bverbaal\b/.test(t)),
  },
  {
    label: 'Fysieke agressie',
    match: (t) =>
      /\bagress/.test(t) ||
      /\baanvaring\b/.test(t) ||
      /\bschoppen\b/.test(t) ||
      /\bvechten\b/.test(t),
  },
  {
    label: 'Kledij of materiaal niet in orde',
    match: (t) =>
      /\bsportkledij\b/.test(t) ||
      /\bkledij\b/.test(t) ||
      (/\bmateriaal\b/.test(t) && /\b(niet in orde|vaak niet)\b/.test(t)),
  },
  {
    label: 'Ronddolen op het schooldomein',
    match: (t) =>
      /\bronddolen\b/.test(t) ||
      (/\btoilet/.test(t) && /\bcvo\b/.test(t)) ||
      /\bniet op de plaats\b/.test(t) ||
      /\bplaats waar (hij|zij|ik) niet moet zijn\b/.test(t),
  },
];

function matchCanonical(folded: string): DetentionReason {
  if (!folded) return ANDERE_REASON;
  if (folded === 'andere' || folded.startsWith('andere indien')) return ANDERE_REASON;
  for (const group of GROUPS) {
    if (group.match(folded)) return group.label;
  }
  return ANDERE_REASON;
}

/** Groepeer redenen tot een van de 15 vaste labels (statistieken + keuzelijst). */
export function normalizeReasonLabel(reason: string): DetentionReason | '' {
  const raw = String(reason || '').trim();
  if (!raw) return '';
  if (REASON_SET.has(raw)) return raw as DetentionReason;
  return matchCanonical(stripDatesAndDays(foldReason(raw)));
}

/** Waarde voor de reden-keuzelijst (lege string = nog niets gekozen). */
export function toCanonicalReason(reason: string | undefined | null): DetentionReason | '' {
  return normalizeReasonLabel(String(reason || ''));
}

/** Zet een nablijven op een vaste reden; oude vrije tekst naar opmerkingen bij Andere. */
export function applyCanonicalReason<T extends { reason?: string; extraNotes?: string }>(
  detention: T
): T {
  const raw = String(detention.reason || '').trim();
  const canonical = toCanonicalReason(raw);
  if (!canonical) return { ...detention, reason: raw };

  if (canonical === ANDERE_REASON && raw && raw !== ANDERE_REASON) {
    const notes = String(detention.extraNotes || '').trim();
    if (!notes) {
      return { ...detention, reason: canonical, extraNotes: raw };
    }
    if (!notes.toLowerCase().includes(raw.toLowerCase())) {
      return { ...detention, reason: canonical, extraNotes: `${notes}\n${raw}` };
    }
  }

  return { ...detention, reason: canonical };
}
