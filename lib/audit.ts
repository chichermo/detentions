import { NextRequest } from 'next/server';
import { supabase } from './supabase';
import { TABLES } from './tables';

export const ACTOR_HEADER = 'x-nablijven-actor';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export type AuditLogRow = {
  id: string;
  table_name: string;
  record_id: string;
  action: AuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
};

export function getActorFromRequest(request: NextRequest): string | null {
  const header = request.headers.get(ACTOR_HEADER)?.trim();
  return header || null;
}

export function jsonField(data: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!data) return '';
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function mapAuditTableName(table: string | null): string | null {
  if (!table) return null;
  if (table === 'detentions' || table === TABLES.detentions) return TABLES.detentions;
  if (table === 'students' || table === TABLES.students) return TABLES.students;
  return table;
}

export async function listAuditLogs(options: {
  table?: string | null;
  recordId?: string | null;
  action?: string | null;
  limit?: number;
}): Promise<AuditLogRow[]> {
  if (!supabase) return [];

  const limit = Math.min(Math.max(options.limit ?? 250, 1), 500);
  const tableName = mapAuditTableName(options.table ?? TABLES.detentions);
  const action = options.action?.toUpperCase();
  const tableNames =
    tableName === TABLES.detentions || tableName === 'detentions'
      ? [TABLES.detentions, 'detentions']
      : tableName === TABLES.students || tableName === 'students'
        ? [TABLES.students, 'students']
        : tableName
          ? [tableName]
          : null;

  let query = supabase
    .from(TABLES.auditLogs)
    .select('id, table_name, record_id, action, old_data, new_data, changed_by, changed_at')
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (tableNames) {
    query = query.in('table_name', tableNames);
  }
  if (options.recordId) {
    query = query.eq('record_id', options.recordId);
  }
  if (action === 'INSERT' || action === 'UPDATE' || action === 'DELETE') {
    query = query.eq('action', action);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error listing audit logs:', error);
    throw error;
  }
  return (data || []) as AuditLogRow[];
}

export async function recordDetentionAudit(params: {
  recordId: string;
  action: AuditAction;
  actor?: string | null;
  oldData?: unknown;
  newData?: unknown;
}): Promise<void> {
  if (!supabase || !params.recordId) return;

  const actor = params.actor?.trim() || null;
  const since = new Date(Date.now() - 12_000).toISOString();

  try {
    const { data: recent } = await supabase
      .from(TABLES.auditLogs)
      .select('id, changed_by')
      .in('table_name', [TABLES.detentions, 'detentions'])
      .eq('record_id', params.recordId)
      .eq('action', params.action)
      .gte('changed_at', since)
      .order('changed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.id) {
      if (actor && recent.changed_by !== actor) {
        const { error } = await supabase
          .from(TABLES.auditLogs)
          .update({ changed_by: actor })
          .eq('id', recent.id);
        if (error) console.error('Error stamping audit actor:', error);
      }
      return;
    }

    const { error } = await supabase.from(TABLES.auditLogs).insert({
      id: `audit-${crypto.randomUUID()}`,
      table_name: TABLES.detentions,
      record_id: params.recordId,
      action: params.action,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
      changed_by: actor,
      changed_at: new Date().toISOString(),
    });
    if (error) console.error('Error inserting audit log:', error);
  } catch (error) {
    console.error('Error recording detention audit:', error);
  }
}
