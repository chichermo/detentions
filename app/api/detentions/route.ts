import { NextRequest, NextResponse } from 'next/server';
import { getDetentions, saveDetention, deleteDetention } from '@/lib/data';
import { Detention } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  
  const detentions = await getDetentions(date || undefined);
  return NextResponse.json(detentions);
}

export async function POST(request: NextRequest) {
  try {
    const detention: Detention = await request.json();
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
    const detention: Detention = await request.json();
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
