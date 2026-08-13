'use client';

import { UserRole } from './roles';

const STORAGE_KEY = 'nablijven_user_role';
const SCOPE_KEY = 'nablijven_access_scope';

export type DetentionsAccessScope = 'full' | 'limited';

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

/** Routes toegestaan bij beperkte toegang (kalender + dashboard). */
export function isPathAllowedForScope(pathname: string, scope: DetentionsAccessScope): boolean {
  if (scope === 'full') return true;
  if (pathname === '/portal-entry') return true;
  if (pathname === '/calendar' || pathname.startsWith('/calendar/')) return true;
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return true;
  return false;
}
