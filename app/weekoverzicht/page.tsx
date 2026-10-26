'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarRange, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { addDays, addWeeks, format, parseISO, startOfWeek } from 'date-fns';
import nl from 'date-fns/locale/nl';
import PageHeader from '@/app/components/ui/PageHeader';
import LoadingPage from '@/app/components/ui/LoadingPage';
import { Detention } from '@/types';
import { apiFetch } from '@/lib/apiClient';
import { getDetentionStudentName, normalizeDetentionDate } from '@/lib/detentionValidation';

const WEEK_DAYS = [
  { dayOfWeek: 'MAANDAG' as const, offset: 0 },
  { dayOfWeek: 'DINSDAG' as const, offset: 1 },
  { dayOfWeek: 'DONDERDAG' as const, offset: 3 },
];

function isoDay(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function weekDates(weekStart: Date): { date: string; dayOfWeek: (typeof WEEK_DAYS)[number]['dayOfWeek'] }[] {
  return WEEK_DAYS.map(({ dayOfWeek, offset }) => ({
    date: isoDay(addDays(weekStart, offset)),
    dayOfWeek,
  }));
}

export default function WeekoverzichtPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [detentions, setDetentions] = useState<Detention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/detentions', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) setDetentions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching weekoverzicht:', error);
        if (!cancelled) setDetentions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const days = useMemo(() => weekDates(weekStart), [weekStart]);
  const weekEnd = days[days.length - 1]?.date ?? isoDay(weekStart);
  const weekLabel = `${format(weekStart, 'd MMM', { locale: nl })} – ${format(parseISO(weekEnd), 'd MMM yyyy', { locale: nl })}`;

  const byDate = useMemo(() => {
    const map = new Map<string, Detention[]>();
    for (const day of days) map.set(day.date, []);
    for (const detention of detentions) {
      const date = normalizeDetentionDate(detention.date);
      const list = map.get(date);
      if (!list) continue;
      list.push(detention);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.number || 0) - (b.number || 0));
    }
    return map;
  }, [detentions, days]);

  const total = days.reduce((n, day) => n + (byDate.get(day.date)?.length ?? 0), 0);

  if (loading) {
    return <LoadingPage label="Weekoverzicht laden..." />;
  }

  return (
    <div className="app-page">
      <PageHeader
        title="Weekoverzicht"
        subtitle={`${weekLabel} · ${total} nablijven`}
        icon={CalendarRange}
        iconTone="violet"
        onBack={() => router.push('/')}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              type="button"
              className="btn-secondary text-sm px-3 py-2"
              onClick={() => setWeekStart((d) => addWeeks(d, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Vorige</span>
            </button>
            <button
              type="button"
              className="btn-secondary text-sm px-3 py-2"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              Deze week
            </button>
            <button
              type="button"
              className="btn-secondary text-sm px-3 py-2"
              onClick={() => setWeekStart((d) => addWeeks(d, 1))}
            >
              <span className="hidden sm:inline">Volgende</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn-primary text-sm px-3 py-2 flex items-center gap-2"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              Afdrukken
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <p className="hidden print:block text-sm mb-4">
          Weekoverzicht nablijven {weekLabel}
        </p>
        {days.map((day) => {
          const rows = byDate.get(day.date) ?? [];
          return (
            <section key={day.date} className="card p-4 sm:p-6 print:shadow-none print:break-inside-avoid">
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <h2 className="font-display text-lg font-bold text-primary capitalize">
                  {format(parseISO(day.date), 'EEEE d MMMM', { locale: nl })}
                </h2>
                <p className="text-sm text-muted">
                  {rows.length} nablijven
                </p>
              </div>
              {rows.length === 0 ? (
                <p className="text-sm text-muted py-2">Geen nablijven op deze dag.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-simple w-full">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Leerling</th>
                        <th>Personeel</th>
                        <th>Reden</th>
                        <th>Opdracht</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.number}</td>
                          <td className="font-medium">
                            {getDetentionStudentName(row.student)}
                            {row.isDoublePeriod ? (
                              <span className="ml-2 text-xs font-semibold text-amber-300">
                                strafstudie
                              </span>
                            ) : null}
                          </td>
                          <td>{row.teacher || '—'}</td>
                          <td>{row.reason || '—'}</td>
                          <td>{row.task || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
