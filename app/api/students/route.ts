import { NextRequest, NextResponse } from 'next/server';
import { getStudents, saveStudent, deleteStudent } from '@/lib/data';
import { Student, DayOfWeek } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const day = searchParams.get('day') as DayOfWeek | null;
  
  const students = getStudents(day || undefined);
  return NextResponse.json(students);
}

export async function POST(request: NextRequest) {
  try {
    const student: Student = await request.json();
    saveStudent(student);
    return NextResponse.json({ success: true, student });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al guardar estudiante' },
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
    
    deleteStudent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al eliminar estudiante' },
      { status: 500 }
    );
  }
}
