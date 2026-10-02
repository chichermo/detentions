import { DayOfWeek } from '@/types';
import { getDay, parseISO, addDays, format } from 'date-fns';

export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const dayOfWeek = getDay(parseISO(dateStr));
  const dayMap: Record<number, DayOfWeek> = {
    1: 'MAANDAG',
    2: 'DINSDAG',
    4: 'DONDERDAG',
  };
  return dayMap[dayOfWeek] ?? 'MAANDAG';
}

/** Nablijven alleen op maandag, dinsdag en donderdag. */
export function isNablijvenWeekday(date: Date): boolean {
  const d = getDay(date);
  return d === 1 || d === 2 || d === 4;
}

export function nablijvenDayLabel(day: DayOfWeek): string {
  if (day === 'MAANDAG') return 'maandag';
  if (day === 'DINSDAG') return 'dinsdag';
  return 'donderdag';
}

export const NABLIJVEN_DATE_ERROR =
  'Kies een maandag, dinsdag of donderdag. Het nablijven kan alleen op die dagen.';

/** Eerstvolgende maandag, dinsdag of donderdag, vandaag inbegrepen. */
export function upcomingNablijvenDate(from: Date = new Date()): string {
  let d = from;
  for (let i = 0; i < 7; i++) {
    if (isNablijvenWeekday(d)) return format(d, 'yyyy-MM-dd');
    d = addDays(d, 1);
  }
  return format(from, 'yyyy-MM-dd');
}

export function isMonday(date: Date): boolean {
  return getDay(date) === 1;
}

/** Geldige nablijvendag (ma/di/do) of null. */
export function parseSessionDate(
  dateStr: string
): { date: string; dayOfWeek: DayOfWeek } | null {
  const value = String(dateStr || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = parseISO(value);
  if (Number.isNaN(d.getTime()) || !isNablijvenWeekday(d)) return null;
  return { date: value, dayOfWeek: getDayOfWeekFromDate(value) };
}

/** Próximo lunes a partir de una fecha (si ya es lunes, devuelve esa fecha) */
export function getNextMondayDate(fromDateStr: string): string {
  const date = parseISO(fromDateStr);
  let d = date;
  while (getDay(d) !== 1) {
    d = addDays(d, 1);
  }
  return format(d, 'yyyy-MM-dd');
}
