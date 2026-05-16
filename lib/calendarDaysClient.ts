'use client';

import { CalendarDaySetting } from '@/types';
import { apiFetch } from './apiClient';

const LS_KEY = 'nablijven_calendar_days';

function readLocal(): Record<string, CalendarDaySetting> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocal(map: Record<string, CalendarDaySetting>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

export async function fetchCalendarDays(
  start: string,
  end: string
): Promise<CalendarDaySetting[]> {
  const local = readLocal();
  let remote: CalendarDaySetting[] = [];
  try {
    const res = await apiFetch(
      `/api/calendar-days?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
    if (res.ok) {
      const data = await res.json();
      remote = Array.isArray(data) ? data : [];
    }
  } catch {
    /* offline */
  }

  const merged = new Map<string, CalendarDaySetting>();
  Object.values(local).forEach((s) => {
    if (s.date >= start && s.date <= end) merged.set(s.date, s);
  });
  remote.forEach((s) => merged.set(s.date, s));
  return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function saveCalendarDay(setting: CalendarDaySetting): Promise<void> {
  const local = readLocal();
  local[setting.date] = setting;
  writeLocal(local);

  try {
    const res = await apiFetch('/api/calendar-days', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setting),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Opslaan mislukt');
    }
  } catch (e) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    throw e;
  }
}

export function getDaySettingFromList(
  date: string,
  list: CalendarDaySetting[]
): CalendarDaySetting | undefined {
  return list.find((s) => s.date === date);
}
