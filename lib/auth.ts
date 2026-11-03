'use client';

import { UserRole } from './roles';

const STORAGE_KEY = 'nablijven_user_role';
const SCOPE_KEY = 'nablijven_access_scope';
const PORTAL_SESSION_KEY = 'element_portal_session';
const ACTOR_USERNAME_KEY = 'nablijven_actor_username';

export type DetentionsAccessScope = 'full' | 'limited';

/** Alleen Admin, Annelore en Liesbeth: leerlingenlijst, personeel, rechten. */
const LIST_ADMIN_USERNAMES = new Set([
  'admin',
  'annelore.delbecque',
  'liesbeth.kreps',
  'liesbeth',
]);

function normalizeUsername(name: string | null): string {
  return (name || '').trim().toLowerCase();
}

/** Leerlingen, personeel, rechten en logboek: alleen Admin, Annelore en Liesbeth. */
export function canManageListsAndRights(): boolean {
  const username = normalizeUsername(getPortalUsername());
  if (!username) return false;
  if (LIST_ADMIN_USERNAMES.has(username)) return true;
  // SSO-naam kan een extra suffix hebben
  return username.startsWith('liesbeth.kreps') || username.startsWith('annelore.delbecque');
}

/** Logboek van inplanningen en verwijderingen: dezelfde admin-groep. */
export function canViewLogboek(): boolean {
  return canManageListsAndRights();
}

export function persistActorUsername(username: string): void {
  if (typeof window === 'undefined') return;
  const name = username.trim();
  if (!name) return;
  localStorage.setItem(ACTOR_USERNAME_KEY, name);
}

/** Wie de actie uitvoert: SSO-gebruikersnaam, nooit de lokale rol. */
export function getActorLabel(): string {
  const portal = getPortalUsername();
  if (portal) return portal;
  return 'Onbekende gebruiker (niet via portaal)';
}

export type AuditActorDisplay = {
  label: string;
  isKnownUser: boolean;
  note?: string;
};

/** Logboek: maak oude "Leerkracht (lokaal)"-labels leesbaar. */
export function describeAuditActor(changedBy: string | null | undefined): AuditActorDisplay {
  const raw = String(changedBy || '').trim();
  if (!raw) {
    return {
      label: 'Onbekende gebruiker',
      isKnownUser: false,
      note: 'Geen gebruikersnaam opgeslagen.',
    };
  }
  if (/\(lokaal\)\s*$/i.test(raw) || /niet via portaal/i.test(raw)) {
    return {
      label: 'Onbekende gebruiker',
      isKnownUser: false,
      note: 'Niet via het Element-portaal ingelogd. Alleen de rol op dit apparaat was bekend, niet wie inplande.',
    };
  }
  return { label: raw, isKnownUser: true };
}

/** Admin of Annelore: kalenderbeheer, top 10 personeel. */
const PRIVILEGED_ADMIN_USERNAMES = new Set(['admin', 'annelore.delbecque']);

/** Admin of Annelore via Element-SSO; zonder SSO: lokale rol beheerder. */
export function isPrivilegedAdminUser(): boolean {
  const username = normalizeUsername(getPortalUsername());
  if (username && PRIVILEGED_ADMIN_USERNAMES.has(username)) return true;
  return getStoredRole() === 'beheerder' && !getPortalUsername();
}

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
    const stored = localStorage.getItem(ACTOR_USERNAME_KEY)?.trim();
    if (stored) return stored;
    const raw = localStorage.getItem(PORTAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { username?: string; user?: string };
    const name = String(parsed?.username || parsed?.user || '').trim();
    if (name) persistActorUsername(name);
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
  return isPrivilegedAdminUser();
}

/** Top 10 personeel in statistieken: alleen Admin en Annelore. */
export function canViewStaffStatistics(): boolean {
  return isPrivilegedAdminUser();
}

/** Leerlingen, personeel, rechten en logboek: alleen Admin, Annelore en Liesbeth. */
export function isPathAllowedForScope(pathname: string, _scope?: DetentionsAccessScope): boolean {
  const logboekPath = pathname === '/logboek' || pathname.startsWith('/logboek/');
  if (logboekPath) return canViewLogboek();

  const listPath =
    pathname === '/students' ||
    pathname.startsWith('/students/') ||
    pathname === '/staff' ||
    pathname.startsWith('/staff/') ||
    pathname === '/rechten' ||
    pathname.startsWith('/rechten/');
  if (listPath) return canManageListsAndRights();
  return true;
}
