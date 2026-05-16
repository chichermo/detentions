import { NextRequest, NextResponse } from 'next/server';
import {
  getCalendarDaySettings,
  getCalendarDaySetting,
  saveCalendarDaySetting,
} from '@/lib/data';
import { CalendarDaySetting } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (date) {
    const setting = await getCalendarDaySetting(date);
    return NextResponse.json(setting);
  }

  const settings = await getCalendarDaySettings(start || undefined, end || undefined);
  return NextResponse.json(settings, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const setting: CalendarDaySetting = await request.json();
    await saveCalendarDaySetting(setting);
    return NextResponse.json({ success: true, setting });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Fout bij opslaan';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
