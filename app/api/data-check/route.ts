import { NextResponse } from 'next/server';
import { getStudents, getDetentions } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configured = !!supabase;
    const [students, detentions] = await Promise.all([getStudents(), getDetentions()]);

    const sessions = new Set(detentions.map((d) => d.date)).size;

    return NextResponse.json({
      ok: configured,
      configured,
      counts: {
        students: students.length,
        detentions: detentions.length,
        sessions,
      },
      message: configured
        ? 'Gegevens geladen van Supabase'
        : 'Supabase niet geconfigureerd — geen serverdata beschikbaar',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, configured: !!supabase, error: message, counts: { students: 0, detentions: 0, sessions: 0 } },
      { status: 500 }
    );
  }
}
