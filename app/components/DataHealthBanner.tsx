'use client';

import { useEffect, useState } from 'react';
import { Database, AlertTriangle, CheckCircle2 } from 'lucide-react';

type Health = {
  ok: boolean;
  configured: boolean;
  counts: { students: number; detentions: number; sessions: number };
  message?: string;
  error?: string;
};

export default function DataHealthBanner() {
  const [health, setHealth] = useState<Health | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/data-check', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setHealth)
      .catch(() =>
        setHealth({
          ok: false,
          configured: false,
          counts: { students: 0, detentions: 0, sessions: 0 },
          error: 'Kon gegevensstatus niet ophalen',
        })
      );
  }, []);

  if (!health || dismissed) return null;

  const readLocalCount = (key: string) => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };
  const templateCount = readLocalCount('nablijven_templates');
  const studentFiltersCount = readLocalCount('nablijven_saved_filters');
  const statsFiltersCount = readLocalCount('nablijven_stats_filters');
  const localPrefsCount = templateCount + studentFiltersCount + statsFiltersCount;

  const variant = !health.configured
    ? 'error'
    : health.counts.detentions === 0 && health.counts.students === 0
      ? 'warn'
      : 'ok';

  if (variant === 'ok' && localPrefsCount === 0) return null;

  const styles = {
    error: 'border-red-500/40 bg-red-500/10 text-[#ffd0cc]',
    warn: 'border-amber-500/40 bg-amber-500/10 text-[#ffe0a8]',
    ok: 'border-[var(--mint)]/30 bg-[var(--mint-muted)] text-[#b8f5e8]',
  };

  const Icon = variant === 'ok' ? CheckCircle2 : AlertTriangle;

  return (
    <div className={`border-b px-4 py-2.5 text-sm ${styles[variant]}`} role="status">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-secondary">
            {!health.configured && 'Supabase niet geconfigureerd — nablijven worden niet opgeslagen op de server.'}
            {health.configured && variant === 'warn' && 'Geen leerlingen of nablijven in de database. Bestaande backup? Gebruik Import op de startpagina.'}
            {health.configured && variant === 'ok' && (
              <>
                <Database className="inline h-3.5 w-3.5 mr-1 opacity-70" />
                {health.counts.students} leerlingen · {health.counts.detentions} nablijven ·{' '}
                {health.counts.sessions} sessies
                {localPrefsCount > 0 && (
                  <>
                    {' '}
                    · lokaal:{' '}
                    {[
                      templateCount > 0 && `${templateCount} templates`,
                      studentFiltersCount > 0 && `${studentFiltersCount} leerlingfilters`,
                      statsFiltersCount > 0 && `${statsFiltersCount} statfilters`,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </>
                )}
              </>
            )}
            {health.error && ` (${health.error})`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs underline opacity-80 hover:opacity-100 shrink-0"
        >
          Sluiten
        </button>
      </div>
    </div>
  );
}
