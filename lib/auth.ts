'use client';

import { UserRole } from './roles';

const STORAGE_KEY = 'nablijven_user_role';
const SCOPE_KEY = 'nablijven_access_scope';
const PORTAL_SESSION_KEY = 'element_portal_session';

export type DetentionsAccessScope = 'full' | 'limited';

/** Gebruikers die kalenderdag-beheer (blokkeren, meldingen, geen strafstudie) mogen zien. */
const CALENDAR_ADMIN_USERNAMES = new Set(['admin', 'annelore.delbecque']);

export function getStoredRole(): UserRole {
  if (typeof window === 'undefined') return 'leerkracht';
  const raw = localStorage.getItem(STORAGE_KEY);
  const valid: UserRole[] = [
    'beheerder',
    'coordinator',
    'leerkracht',
    'secretariaat',
    'directie',
    'gast',
  ];
  if (raw && valid.includes(raw as UserRole)) return raw as UserRole;
  return 'leerkracht';
}

export function setStoredRole(role: UserRole): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, role);
}

/** Standaard full zodat directe bezoekers zonder Element-SSO niet geblokkeerd worden. */
export function getAccessScope(): DetentionsAccessScope {
  if (typeof window === 'undefined') return 'full';
  const raw = localStorage.getItem(SCOPE_KEY);
  if (raw === 'limited' || raw === 'full') return raw;
  return 'full';
}

export function setAccessScope(scope: DetentionsAccessScope): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCOPE_KEY, scope);
}

export function hasFullDetentionsAccess(): boolean {
  return getAccessScope() === 'full';
}

/** Gebruikersnaam uit Element-SSO sessie (indien aanwezig). */
export function getPortalUsername(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PORTAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { username?: string };
    const name = String(parsed?.username || '').trim();
    return name || null;
  } catch {
    return null;
  }
}

/**
 * Kalender "Beheer (admin)": alleen Admin en Annelore.
 * Andere gebruikers kunnen wel sessies aanmaken.
 */
export function canManageCalendarSettings(): boolean {
  const username = getPortalUsername()?.toLowerCase() || '';
  if (username && CALENDAR_ADMIN_USERNAMES.has(username)) return true;
  // Fallback zonder SSO: lokale rol beheerder
  return getStoredRole() === 'beheerder' && !getPortalUsername();
}

/** Beperkte toegang: alles behalve leerlingen- en personeelslijsten (en rechtenbeheer). */
export function isPathAllowedForScope(pathname: string, scope: DetentionsAccessScope): boolean {
  if (scope === 'full') return true;
  if (pathname === '/students' || pathname.startsWith('/students/')) return false;
  if (pathname === '/staff' || pathname.startsWith('/staff/')) return false;
  if (pathname === '/rechten' || pathname.startsWith('/rechten/')) return false;
  return true;
}
