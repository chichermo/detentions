'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Search, RefreshCw } from 'lucide-react';
import PageHeader from '@/app/components/ui/PageHeader';
import LoadingPage from '@/app/components/ui/LoadingPage';
import { hasFullDetentionsAccess } from '@/lib/auth';

type NablijvenPortalScope = 'none' | 'limited' | 'full';

type PortalUser = {
  id: string;
  username: string;
  role: string;
  scope: NablijvenPortalScope;
};

const SCOPE_OPTIONS: { value: NablijvenPortalScope; label: string }[] = [
  { value: 'none', label: 'Geen toegang' },
  { value: 'limited', label: 'Zonder leerlingen- en personeelslijsten' },
  { value: 'full', label: 'Volledig portaal' },
];

export default function RechtenPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/portal-access', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Laden mislukt');
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFullDetentionsAccess()) {
      router.replace('/');
      return;
    }
    setAllowed(true);
    load();
  }, [router, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.username.toLowerCase().includes(q));
  }, [users, query]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 2500);
  };

  const updateScope = async (user: PortalUser, scope: NablijvenPortalScope) => {
    if (user.scope === scope) return;
    try {
      setSavingId(user.id);
      setError('');
      const res = await fetch('/api/portal-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, scope }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Opslaan mislukt');
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, scope: data.scope as NablijvenPortalScope } : u))
      );
      flash(`Toegang van ${user.username} bijgewerkt.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt');
    } finally {
      setSavingId(null);
    }
  };

  if (!allowed || loading) {
    return <LoadingPage label="Rechten laden…" />;
  }

  return (
    <div className="app-page">
      <PageHeader
        title="Nablijven-rechten"
        subtitle="Portaaltoegang per gebruiker: volledig, beperkt of geen"
        icon={Shield}
        iconTone="copper"
        onBack={() => router.push('/')}
        actions={
          <button
            type="button"
            onClick={load}
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Vernieuwen
          </button>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
            {success}
          </div>
        )}

        <div className="card p-4 sm:p-6 mb-6">
          <p className="text-sm text-secondary leading-relaxed">
            Hier stel je in wie Nablijven mag openen vanuit Element, en of dat het{' '}
            <strong className="text-primary">volledige portaal</strong> is of Nablijven{' '}
            <strong className="text-primary">zonder leerlingen- en personeelslijsten</strong>.
          </p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek gebruiker…"
            className="input-field pl-11"
          />
        </div>

        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <p className="p-6 text-muted text-sm">Geen gebruikers gevonden.</p>
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-primary truncate">{user.username}</p>
                    <p className="text-xs text-muted mt-0.5">{user.role}</p>
                  </div>
                  <select
                    value={user.scope}
                    disabled={savingId === user.id || user.role === 'admin'}
                    onChange={(e) =>
                      updateScope(user, e.target.value as NablijvenPortalScope)
                    }
                    className="input-field w-full sm:w-auto sm:min-w-[240px] text-sm"
                    aria-label={`Nablijven-toegang voor ${user.username}`}
                  >
                    {SCOPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
