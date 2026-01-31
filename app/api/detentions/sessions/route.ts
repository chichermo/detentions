import { NextResponse } from 'next/server';
import { getDetentionSessions } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sessions = await getDetentionSessions();
  return NextResponse.json(sessions, {
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });
}
