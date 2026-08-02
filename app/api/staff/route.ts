import { NextRequest, NextResponse } from 'next/server';
import { getStaff, saveStaffMember, saveStaffBulk, deleteStaffMember } from '@/lib/data';
import { StaffMember } from '@/types';
import { fixSemicolonName } from '@/lib/studentImport';

export const dynamic = 'force-dynamic';

export async function GET() {
  const staff = await getStaff();
  return NextResponse.json(staff, {
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (Array.isArray(body?.staff)) {
      const normalized: StaffMember[] = (body.staff as StaffMember[])
        .map((m) => ({
          ...m,
          name: fixSemicolonName(String(m.name || '').trim()),
        }))
        .filter((m) => m.name);
      const result = await saveStaffBulk(normalized);
      if (result.failed && !result.saved) {
        return NextResponse.json(
          {
            success: false,
            error: 'Personeel opslaan mislukt',
            details: result.firstError || 'Geen personeelsleden opgeslagen',
            ...result,
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, ...result });
    }

    const member: StaffMember = {
      id: body.id || `staff-${Date.now()}`,
      name: fixSemicolonName(String(body.name || '').trim()),
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
    };
    if (!member.name) {
      return NextResponse.json(
        { success: false, error: 'Naam is verplicht' },
        { status: 400 }
      );
    }
    await saveStaffMember(member);
    return NextResponse.json({ success: true, staff: member });
  } catch (error) {
    console.error('Error saving staff:', error);
    const details =
      error instanceof Error ? error.message : 'Opslaan mislukt';
    return NextResponse.json(
      { success: false, error: 'Personeel opslaan mislukt', details },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID vereist' }, { status: 400 });
    }
    await deleteStaffMember(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { success: false, error: 'Verwijderen mislukt' },
      { status: 500 }
    );
  }
}
