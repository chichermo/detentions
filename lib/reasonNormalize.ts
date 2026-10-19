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

function prettyLabel(folded: string): string {
  if (!folded) return '';
  return folded.charAt(0).toUpperCase() + folded.slice(1);
}

const CHILL_OUT_RE = /\bte\s*veel\s*chil+\s*outs?\b/;

const GROUPS: Array<{ label: string; match: (text: string) => boolean }> = [
  {
    label: 'Teveel chill-outs',
    match: (t) => CHILL_OUT_RE.test(t) || (/\bmisbruik\b/.test(t) && /\bchil+\s*outs?\b/.test(t)),
  },
  {
    label: 'Weigeren strafstudie',
    match: (t) => /\b(weiger\w*|geweigerd)\b/.test(t) && /\bstrafstudie\b/.test(t),
  },
  {
    label: 'Weigeren nablijven',
    match: (t) =>
      (/\b(weiger\w*|geweigerd)\b/.test(t) && /\bnablij/.test(t)) ||
      /\bnablijven\s+weiger/.test(t),
  },
  {
    label: '3x te laat',
    match: (t) => /\b3\s*x\s*te\s*laat\b/.test(t),
  },
  {
    label: 'GSM-gebruik',
    match: (t) => /\bgsm\b/.test(t) || /\bsmartphone\b/.test(t) || /\bgsmgebruik\b/.test(t),
  },
  {
    label: 'Straftaak niet gemaakt',
    match: (t) => /\bstraftaak\b/.test(t) && /\b(niet|geen)\b/.test(t),
  },
  {
    label: 'Hersteltaak niet gemaakt',
    match: (t) => /\bhersteltaak\b/.test(t),
  },
  {
    label: 'Reflectietaak niet gemaakt',
    match: (t) => /\breflectietaak\b/.test(t),
  },
  {
    label: 'Inhaalwerk niet gemaakt',
    match: (t) => /\binhaalwerk\b/.test(t),
  },
  {
    label: 'School verlaten over de middag',
    match: (t) => {
      if (/\bles\b/.test(t) && /\bverlaten\b/.test(t)) return false;
      if (/\bmiddag\b/.test(t) && /\b(buiten|verlaten)\b/.test(t)) return true;
      if (/\bschooldomein\b/.test(t) && /\bverlaten\b/.test(t)) return true;
      return /\bschool\b/.test(t) && /\bverlaten\b/.test(t);
    },
  },
  {
    label: 'Les verlaten',
    match: (t) => /\bles\b/.test(t) && /\bverlaten\b/.test(t),
  },
  {
    label: 'Vapen',
    match: (t) => /\bvapen\b/.test(t),
  },
  {
    label: 'Toiletten CVO',
    match: (t) => /\btoilet/.test(t) && /\bcvo\b/.test(t),
  },
  {
    label: 'Sportkledij niet in orde',
    match: (t) => /\bsportkledij\b/.test(t),
  },
  {
    label: 'Niet direct naar school na de bus',
    match: (t) => /\bniet\s+direct\s+naar\s+school\b/.test(t),
  },
  {
    label: 'Verbale agressie',
    match: (t) => /\bverbaal\b/.test(t) && /\bagress/.test(t),
  },
  {
    label: 'Fysieke agressie',
    match: (t) => (/\bfysiek\b/.test(t) || /\baanvaring\b/.test(t)) && /\b(agress|aanvaring)/.test(t),
  },
  {
    label: 'Agressie naar materiaal',
    match: (t) => /\bagress/.test(t) && /\bmateriaal\b/.test(t),
  },
  {
    label: 'Agressie',
    match: (t) => /\bagress/.test(t),
  },
  {
    label: 'Ziek',
    match: (t) => /\bziek\b/.test(t),
  },
];

export function normalizeReasonLabel(reason: string): string {
  const raw = String(reason || '').trim();
  if (!raw) return '';
  const folded = stripDatesAndDays(foldReason(raw));
  if (!folded) return prettyLabel(foldReason(raw));
  for (const group of GROUPS) {
    if (group.match(folded)) return group.label;
  }
  return prettyLabel(folded);
}
