import { NextRequest, NextResponse } from 'next/server';
import { getDetentions, saveDetention, deleteDetention } from '@/lib/data';
import { Detention } from '@/types';
import {
  normalizeDetentionStudent,
  normalizeDetentionTeacher,
} from '@/lib/studentImport';
import { validateRequiredDetentionFields } from '@/lib/detentionValidation';

export const dynamic = 'force-dynamic';

function normalizeDetentionNames(detention: Detention): Detention {
  const teacher = normalizeDetentionTeacher(detention.teacher);
  return {
    ...detention,
    student: normalizeDetentionStudent(detention.student || ''),
    teacher: teacher || undefined,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  
  const detentions = await getDetentions(date || undefined);
  // Normalize accents on read so legacy "Jos é" displays as "José"
  const normalized = detentions.map(normalizeDetentionNames);
  return NextResponse.json(normalized, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const detention = normalizeDetentionNames(await request.json());
    const requiredErr = validateRequiredDetentionFields(detention);
    if (requiredErr) {
      return NextResponse.json(
        { success: false, error: requiredErr, details: requiredErr },
        { status: 400 }
      );
    }
    await saveDetention(detention);
    return NextResponse.json({ success: true, detention });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Fout bij opslaan van nablijven';
    console.error('Error saving detention:', error);
    return NextResponse.json(
      { success: false, error: 'Fout bij opslaan van nablijven', details: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const detention = normalizeDetentionNames(await request.json());
    const requiredErr = validateRequiredDetentionFields(detention);
    if (requiredErr) {
      return NextResponse.json(
        { success: false, error: requiredErr, details: requiredErr },
        { status: 400 }
      );
    }
    await saveDetention(detention);
    return NextResponse.json({ success: true, detention });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Fout bij bijwerken van nablijven';
    console.error('Error updating detention:', error);
    return NextResponse.json(
      { success: false, error: 'Fout bij bijwerken van nablijven', details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      );
    }
    
    await deleteDetention(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting detention:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar detención' },
      { status: 500 }
    );
  }
}
