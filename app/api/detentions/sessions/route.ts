import { NextResponse } from 'next/server';
import { getDetentionSessions } from '@/lib/data';
import {
  normalizeDetentionStudent,
  normalizeDetentionTeacher,
} from '@/lib/studentImport';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sessions = await getDetentionSessions();
  // Normalize accents on read (same as /api/detentions) for home/calendar cards
  const normalized = sessions.map((session) => ({
    ...session,
    detentions: session.detentions.map((d) => {
      const teacher = normalizeDetentionTeacher(d.teacher);
      return {
        ...d,
        student: normalizeDetentionStudent(d.student || ''),
        teacher: teacher || undefined,
      };
    }),
  }));
  return NextResponse.json(normalized, {
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });
}
