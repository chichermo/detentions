import { NextRequest, NextResponse } from 'next/server';
import { getDetentions, saveDetention, deleteDetention } from '@/lib/data';
import { Detention } from '@/types';
import { getActorFromRequest } from '@/lib/audit';
import {
  normalizeDetentionStudent,
  normalizeDetentionTeacher,
} from '@/lib/studentImport';
import {
  normalizeDetentionDate,
  validateRequiredDetentionFields,
  validateSessionCapacity,
  validateUniqueStudentOnDate,
} from '@/lib/detentionValidation';

export const dynamic = 'force-dynamic';

function normalizeDetentionNames(detention: Detention): Detention {
  const teacher = normalizeDetentionTeacher(detention.teacher);
  const date = normalizeDetentionDate(detention.date) || detention.date;
  return {
    ...detention,
    date,
    student: normalizeDetentionStudent(detention.student || ''),
    teacher: teacher || undefined,
  };
}

function withDetentionId(detention: Detention): Detention {
  if (detention.id) return detention;
  return {
    ...detention,
    id: `detention-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
}

/** Alle records op dezelfde kalenderdag — ook bij timestamp/timePeriod-varianten. */
async function existingOnSameDay(date: string): Promise<Detention[]> {
  const day = normalizeDetentionDate(date);
  if (!day) return [];
  const all = await getDetentions();
  return all.filter((d) => normalizeDetentionDate(d.date) === day);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  const detentions = await getDetentions();
  const day = date ? normalizeDetentionDate(date) : '';
  const scoped = day
    ? detentions.filter((d) => normalizeDetentionDate(d.date) === day)
    : detentions;
  const normalized = scoped.map(normalizeDetentionNames);
  return NextResponse.json(normalized, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const detention = withDetentionId(normalizeDetentionNames(await request.json()));
    const requiredErr = validateRequiredDetentionFields(detention);
    if (requiredErr) {
      return NextResponse.json(
        { success: false, error: requiredErr, details: requiredErr },
        { status: 400 }
      );
    }

    if (detention.date) {
      const existing = await existingOnSameDay(detention.date);
      const others = existing.filter((d) => d.id !== detention.id);
      const capacityErr = validateSessionCapacity(others.length, 1);
      if (capacityErr) {
        return NextResponse.json(
          { success: false, error: capacityErr, details: capacityErr },
          { status: 400 }
        );
      }
      const dupErr = validateUniqueStudentOnDate(detention, existing, detention.id);
      if (dupErr) {
        return NextResponse.json(
          { success: false, error: dupErr, details: dupErr },
          { status: 400 }
        );
      }
    }

    await saveDetention(detention, getActorFromRequest(request));
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
    const detention = withDetentionId(normalizeDetentionNames(await request.json()));
    const requiredErr = validateRequiredDetentionFields(detention);
    if (requiredErr) {
      return NextResponse.json(
        { success: false, error: requiredErr, details: requiredErr },
        { status: 400 }
      );
    }

    if (detention.date) {
      const existing = await existingOnSameDay(detention.date);
      const dupErr = validateUniqueStudentOnDate(detention, existing, detention.id);
      if (dupErr) {
        return NextResponse.json(
          { success: false, error: dupErr, details: dupErr },
          { status: 400 }
        );
      }
    }

    await saveDetention(detention, getActorFromRequest(request));
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
    
    await deleteDetention(id, getActorFromRequest(request));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting detention:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar detención' },
      { status: 500 }
    );
  }
}
