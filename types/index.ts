export type DayOfWeek = 'MAANDAG' | 'DINSDAG' | 'DONDERDAG';

export interface Student {
  id: string;
  name: string;
  grade: string;
  day: DayOfWeek;
  /** Volgorde uit Excel / bulk (lager = eerder). Behoudt klas-organisatie. */
  sortOrder?: number;
}

/** Personeelslid voor nablijven (docent / begeleider / …) */
export interface StaffMember {
  id: string;
  name: string;
  sortOrder?: number;
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
  nablijvenGeweigerd?: boolean; // Leerling heeft nablijven geweigerd
  didNotAttend?: boolean; // Niet komen opdagen (zonder geweigerd)
  sourceDetentionId?: string; // Koppeling naar oorspronkelijke nablijven (strafstudie op maandag)
}

export interface CalendarDaySetting {
  date: string; // YYYY-MM-DD
  blocked: boolean;
  allowDetentions: boolean;
  /** Alleen relevant op maandag; false = wel nablijven, geen strafstudie */
  allowStrafstudie: boolean;
  noticeTitle?: string;
  notice?: string;
}

export interface DetentionSession {
  date: string;
  dayOfWeek: DayOfWeek;
  detentions: Detention[];
}
