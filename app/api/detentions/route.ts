import { NextRequest, NextResponse } from 'next/server';
import { getCalendarDaySetting, getDetentions, getStudents, saveDetention, deleteDetention } from '@/lib/data';
import { Detention } from '@/types';
import { getActorFromRequest } from '@/lib/audit';
import {
  normalizeDetentionStudent,
  normalizeDetentionTeacher,
} from '@/lib/studentImport';
import {
  isStudentOnDayList,
  normalizeDetentionDate,
  studentNotOnDayListMessage,
  validateRequiredDetentionFields,
  validateSessionCapacity,
  validateStrafstudieCoversRefusals,
  validateUniqueStudentOnDate,
} from '@/lib/detentionValidation';
import { NABLIJVEN_DATE_ERROR, parseSessionDate } from '@/lib/calendarUtils';
import { withSuggestedSourceDetention } from '@/lib/detentionReports';

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

async function validateDetentionSchedule(detention: Detention): Promise<string | null> {
  const parsed = parseSessionDate(detention.date);
  if (!parsed) return NABLIJVEN_DATE_ERROR;

  detention.date = parsed.date;
  detention.dayOfWeek = parsed.dayOfWeek;

  const cfg = await getCalendarDaySetting(parsed.date);
  if (cfg?.blocked) return 'Deze dag is geblokkeerd. Geen nablijven mogelijk.';
  if (cfg && !cfg.allowDetentions) {
    return 'Voor deze dag zijn geen nablijven toegestaan volgens de kalender.';
  }

  const strafstudieAllowed =
    parsed.dayOfWeek === 'MAANDAG' && cfg?.allowStrafstudie !== false;
  if (detention.isDoublePeriod && !strafstudieAllowed) {
    return 'Op deze dag is geen strafstudie toegestaan. Alleen gewoon nablijven.';
  }
  if (!strafstudieAllowed) {
    detention.isDoublePeriod = false;
    detention.timePeriod = undefined;
  }

  // Strafstudie is altijd maandag, ook voor leerlingen van di/do (opvolging weigering).
  if (!detention.isDoublePeriod) {
    const dayStudents = await getStudents(parsed.dayOfWeek);
    if (dayStudents.length > 0 && !isStudentOnDayList(dayStudents, detention.student)) {
      return studentNotOnDayListMessage(detention.student, parsed.dayOfWeek);
    }
  }
  return null;
}

function scheduleError(message: string) {
  return NextResponse.json(
    { success: false, error: message, details: message },
    { status: 400 }
  );
}

function withDetentionId(detention: Detention): Detention {
  if (detention.id) return detention;
  return {
    ...detention,
    id: `detention-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
}

/** Alle records, plus die op dezelfde kalenderdag (ook bij timestamp/timePeriod-varianten). */
async function loadDetentionsForDate(date: string): Promise<{
  all: Detention[];
  sameDay: Detention[];
}> {
  const all = await getDetentions();
  const day = normalizeDetentionDate(date);
  const sameDay = day
    ? all.filter((d) => normalizeDetentionDate(d.date) === day)
    : [];
  return { all, sameDay };
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
    const scheduleErr = await validateDetentionSchedule(detention);
    if (scheduleErr) return scheduleError(scheduleErr);

    if (detention.date) {
      const { all, sameDay } = await loadDetentionsForDate(detention.date);
      const others = sameDay.filter((d) => d.id !== detention.id);
      const capacityErr = validateSessionCapacity(others.length, 1);
      if (capacityErr) {
        return NextResponse.json(
          { success: false, error: capacityErr, details: capacityErr },
          { status: 400 }
        );
      }
      const dupErr = validateUniqueStudentOnDate(detention, sameDay, detention.id);
      if (dupErr) {
        return NextResponse.json(
          { success: false, error: dupErr, details: dupErr },
          { status: 400 }
        );
      }
      const mergeErr = validateStrafstudieCoversRefusals(detention, all, detention.id);
      if (mergeErr) {
        return NextResponse.json(
          { success: false, error: mergeErr, details: mergeErr },
          { status: 400 }
        );
      }
      const previous = all.find((d) => d.id === detention.id);
      Object.assign(detention, withSuggestedSourceDetention(detention, all, previous));
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
    const scheduleErr = await validateDetentionSchedule(detention);
    if (scheduleErr) return scheduleError(scheduleErr);

    if (detention.date) {
      const { all, sameDay } = await loadDetentionsForDate(detention.date);
      const dupErr = validateUniqueStudentOnDate(detention, sameDay, detention.id);
      if (dupErr) {
        return NextResponse.json(
          { success: false, error: dupErr, details: dupErr },
          { status: 400 }
        );
      }
      const mergeErr = validateStrafstudieCoversRefusals(detention, all, detention.id);
      if (mergeErr) {
        return NextResponse.json(
          { success: false, error: mergeErr, details: mergeErr },
          { status: 400 }
        );
      }
      const previous = all.find((d) => d.id === detention.id);
      Object.assign(detention, withSuggestedSourceDetention(detention, all, previous));
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
