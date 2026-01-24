export type DayOfWeek = 'MAANDAG' | 'DINSDAG' | 'DONDERDAG';

export interface Student {
  id: string;
  name: string;
  grade: string;
  day: DayOfWeek;
}

export interface Detention {
  id: string;
  number: number;
  date: string; // YYYY-MM-DD format
  dayOfWeek: DayOfWeek;
  student: string; // Student name with grade (e.g., "Luca Vandenbroucke - 2 aarde Move")
  teacher?: string;
  reason?: string;
  task?: string;
  lvsDate?: string; // Date from LVS system
  shouldPrint: boolean;
  canUseChromebook: boolean;
  extraNotes?: string;
  isDoublePeriod?: boolean; // Strafstudie (alleen maandag)
  timePeriod?: '16:00-16:50' | '16:50-17:40'; // Tijdvak voor strafstudie (2 periodes van 50 minuten)
}

export interface DetentionSession {
  date: string;
  dayOfWeek: DayOfWeek;
  detentions: Detention[];
}
