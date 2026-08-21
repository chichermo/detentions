import { Student, StaffMember, Detention, DetentionSession, DayOfWeek, CalendarDaySetting } from '@/types';
import { supabase } from './supabase';
import { TABLES } from './tables';
import { sortStudentsByClass } from './studentImport';

// Detectar si Supabase está configurado
const useSupabase = supabase !== null;

const STAFF_SETTINGS_KEY = 'nablijven_staff';

function isMissingRelationError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table')
  );
}

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    msg.includes('allow_strafstudie') ||
    (msg.includes('column') && msg.includes('does not exist'))
  );
}

function mapStaffRow(s: { id: string; name: string; sort_order?: number; sortOrder?: number }): StaffMember {
  return {
    id: s.id,
    name: s.name,
    sortOrder:
      typeof s.sort_order === 'number'
        ? s.sort_order
        : typeof s.sortOrder === 'number'
          ? s.sortOrder
          : undefined,
  };
}

async function loadStaffFromAppSettings(): Promise<StaffMember[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLES.appSettings)
    .select('value')
    .eq('key', STAFF_SETTINGS_KEY)
    .maybeSingle();
  if (error) {
    if (isMissingRelationError(error)) return [];
    console.error('Error loading staff from app_settings:', error);
    return [];
  }
  const value = data?.value;
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => mapStaffRow(row as { id: string; name: string; sortOrder?: number }))
    .filter((m) => m.id && m.name)
    .sort((a, b) => {
      const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name, 'nl');
    });
}

async function writeStaffToAppSettings(members: StaffMember[]): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured.');
  const { error } = await supabase.from(TABLES.appSettings).upsert(
    {
      key: STAFF_SETTINGS_KEY,
      value: members.map((m) => ({
        id: m.id,
        name: m.name,
        sortOrder: m.sortOrder,
      })),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );
  if (error) throw error;
}

async function upsertStaffInAppSettings(members: StaffMember[]): Promise<number> {
  const existing = await loadStaffFromAppSettings();
  const byId = new Map(existing.map((m) => [m.id, m]));
  const byName = new Map(existing.map((m) => [m.name.toLowerCase(), m.id]));
  for (const member of members) {
    const name = member.name.trim();
    if (!name) continue;
    const nameKey = name.toLowerCase();
    const existingId = byName.get(nameKey);
    if (existingId && existingId !== member.id) {
      byId.delete(existingId);
    }
    byId.set(member.id, { ...member, name });
    byName.set(nameKey, member.id);
  }
  const next = Array.from(byId.values());
  await writeStaffToAppSettings(next);
  return members.filter((m) => m.name.trim()).length;
}

// Funciones para estudiantes
export async function getStudents(day?: DayOfWeek): Promise<Student[]> {
  try {
    if (useSupabase && supabase) {
      let query = supabase.from(TABLES.students).select('*');
      
      if (day) {
        query = query.eq('day', day);
      }
      
      // Primair op klas, daarna naam (sort_order niet meer leidend)
      const { data, error } = await query
        .order('grade', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }
      
      return sortStudentsByClass(
        (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          grade: s.grade || '',
          day: s.day as DayOfWeek,
          sortOrder: typeof s.sort_order === 'number' ? s.sort_order : undefined,
        }))
      );
    }
    
    // Fallback: retornar array vacío si no hay Supabase
    return [];
  } catch (error) {
    console.error('Error in getStudents:', error);
    return [];
  }
}

export async function saveStudent(student: Student): Promise<void> {
  try {
    if (useSupabase && supabase) {
      const payload: Record<string, unknown> = {
          id: student.id,
          name: student.name,
          grade: student.grade,
          day: student.day,
        };
        if (typeof student.sortOrder === 'number') {
          payload.sort_order = student.sortOrder;
        }
      const { error } = await supabase
        .from(TABLES.students)
        .upsert(payload, {
          onConflict: 'id'
        });
      
      if (error) {
        // Retry zonder sort_order als kolom ontbreekt
        if (/sort_order/i.test(error.message || '') && 'sort_order' in payload) {
          delete payload.sort_order;
          const retry = await supabase.from(TABLES.students).upsert(payload, { onConflict: 'id' });
          if (retry.error) {
            console.error('Error saving student:', retry.error);
            throw retry.error;
          }
          return;
        }
        console.error('Error saving student:', error);
        throw error;
      }
    } else {
      throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }
  } catch (error) {
    console.error('Error in saveStudent:', error);
    throw error;
  }
}

export async function saveStudentsBulk(
  students: Student[]
): Promise<{ saved: number; failed: number; firstError?: string }> {
  if (!useSupabase || !supabase) {
    throw new Error(
      'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const toRow = (student: Student, includeSort: boolean) => {
    const row: Record<string, unknown> = {
      id: student.id,
      name: student.name,
      grade: student.grade,
      day: student.day,
    };
    if (includeSort && typeof student.sortOrder === 'number') {
      row.sort_order = student.sortOrder;
    }
    return row;
  };

  let includeSort = students.some((s) => typeof s.sortOrder === 'number');
  const chunkSize = 100;
  let saved = 0;
  let failed = 0;
  let firstError: string | undefined;

  for (let i = 0; i < students.length; i += chunkSize) {
    const chunk = students.slice(i, i + chunkSize);
    let { error } = await supabase
      .from(TABLES.students)
      .upsert(chunk.map((s) => toRow(s, includeSort)), { onConflict: 'id' });

    if (error && includeSort && /sort_order/i.test(error.message || '')) {
      includeSort = false;
      ({ error } = await supabase
        .from(TABLES.students)
        .upsert(chunk.map((s) => toRow(s, false)), { onConflict: 'id' }));
    }

    if (error) {
      // Fallback: één-voor-één zodat partiële imports lukken
      for (const student of chunk) {
        try {
          await saveStudent(student);
          saved += 1;
        } catch (err) {
          failed += 1;
          if (!firstError) {
            firstError =
              err && typeof err === 'object' && 'message' in err
                ? String((err as { message: unknown }).message)
                : 'Opslaan mislukt';
          }
        }
      }
    } else {
      saved += chunk.length;
    }
  }

  return { saved, failed, firstError };
}

export async function deleteStudent(id: string): Promise<void> {
  try {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from(TABLES.students)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting student:', error);
        throw error;
      }
    } else {
      throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    throw error;
  }
}

export async function getStaff(): Promise<StaffMember[]> {
  try {
    if (useSupabase && supabase) {
      const { data, error } = await supabase
        .from(TABLES.staff)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        if (isMissingRelationError(error)) {
          return loadStaffFromAppSettings();
        }
        if (/sort_order/i.test(error.message || '')) {
          const second = await supabase.from(TABLES.staff).select('*').order('name');
          if (second.error) {
            if (isMissingRelationError(second.error)) {
              return loadStaffFromAppSettings();
            }
            console.error('Error fetching staff:', second.error);
            return [];
          }
          return (second.data || []).map((s: { id: string; name: string }) => mapStaffRow(s));
        }
        console.error('Error fetching staff:', error);
        return [];
      }

      return (data || []).map((s: { id: string; name: string; sort_order?: number }) =>
        mapStaffRow(s)
      );
    }
    return [];
  } catch (error) {
    console.error('Error in getStaff:', error);
    try {
      return await loadStaffFromAppSettings();
    } catch {
      return [];
    }
  }
}

export async function saveStaffMember(member: StaffMember): Promise<void> {
  if (!useSupabase || !supabase) {
    throw new Error('Supabase not configured.');
  }
  const payload: Record<string, unknown> = {
    id: member.id,
    name: member.name.trim(),
  };
  if (typeof member.sortOrder === 'number') {
    payload.sort_order = member.sortOrder;
  }
  const { error } = await supabase.from(TABLES.staff).upsert(payload, { onConflict: 'id' });
  if (!error) return;

  if (/sort_order/i.test(error.message || '') && 'sort_order' in payload) {
    delete payload.sort_order;
    const retry = await supabase.from(TABLES.staff).upsert(payload, { onConflict: 'id' });
    if (!retry.error) return;
    if (isMissingRelationError(retry.error)) {
      await upsertStaffInAppSettings([member]);
      return;
    }
    throw retry.error;
  }

  if (isMissingRelationError(error)) {
    await upsertStaffInAppSettings([member]);
    return;
  }
  throw error;
}

export async function saveStaffBulk(
  members: StaffMember[]
): Promise<{ saved: number; failed: number; firstError?: string }> {
  if (!useSupabase || !supabase) {
    throw new Error('Supabase not configured.');
  }
  if (!members.length) {
    return { saved: 0, failed: 0 };
  }

  let saved = 0;
  let failed = 0;
  let firstError: string | undefined;
  const chunkSize = 80;
  let useSettingsFallback = false;

  for (let i = 0; i < members.length; i += chunkSize) {
    if (useSettingsFallback) break;

    const chunk = members.slice(i, i + chunkSize).map((m) => {
      const row: Record<string, unknown> = { id: m.id, name: m.name.trim() };
      if (typeof m.sortOrder === 'number') row.sort_order = m.sortOrder;
      return row;
    });
    const { error } = await supabase.from(TABLES.staff).upsert(chunk, { onConflict: 'id' });
    if (error) {
      if (isMissingRelationError(error)) {
        useSettingsFallback = true;
        break;
      }
      // Retry zonder sort_order
      if (/sort_order/i.test(error.message || '')) {
        const withoutSort = chunk.map((row) => {
          const { sort_order: _ignored, ...rest } = row as Record<string, unknown>;
          return rest;
        });
        const retry = await supabase.from(TABLES.staff).upsert(withoutSort, { onConflict: 'id' });
        if (retry.error) {
          if (isMissingRelationError(retry.error)) {
            useSettingsFallback = true;
            break;
          }
          failed += chunk.length;
          if (!firstError) firstError = retry.error.message;
          continue;
        }
        saved += chunk.length;
        continue;
      }
      failed += chunk.length;
      if (!firstError) firstError = error.message;
      continue;
    }
    saved += chunk.length;
  }

  if (useSettingsFallback) {
    try {
      const n = await upsertStaffInAppSettings(members);
      return { saved: n, failed: 0 };
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Personeel opslaan via app_settings mislukt';
      return { saved: 0, failed: members.length, firstError: msg };
    }
  }

  return { saved, failed, firstError };
}

export async function deleteStaffMember(id: string): Promise<void> {
  if (!useSupabase || !supabase) {
    throw new Error('Supabase not configured.');
  }
  const { error } = await supabase.from(TABLES.staff).delete().eq('id', id);
  if (!error) return;
  if (isMissingRelationError(error)) {
    const existing = await loadStaffFromAppSettings();
    await writeStaffToAppSettings(existing.filter((m) => m.id !== id));
    return;
  }
  throw error;
}

function mapDetentionRow(d: Record<string, unknown>): Detention {
  return {
    id: d.id as string,
    number: d.number as number,
    date: d.date as string,
    dayOfWeek: d.day_of_week as DayOfWeek,
    student: d.student as string,
    teacher: (d.teacher as string) || undefined,
    reason: (d.reason as string) || undefined,
    task: (d.task as string) || undefined,
    lvsDate: (d.lvs_date as string) || undefined,
    shouldPrint: (d.should_print as boolean) || false,
    canUseChromebook: (d.can_use_chromebook as boolean) || false,
    extraNotes: (d.extra_notes as string) || undefined,
    isDoublePeriod: (d.is_double_period as boolean) || false,
    timePeriod: (d.time_period as Detention['timePeriod']) || undefined,
    nablijvenGeweigerd: (d.nablijven_geweigerd as boolean) || false,
    didNotAttend: (d.did_not_attend as boolean) || false,
    sourceDetentionId: (d.source_detention_id as string) || undefined,
  };
}

// Funciones para detenciones
export async function getDetentions(date?: string): Promise<Detention[]> {
  try {
    if (useSupabase && supabase) {
      let query = supabase.from(TABLES.detentions).select('*');
      
      if (date) {
        query = query.eq('date', date);
      }
      
      const { data, error } = await query.order('number');
      
      if (error) {
        console.error('Error fetching detentions:', error);
        return [];
      }
      
      return (data || []).map((d: Record<string, unknown>) => mapDetentionRow(d));
    }
    
    // Fallback: retornar array vacío si no hay Supabase
    return [];
  } catch (error) {
    console.error('Error in getDetentions:', error);
    return [];
  }
}

export async function getDetentionsByDateRange(startDate: string, endDate: string): Promise<Detention[]> {
  try {
    if (useSupabase && supabase) {
      const { data, error } = await supabase
        .from(TABLES.detentions)
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('number');
      
      if (error) {
        console.error('Error fetching detentions by date range:', error);
        return [];
      }
      
      return (data || []).map((d: Record<string, unknown>) => mapDetentionRow(d));
    }
    
    return [];
  } catch (error) {
    console.error('Error in getDetentionsByDateRange:', error);
    return [];
  }
}

export async function saveDetention(detention: Detention): Promise<void> {
  try {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from(TABLES.detentions)
        .upsert({
          id: detention.id,
          number: detention.number,
          date: detention.date,
          day_of_week: detention.dayOfWeek,
          student: detention.student,
          teacher: detention.teacher || null,
          reason: detention.reason || null,
          task: detention.task || null,
          lvs_date: detention.lvsDate || null,
          should_print: detention.shouldPrint,
          can_use_chromebook: detention.canUseChromebook,
          extra_notes: detention.extraNotes || null,
          is_double_period: detention.isDoublePeriod || false,
          time_period: detention.timePeriod || null,
          nablijven_geweigerd: detention.nablijvenGeweigerd || false,
          did_not_attend: detention.didNotAttend || false,
          source_detention_id: detention.sourceDetentionId || null,
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        console.error('Error saving detention:', error);
        throw error;
      }
    } else {
      throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }
  } catch (error) {
    console.error('Error in saveDetention:', error);
    throw error;
  }
}

export async function deleteDetention(id: string): Promise<void> {
  try {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from(TABLES.detentions)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting detention:', error);
        throw error;
      }
    } else {
      throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }
  } catch (error) {
    console.error('Error in deleteDetention:', error);
    throw error;
  }
}

export async function getDetentionSessions(): Promise<DetentionSession[]> {
  try {
    const detentions = await getDetentions();
    const sessionsMap = new Map<string, Detention[]>();
    
    detentions.forEach(detention => {
      if (!sessionsMap.has(detention.date)) {
        sessionsMap.set(detention.date, []);
      }
      sessionsMap.get(detention.date)!.push(detention);
    });
    
    return Array.from(sessionsMap.entries()).map(([date, detentions]) => ({
      date,
      dayOfWeek: detentions[0].dayOfWeek,
      detentions: detentions.sort((a, b) => a.number - b.number),
    })).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error in getDetentionSessions:', error);
    return [];
  }
}

function mapCalendarDayRow(row: Record<string, unknown>): CalendarDaySetting {
  return {
    date: row.date as string,
    blocked: (row.blocked as boolean) ?? false,
    allowDetentions: row.allow_detentions !== false,
    allowStrafstudie: row.allow_strafstudie !== false,
    noticeTitle: (row.notice_title as string) || undefined,
    notice: (row.notice as string) || undefined,
  };
}

function supabaseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const e = error as { message?: string; details?: string; hint?: string; code?: string };
    if (e.message) {
      if (isMissingRelationError(e)) {
        return (
          'Tabel calendar_day_settings ontbreekt of de database is onbereikbaar. ' +
          'Controleer Supabase / voer supabase/migration_calendar_and_attendance.sql uit.'
        );
      }
      return e.message;
    }
  }
  return fallback;
}

const CALENDAR_SETTINGS_KEY = 'nablijven_calendar_days';

async function loadCalendarDaysFromAppSettings(): Promise<CalendarDaySetting[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLES.appSettings)
    .select('value')
    .eq('key', CALENDAR_SETTINGS_KEY)
    .maybeSingle();
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw new Error(supabaseErrorMessage(error, 'Kon kalenderinstellingen niet laden'));
  }
  const value = data?.value;
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((row) =>
      mapCalendarDayRow({
        date: row.date,
        blocked: row.blocked,
        allow_detentions: row.allowDetentions ?? row.allow_detentions,
        allow_strafstudie: row.allowStrafstudie ?? row.allow_strafstudie,
        notice_title: row.noticeTitle ?? row.notice_title,
        notice: row.notice,
      })
    );
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, CalendarDaySetting>).map((row) =>
      mapCalendarDayRow({
        date: row.date,
        blocked: row.blocked,
        allow_detentions: row.allowDetentions,
        allow_strafstudie: row.allowStrafstudie,
        notice_title: row.noticeTitle,
        notice: row.notice,
      })
    );
  }
  return [];
}

async function saveCalendarDayToAppSettings(setting: CalendarDaySetting): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const existing = await loadCalendarDaysFromAppSettings();
  const map: Record<string, CalendarDaySetting> = {};
  for (const row of existing) map[row.date] = row;
  map[setting.date] = setting;
  const { error } = await supabase.from(TABLES.appSettings).upsert(
    {
      key: CALENDAR_SETTINGS_KEY,
      value: map,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );
  if (error) throw new Error(supabaseErrorMessage(error, 'Kon kalenderinstelling niet opslaan'));
}

export async function getCalendarDaySettings(
  startDate?: string,
  endDate?: string
): Promise<CalendarDaySetting[]> {
  try {
    let fromTable: CalendarDaySetting[] = [];
    let fromSettings: CalendarDaySetting[] = [];

    try {
      fromSettings = await loadCalendarDaysFromAppSettings();
    } catch {
      fromSettings = [];
    }

    if (useSupabase && supabase) {
      let query = supabase.from(TABLES.calendarDaySettings).select('*');
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      const { data, error } = await query.order('date');
      if (error) {
        if (!isMissingRelationError(error)) {
          console.error('Error fetching calendar days:', error);
        }
      } else {
        fromTable = (data || []).map((r: Record<string, unknown>) => mapCalendarDayRow(r));
      }
    }

    const merged = new Map<string, CalendarDaySetting>();
    for (const row of fromTable) merged.set(row.date, row);
    for (const row of fromSettings) {
      const prev = merged.get(row.date);
      merged.set(row.date, prev ? { ...prev, ...row, date: row.date } : row);
    }

    return Array.from(merged.values())
      .filter((s) => {
        if (startDate && s.date < startDate) return false;
        if (endDate && s.date > endDate) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error in getCalendarDaySettings:', error);
    try {
      const fromSettings = await loadCalendarDaysFromAppSettings();
      return fromSettings.filter((s) => {
        if (startDate && s.date < startDate) return false;
        if (endDate && s.date > endDate) return false;
        return true;
      });
    } catch {
      return [];
    }
  }
}

export async function getCalendarDaySetting(date: string): Promise<CalendarDaySetting | null> {
  const all = await getCalendarDaySettings(date, date);
  return all[0] ?? null;
}

export async function saveCalendarDaySetting(setting: CalendarDaySetting): Promise<void> {
  if (!useSupabase || !supabase) {
    throw new Error(
      'Supabase is niet geconfigureerd. Zet NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const { error } = await supabase.from(TABLES.calendarDaySettings).upsert(
    {
      date: setting.date,
      blocked: setting.blocked,
      allow_detentions: setting.allowDetentions,
      allow_strafstudie: setting.allowStrafstudie !== false,
      notice_title: setting.noticeTitle || null,
      notice: setting.notice || null,
    },
    { onConflict: 'date' }
  );

  if (!error) return;

  // Fallback: app_settings (werkt ook als calendar_day_settings-tabel of kolom nog ontbreekt)
  if (isMissingRelationError(error) || isMissingColumnError(error)) {
    if (isMissingColumnError(error) && !isMissingRelationError(error)) {
      // Probeer zonder nieuwe kolom te upserten, bewaar allowStrafstudie via app_settings
      const { error: retryError } = await supabase.from(TABLES.calendarDaySettings).upsert(
        {
          date: setting.date,
          blocked: setting.blocked,
          allow_detentions: setting.allowDetentions,
          notice_title: setting.noticeTitle || null,
          notice: setting.notice || null,
        },
        { onConflict: 'date' }
      );
      if (retryError && !isMissingRelationError(retryError)) {
        console.error('Error saving calendar day (retry):', retryError);
      }
    }
    await saveCalendarDayToAppSettings(setting);
    return;
  }

  console.error('Error saving calendar day:', error);
  throw new Error(supabaseErrorMessage(error, 'Fout bij opslaan van kalenderdag'));
}
