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

/** Días en los que normalmente hay nablijven (lun, mar, jue) */
export function isNablijvenWeekday(date: Date): boolean {
  const d = getDay(date);
  return d === 1 || d === 2 || d === 4;
}

export function isMonday(date: Date): boolean {
  return getDay(date) === 1;
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
