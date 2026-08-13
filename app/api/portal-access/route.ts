import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export type NablijvenPortalScope = 'none' | 'limited' | 'full';

type UserRow = {
  id: string;
  username: string;
  role: string;
  active: boolean;
  permissions: Record<string, boolean> | null;
};

function scopeFromPermissions(
  permissions: Record<string, boolean> | null | undefined,
  role: string
): NablijvenPortalScope {
  if (role === 'admin') return 'full';
  if (!permissions?.portal_detentions) return 'none';
  if (permissions.detentions_full === false) return 'limited';
  return 'full';
}

function applyScope(
  permissions: Record<string, boolean> | null | undefined,
  scope: NablijvenPortalScope
): Record<string, boolean> {
  const next = { ...(permissions || {}) };
  if (scope === 'none') {
    next.portal_detentions = false;
    next.detentions_full = false;
  } else if (scope === 'limited') {
    next.portal_detentions = true;
    next.detentions_full = false;
  } else {
    next.portal_detentions = true;
    next.detentions_full = true;
  }
  return next;
}

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase niet geconfigureerd' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, active, permissions')
    .eq('active', true)
    .order('username', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = ((data || []) as UserRow[]).map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    scope: scopeFromPermissions(u.permissions, u.role),
  }));

  return NextResponse.json({ users });
}

export async function PATCH(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase niet geconfigureerd' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const userId = String(body?.userId || '').trim();
    const scope = body?.scope as NablijvenPortalScope;

    if (!userId || !['none', 'limited', 'full'].includes(scope)) {
      return NextResponse.json({ error: 'Ongeldige gegevens' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('id, username, role, permissions')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Admin-accounts altijd volledig houden
    if (existing.role === 'admin' && scope !== 'full') {
      return NextResponse.json(
        { error: 'Admin behoudt altijd volledige Nablijven-toegang' },
        { status: 400 }
      );
    }

    const permissions = applyScope(
      existing.permissions as Record<string, boolean> | null,
      scope
    );

    const { data, error } = await supabase
      .from('users')
      .update({
        permissions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, username, role, permissions')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      username: data.username,
      role: data.role,
      scope: scopeFromPermissions(data.permissions as Record<string, boolean>, data.role),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Opslaan mislukt' },
      { status: 500 }
    );
  }
}
