import { NextResponse } from 'next/server';
import { getDetentionSessions } from '@/lib/data';

export async function GET() {
  const sessions = await getDetentionSessions();
  return NextResponse.json(sessions);
}
