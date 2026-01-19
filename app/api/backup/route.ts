import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getStudents } from '@/lib/data';
import { getDetentions } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Obtener todos los datos
    const [students, detentions] = await Promise.all([
      getStudents(),
      getDetentions(),
    ]);

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      students,
      detentions,
    };

    return NextResponse.json(backup, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nablijven-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
