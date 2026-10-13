const TOKENS = {
  followUpClosed: '[[OPGEVOLGD]]',
  removedFromNablijven: '[[UIT_NABLIJVEN]]',
  removedFromStrafstudie: '[[UIT_STRAFSTUDIE]]',
} as const;

const TOKEN_RE = /\s*\[\[(?:OPGEVOLGD|UIT_NABLIJVEN|UIT_STRAFSTUDIE)\]\]\s*/g;

export type DetentionNoteFlags = {
  extraNotes?: string;
  followUpClosed: boolean;
  removedFromNablijven: boolean;
  removedFromStrafstudie: boolean;
};

export function stripFollowUpClosedToken(notes?: string | null): string | undefined {
  const cleaned = String(notes || '').replace(TOKEN_RE, ' ').trim();
  return cleaned || undefined;
}

export function notesMarkFollowUpClosed(notes?: string | null): boolean {
  return String(notes || '').includes(TOKENS.followUpClosed);
}

export function readDetentionNoteFlags(row: {
  follow_up_closed?: unknown;
  extra_notes?: unknown;
}): DetentionNoteFlags {
  const extra = typeof row.extra_notes === 'string' ? row.extra_notes : '';
  return {
    extraNotes: stripFollowUpClosedToken(extra),
    followUpClosed: row.follow_up_closed === true || extra.includes(TOKENS.followUpClosed),
    removedFromNablijven: extra.includes(TOKENS.removedFromNablijven),
    removedFromStrafstudie: extra.includes(TOKENS.removedFromStrafstudie),
  };
}

export function encodeDetentionNoteFlags(
  notes: string | undefined,
  flags: {
    followUpClosed?: boolean;
    removedFromNablijven?: boolean;
    removedFromStrafstudie?: boolean;
  }
): string | null {
  const parts = [
    stripFollowUpClosedToken(notes),
    flags.followUpClosed ? TOKENS.followUpClosed : '',
    flags.removedFromNablijven ? TOKENS.removedFromNablijven : '',
    flags.removedFromStrafstudie ? TOKENS.removedFromStrafstudie : '',
  ].filter(Boolean);
  return parts.length ? parts.join('\n') : null;
}

export function readFollowUpClosed(row: {
  follow_up_closed?: unknown;
  extra_notes?: unknown;
}): { extraNotes?: string; followUpClosed: boolean } {
  const flags = readDetentionNoteFlags(row);
  return { extraNotes: flags.extraNotes, followUpClosed: flags.followUpClosed };
}

export function canCloseFollowUp(d?: {
  nablijvenGeweigerd?: boolean;
  removedFromNablijven?: boolean;
  removedFromStrafstudie?: boolean;
} | null): boolean {
  return !!(d?.nablijvenGeweigerd || d?.removedFromNablijven || d?.removedFromStrafstudie);
}

export function encodeFollowUpClosedNotes(
  notes: string | undefined,
  closed: boolean
): string | null {
  return encodeDetentionNoteFlags(notes, { followUpClosed: closed });
}
