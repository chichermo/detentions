const FOLLOW_UP_CLOSED_TOKEN = '[[OPGEVOLGD]]';
const TOKEN_RE = /\s*\[\[OPGEVOLGD\]\]\s*/g;

export function stripFollowUpClosedToken(notes?: string | null): string | undefined {
  const cleaned = String(notes || '').replace(TOKEN_RE, ' ').trim();
  return cleaned || undefined;
}

export function notesMarkFollowUpClosed(notes?: string | null): boolean {
  return String(notes || '').includes(FOLLOW_UP_CLOSED_TOKEN);
}

export function encodeFollowUpClosedNotes(
  notes: string | undefined,
  closed: boolean
): string | null {
  const cleaned = stripFollowUpClosedToken(notes);
  if (!closed) return cleaned || null;
  return cleaned ? `${cleaned}\n${FOLLOW_UP_CLOSED_TOKEN}` : FOLLOW_UP_CLOSED_TOKEN;
}

export function readFollowUpClosed(row: {
  follow_up_closed?: unknown;
  extra_notes?: unknown;
}): { extraNotes?: string; followUpClosed: boolean } {
  const extra = typeof row.extra_notes === 'string' ? row.extra_notes : '';
  return {
    extraNotes: stripFollowUpClosedToken(extra),
    followUpClosed: row.follow_up_closed === true || notesMarkFollowUpClosed(extra),
  };
}
