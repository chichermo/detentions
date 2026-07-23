'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setStoredRole } from '@/lib/auth';
import type { UserRole } from '@/lib/roles';

const PORTAL_SESSION_KEY = 'element_portal_session';

type PortalPayload = {
  username: string;
  role: string;
  exp: number;
};

const FALLBACK_SECRET = 'element-portal-sso-v1-school-internal';

function getSecret(): string {
  return process.env.NEXT_PUBLIC_PORTAL_SSO_SECRET || FALLBACK_SECRET;
}

function fromBase64Url(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function toBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function verifyToken(token: string): Promise<PortalPayload | null> {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expected = toBase64Url(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
  if (expected !== sig) return null;
  try {
    const json = new TextDecoder().decode(fromBase64Url(body));
    const payload = JSON.parse(json) as PortalPayload;
    if (!payload?.username || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

const VALID_ROLES: UserRole[] = [
  'beheerder',
  'coordinator',
  'leerkracht',
  'secretariaat',
  'directie',
  'gast',
];

export default function PortalEntryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Sessie overnemen…');

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get('token') || '';
      const roleParam = searchParams.get('role') || '';
      const userParam = searchParams.get('user') || '';

      const payload = token ? await verifyToken(token) : null;
      if (!payload) {
        setMessage('Ongeldige of verlopen portal-link. Ga terug naar Element portaal.');
        return;
      }

      const role = (VALID_ROLES.includes(roleParam as UserRole)
        ? roleParam
        : 'leerkracht') as UserRole;

      setStoredRole(role);
      localStorage.setItem(
        PORTAL_SESSION_KEY,
        JSON.stringify({
          username: payload.username || userParam,
          role,
          from: 'element-portal',
          at: new Date().toISOString(),
        })
      );

      setMessage('Welkom — Detentions openen…');
      router.replace('/dashboard');
    };
    run();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1208] text-[#f5e6d3]">
      <p className="text-sm tracking-wide">{message}</p>
    </div>
  );
}
