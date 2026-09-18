'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Pencil, Trash2, RefreshCw, Search, User } from 'lucide-react';
import PageHeader from '@/app/components/ui/PageHeader';
import LoadingPage from '@/app/components/ui/LoadingPage';
import { canViewLogboek } from '@/lib/auth';
import { format, parseISO } from 'date-fns';
import nl from 'date-fns/locale/nl';

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

type AuditLogRow = {
  id: string;
  action: AuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
};

function jsonField(data: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!data) return '';
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

type FilterAction = 'ALL' | AuditAction;

const ACTION_META: Record<
  AuditAction,
  { label: string; className: string; icon: typeof Plus }
> = {
  INSERT: {
    label: 'Ingepland',
    className: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40',
    icon: Plus,
  },
  UPDATE: {
    label: 'Gewijzigd',
    className: 'bg-sky-500/15 text-sky-200 border-sky-400/40',
    icon: Pencil,
  },
  DELETE: {
    label: 'Verwijderd',
    className: 'bg-red-500/15 text-red-200 border-red-400/40',
    icon: Trash2,
  },
};

function snapshotOf(log: AuditLogRow) {
  const data = log.action === 'DELETE' ? log.old_data : log.new_data || log.old_data;
  return {
    student: jsonField(data, 'student'),
    date: jsonField(data, 'date'),
    teacher: jsonField(data, 'teacher'),
    reason: jsonField(data, 'reason'),
  };
}

function formatWhen(iso: string) {
  try {
    return format(parseISO(iso), 'EEE d MMM yyyy, HH:mm', { locale: nl });
  } catch {
    return iso;
  }
}

function formatSessionDate(date: string) {
  if (!date) return '—';
  try {
    return format(parseISO(date), 'EEE d MMM yyyy', { locale: nl });
  } catch {
    return date;
  }
}

export default function LogboekPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<FilterAction>('ALL');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/audit?table=detentions&limit=400', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Logboek laden mislukt');
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Logboek laden mislukt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canViewLogboek()) {
      router.replace('/');
      return;
    }
    setAllowed(true);
    load();
  }, [router, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (!q) return true;
      const snap = snapshotOf(log);
      return [log.changed_by, snap.student, snap.teacher, snap.reason, snap.date]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [logs, query, actionFilter]);

  if (!allowed || (loading && logs.length === 0)) {
    return <LoadingPage label="Logboek laden…" />;
  }

  return (
    <div className="app-page">
      <PageHeader
        title="Logboek"
        subtitle="Wie heeft nablijven ingepland, gewijzigd of verwijderd"
        icon={BookOpen}
        iconTone="violet"
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="card p-4 sm:p-6 mb-6">
          <p className="text-sm text-secondary leading-relaxed">
            Alleen Admin, Annelore en Liesbeth zien dit overzicht. Nieuwe acties tonen de
            SSO-gebruikersnaam; oudere rijen zonder naam komen uit de database zonder gebruiker.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none z-10" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op gebruiker, leerling, personeel of reden…"
              className="input-field input-field-with-icon"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'INSERT', 'UPDATE', 'DELETE'] as FilterAction[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setActionFilter(value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  actionFilter === value
                    ? 'bg-[var(--accent-muted)] border-[var(--accent)]/40 text-primary'
                    : 'border-[var(--border-default)] text-muted hover:text-primary'
                }`}
              >
                {value === 'ALL' ? 'Alles' : ACTION_META[value].label}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <p className="p-6 text-muted text-sm">Geen logregels gevonden.</p>
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((log) => {
                const meta = ACTION_META[log.action] || ACTION_META.UPDATE;
                const Icon = meta.icon;
                const snap = snapshotOf(log);
                return (
                  <li key={log.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold border ${meta.className}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {meta.label}
                          </span>
                          <span className="text-xs text-muted">{formatWhen(log.changed_at)}</span>
                        </div>
                        <p className="font-semibold text-primary truncate">
                          {snap.student || 'Onbekende leerling'}
                        </p>
                        <p className="text-sm text-secondary mt-0.5">
                          Sessie {formatSessionDate(snap.date)}
                          {snap.teacher ? ` · ${snap.teacher}` : ''}
                          {snap.reason ? ` · ${snap.reason}` : ''}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-muted mt-2">
                          <User className="h-3.5 w-3.5" />
                          {log.changed_by || 'Onbekende gebruiker'}
                        </p>
                      </div>
                      {snap.date && (
                        <Link
                          href={`/detentions/${snap.date}`}
                          className="btn-ghost text-sm px-3 py-2 shrink-0 self-start"
                        >
                          Open sessie
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
