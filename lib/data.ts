import { Student, Detention, DetentionSession, DayOfWeek, CalendarDaySetting } from '@/types';
import { supabase } from './supabase';

// Detectar si Supabase está configurado
const useSupabase = supabase !== null;

// Funciones para estudiantes
export async function getStudents(day?: DayOfWeek): Promise<Student[]> {
  try {
    if (useSupabase && supabase) {
      let query = supabase.from('students').select('*');
      
      if (day) {
        query = query.eq('day', day);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }
      
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        day: s.day as DayOfWeek,
      }));
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
      const { error } = await supabase
        .from('students')
        .upsert({
          id: student.id,
          name: student.name,
          grade: student.grade,
          day: student.day,
        }, {
          onConflict: 'id'
        });
      
      if (error) {
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

export async function deleteStudent(id: string): Promise<void> {
  try {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from('students')
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
      let query = supabase.from('detentions').select('*');
      
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
        .from('detentions')
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
        .from('detentions')
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
        .from('detentions')
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
    noticeTitle: (row.notice_title as string) || undefined,
    notice: (row.notice as string) || undefined,
  };
}

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
    .from('app_settings')
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
  const { error } = await supabase.from('app_settings').upsert(
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
    if (useSupabase && supabase) {
      let query = supabase.from('calendar_day_settings').select('*');
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      const { data, error } = await query.order('date');
      if (error) {
        if (isMissingRelationError(error)) {
          const fromSettings = await loadCalendarDaysFromAppSettings();
          return fromSettings.filter((s) => {
            if (startDate && s.date < startDate) return false;
            if (endDate && s.date > endDate) return false;
            return true;
          });
        }
        console.error('Error fetching calendar days:', error);
        return [];
      }
      return (data || []).map((r: Record<string, unknown>) => mapCalendarDayRow(r));
    }
    return [];
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

  const { error } = await supabase.from('calendar_day_settings').upsert(
    {
      date: setting.date,
      blocked: setting.blocked,
      allow_detentions: setting.allowDetentions,
      notice_title: setting.noticeTitle || null,
      notice: setting.notice || null,
    },
    { onConflict: 'date' }
  );

  if (!error) return;

  // Fallback: app_settings (werkt ook als calendar_day_settings-tabel nog ontbreekt)
  if (isMissingRelationError(error)) {
    await saveCalendarDayToAppSettings(setting);
    return;
  }

  console.error('Error saving calendar day:', error);
  throw new Error(supabaseErrorMessage(error, 'Fout bij opslaan van kalenderdag'));
}
