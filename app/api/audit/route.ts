import { NextRequest, NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/audit';
import { TABLES } from '@/lib/tables';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get('table');
    const recordId = searchParams.get('recordId');
    const action = searchParams.get('action');
    const limit = Number(searchParams.get('limit') || (recordId ? 100 : 250));

    const data = await listAuditLogs({
      table: table || (recordId ? null : TABLES.detentions),
      recordId,
      action,
      limit,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in audit API:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
