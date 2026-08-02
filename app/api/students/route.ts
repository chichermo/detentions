import { NextRequest, NextResponse } from 'next/server';
import { getStudents, saveStudent, saveStudentsBulk, deleteStudent } from '@/lib/data';
import { Student, DayOfWeek } from '@/types';
import {
  alignNamesToReferenceDay,
  fixSemicolonName,
  flipTwoTokenName,
  normalizeGrade,
} from '@/lib/studentImport';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const day = searchParams.get('day') as DayOfWeek | null;
  
  const students = await getStudents(day || undefined);
  // Normalize accents on read so legacy "Jos é" displays as "José"
  const normalized = students.map((s) => ({
    ...s,
    name: fixSemicolonName(String(s.name || '')),
    grade: normalizeGrade(s.grade || ''),
  }));
  return NextResponse.json(normalized, {
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // One-shot: herstel "Achternaam;Voornaam", "1Aarde", en volgorde t.o.v. MAANDAG
    if (body?.repairNames === true) {
      const all = await getStudents(undefined);
      const referenceDay = String(body.referenceDay || 'MAANDAG').toUpperCase();

      let normalized: Student[] = all.map((s) => ({
        ...s,
        name: fixSemicolonName(s.name),
        grade: normalizeGrade(s.grade || ''),
      }));

      // Optioneel: alle 2-woordnamen omdraaien (Achternaam Voornaam → Voornaam Achternaam)
      if (body.flipTwoTokenNames === true) {
        const days: string[] | null = Array.isArray(body.flipDays)
          ? body.flipDays.map((d: string) => String(d).toUpperCase())
          : null;
        normalized = normalized.map((s) => {
          if (days && !days.includes(String(s.day || '').toUpperCase())) return s;
          return { ...s, name: flipTwoTokenName(s.name) };
        });
      }

      // Zelfde leerling op andere dagen → zelfde volgorde als referencedag
      normalized = alignNamesToReferenceDay(normalized, referenceDay);

      const byId = new Map(all.map((s) => [s.id, s]));
      const toSave = normalized.filter((s) => {
        const prev = byId.get(s.id);
        return !prev || prev.name !== s.name || (prev.grade || '') !== (s.grade || '');
      });

      const result = toSave.length
        ? await saveStudentsBulk(toSave)
        : { saved: 0, failed: 0 };
      return NextResponse.json({
        success: true,
        repaired: toSave.length,
        referenceDay,
        ...result,
        sample: toSave.slice(0, 8).map((s) => ({
          day: s.day,
          name: s.name,
          grade: s.grade,
        })),
      });
    }

    // Bulk: { students: Student[] }
    if (Array.isArray(body?.students)) {
      const normalized = (body.students as Student[]).map((s) => ({
        ...s,
        name: fixSemicolonName(s.name),
        grade: normalizeGrade(s.grade || ''),
      }));
      const result = await saveStudentsBulk(normalized);
      return NextResponse.json({ success: true, ...result });
    }

    const student: Student = {
      ...body,
      name: fixSemicolonName(body.name || ''),
      grade: normalizeGrade(body.grade || ''),
    };
    await saveStudent(student);
    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error('Error saving student:', error);
    const details =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : error instanceof Error
          ? error.message
          : 'Error al guardar estudiante';
    return NextResponse.json(
      { success: false, error: 'Error al guardar estudiante', details },
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
    
    await deleteStudent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar estudiante' },
      { status: 500 }
    );
  }
}
