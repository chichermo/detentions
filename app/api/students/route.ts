import { NextRequest, NextResponse } from 'next/server';
import { getStudents, saveStudent, saveStudentsBulk, deleteStudent } from '@/lib/data';
import { Student, DayOfWeek } from '@/types';
import { fixSemicolonName, normalizeGrade } from '@/lib/studentImport';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const day = searchParams.get('day') as DayOfWeek | null;
  
  const students = await getStudents(day || undefined);
  return NextResponse.json(students, {
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // One-shot: herstel "Achternaam;Voornaam" en "1Aarde" → nette waarden
    if (body?.repairNames === true) {
      const all = await getStudents(undefined);
      const toFix = all.filter(
        (s) =>
          /[;,]/.test(s.name) ||
          /([a-zà-ÿ])([A-ZÀ-Ÿ])/.test(s.name) ||
          /\d[A-Za-zÀ-ÿ]/.test(s.grade || '')
      );
      const repaired: Student[] = toFix.map((s) => ({
        ...s,
        name: fixSemicolonName(s.name),
        grade: normalizeGrade(s.grade || ''),
      }));
      const result = await saveStudentsBulk(repaired);
      return NextResponse.json({
        success: true,
        repaired: repaired.length,
        ...result,
        sample: repaired.slice(0, 5).map((s) => s.name),
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
