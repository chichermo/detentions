/**
 * Perfiles alineados con Chillouts (beheerder, coördinator, leerkracht, …).
 * Ajustar etiquetas si el proyecto Chillouts define otros ids.
 */
export type UserRole =
  | 'beheerder'
  | 'coordinator'
  | 'leerkracht'
  | 'secretariaat'
  | 'directie'
  | 'gast';

export interface RoleDefinition {
  id: UserRole;
  label: string;
  description: string;
  canBlockDays: boolean;
  canEditCalendarNotices: boolean;
  canManageStudents: boolean;
  canCreateDetentions: boolean;
  canDeleteDetentions: boolean;
  canViewAllReports: boolean;
}

export const CHILLOUTS_ROLES: RoleDefinition[] = [
  {
    id: 'beheerder',
    label: 'Beheerder',
    description: 'Volledige toegang: kalender, blokkeren, rapporten',
    canBlockDays: true,
    canEditCalendarNotices: true,
    canManageStudents: true,
    canCreateDetentions: true,
    canDeleteDetentions: true,
    canViewAllReports: true,
  },
  {
    id: 'coordinator',
    label: 'Coördinator',
    description: 'Kalender en nablijven beheren',
    canBlockDays: true,
    canEditCalendarNotices: true,
    canManageStudents: true,
    canCreateDetentions: true,
    canDeleteDetentions: true,
    canViewAllReports: true,
  },
  {
    id: 'directie',
    label: 'Directie',
    description: 'Rapporten en overzicht, beperkte bewerking',
    canBlockDays: false,
    canEditCalendarNotices: false,
    canManageStudents: false,
    canCreateDetentions: false,
    canDeleteDetentions: false,
    canViewAllReports: true,
  },
  {
    id: 'leerkracht',
    label: 'Leerkracht',
    description: 'Nablijven registreren en bekijken',
    canBlockDays: false,
    canEditCalendarNotices: false,
    canManageStudents: false,
    canCreateDetentions: true,
    canDeleteDetentions: false,
    canViewAllReports: true,
  },
  {
    id: 'secretariaat',
    label: 'Secretariaat',
    description: 'Leerlingen en sessies beheren',
    canBlockDays: false,
    canEditCalendarNotices: true,
    canManageStudents: true,
    canCreateDetentions: true,
    canDeleteDetentions: false,
    canViewAllReports: true,
  },
  {
    id: 'gast',
    label: 'Gast',
    description: 'Alleen lezen',
    canBlockDays: false,
    canEditCalendarNotices: false,
    canManageStudents: false,
    canCreateDetentions: false,
    canDeleteDetentions: false,
    canViewAllReports: false,
  },
];

export function getRoleDefinition(role: UserRole): RoleDefinition {
  return CHILLOUTS_ROLES.find((r) => r.id === role) ?? CHILLOUTS_ROLES.find((r) => r.id === 'gast')!;
}
