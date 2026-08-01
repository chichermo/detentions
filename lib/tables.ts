/**
 * Proyecto Supabase compartido (Chill Outs).
 * SIEMPRE nablijven_* — nunca "students" (esa tabla es de Chill-outs, sin columna day).
 */
export const TABLES = {
  students: 'nablijven_students',
  detentions: 'nablijven_detentions',
  calendarDaySettings: 'nablijven_calendar_day_settings',
  attachments: 'nablijven_attachments',
  auditLogs: 'nablijven_audit_logs',
  appSettings: 'app_settings',
} as const;

export const STORAGE_BUCKETS = {
  attachments: 'nablijven_attachments',
} as const;
