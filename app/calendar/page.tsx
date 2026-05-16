'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Lock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { DetentionSession, CalendarDaySetting } from '@/types';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import nl from 'date-fns/locale/nl';
import { apiFetch } from '@/lib/apiClient';
import { isNablijvenWeekday } from '@/lib/calendarUtils';
import {
  fetchCalendarDays,
  saveCalendarDay,
  getDaySettingFromList,
} from '@/lib/calendarDaysClient';
import { getStoredRole } from '@/lib/auth';
import { getRoleDefinition } from '@/lib/roles';
import RoleSelector from '@/app/components/RoleSelector';

export default function CalendarPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<DetentionSession[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDaySetting[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [adminSaving, setAdminSaving] = useState(false);
  const [role, setRole] = useState<'beheerder' | 'coordinator' | 'leerkracht' | 'secretariaat' | 'directie' | 'gast'>('leerkracht');
  const [mounted, setMounted] = useState(false);
  const dayPanelRef = useRef<HTMLDivElement>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const rangeStart = format(startOfWeek(monthStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const rangeEnd = format(endOfWeek(monthEnd, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const loadData = useCallback(async () => {
    try {
      const [sessionsRes, days] = await Promise.all([
        apiFetch('/api/detentions/sessions'),
        fetchCalendarDays(rangeStart, rangeEnd),
      ]);
      const data = await sessionsRes.json();
      setSessions(Array.isArray(data) ? data : []);
      setCalendarDays(days);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  }, [rangeStart, rangeEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setMounted(true);
    setRole(getStoredRole());
  }, []);

  useEffect(() => {
    if (!selectedDate || !dayPanelRef.current) return;
    dayPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedDate]);

  // Al cambiar de mes, deseleccionar si el día no es Ma/Di/Do
  useEffect(() => {
    if (!selectedDate) return;
    const d = parseISO(selectedDate);
    if (!isSameMonth(d, currentDate) || !isNablijvenWeekday(d)) {
      setSelectedDate(null);
    }
  }, [currentDate, selectedDate]);

  const permissions = getRoleDefinition(role);
  const canAdminCalendar = permissions.canBlockDays || permissions.canEditCalendarNotices;

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSessionsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.find((s) => s.date === dateStr);
  };

  const getDayConfig = (dateStr: string) =>
    getDaySettingFromList(dateStr, calendarDays);

  const selectedConfig = selectedDate ? getDayConfig(selectedDate) : undefined;
  const selectedSession = selectedDate
    ? sessions.find((s) => s.date === selectedDate)
    : undefined;

  const handleDayClick = (day: Date, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSameMonth(day, currentDate)) return;
    // Solo interactividad en maandag, dinsdag en donderdag
    if (!isNablijvenWeekday(day)) return;
    const dateStr = format(day, 'yyyy-MM-dd');
    const session = getSessionsForDate(day);
    if (session) {
      router.push(`/detentions/${dateStr}`);
      return;
    }
    setSelectedDate(dateStr);
  };

  const handleOpenSession = () => {
    if (!selectedDate) return;
    router.push(`/detentions/${selectedDate}`);
  };

  const handleCreateSession = () => {
    if (!selectedDate) return;
    const cfg = getDayConfig(selectedDate);
    if (cfg?.blocked) {
      alert('Deze dag is geblokkeerd door de beheerder.');
      return;
    }
    if (cfg && !cfg.allowDetentions) {
      alert('Voor deze dag zijn geen nablijven toegestaan (zie melding).');
      return;
    }
    router.push(`/detentions/new?date=${selectedDate}`);
  };

  const updateDayConfig = async (patch: Partial<CalendarDaySetting>) => {
    if (!selectedDate || !canAdminCalendar) return;
    setAdminSaving(true);
    const current: CalendarDaySetting = {
      date: selectedDate,
      blocked: selectedConfig?.blocked ?? false,
      allowDetentions: selectedConfig?.allowDetentions ?? true,
      noticeTitle: selectedConfig?.noticeTitle,
      notice: selectedConfig?.notice,
      ...patch,
    };
    try {
      await saveCalendarDay(current);
      setCalendarDays((prev) => {
        const rest = prev.filter((d) => d.date !== selectedDate);
        return [...rest, current].sort((a, b) => a.date.localeCompare(b.date));
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Opslaan mislukt');
    } finally {
      setAdminSaving(false);
    }
  };

  const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  const selectedDayDate = selectedDate ? parseISO(selectedDate) : null;
  const isNablijvenDay = selectedDayDate ? isNablijvenWeekday(selectedDayDate) : false;

  const canCreateOnSelected = useMemo(() => {
    if (!selectedDate || !isNablijvenDay) return false;
    const cfg = getDayConfig(selectedDate);
    if (cfg?.blocked) return false;
    if (cfg && !cfg.allowDetentions) return false;
    return !selectedSession;
  }, [selectedDate, isNablijvenDay, calendarDays, selectedSession]);

  return (
    <div className="app-page">
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button onClick={() => router.push('/')} className="btn-ghost p-2 shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30 shrink-0">
                  <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight truncate">
                    Nablijven Kalender
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5 hidden sm:block">
                    Klik op maandag, dinsdag of donderdag
                  </p>
                </div>
              </div>
            </div>
            <RoleSelector />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="card p-4 sm:p-8 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="h-5 w-5" />
              Vorige
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              {format(currentDate, 'MMMM yyyy', { locale: nl })}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentDate(new Date())} className="btn-primary">
                Vandaag
              </button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="btn-secondary flex items-center gap-2">
                Volgende
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500/60" /> Sessie</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" /> Melding</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" /> Geblokkeerd</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-indigo-500" /> Geselecteerd</span>
            <span className="text-slate-500">· Alleen Ma, Di, Do zijn klikbaar</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-bold text-slate-400 py-2 text-xs sm:text-sm">
                {day}
              </div>
            ))}

            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const session = getSessionsForDate(day);
              const cfg = getDayConfig(dateStr);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate === dateStr;
              const inMonth = isSameMonth(day, currentDate);
              const nablijvenDay = isNablijvenWeekday(day);
              const clickable = inMonth && nablijvenDay;
              const blocked = cfg?.blocked;
              const hasNotice = !!(cfg?.notice || cfg?.noticeTitle);

              return (
                <button
                  key={dateStr}
                  type="button"
                  aria-pressed={clickable ? isSelected : undefined}
                  aria-disabled={!clickable}
                  aria-label={format(day, 'd MMMM yyyy', { locale: nl })}
                  onClick={(e) => handleDayClick(day, e)}
                  disabled={!clickable}
                  className={`
                    aspect-square p-1.5 sm:p-2 rounded-xl border-2 transition-all duration-200 text-left
                    relative z-[1]
                    ${!inMonth ? 'opacity-25 cursor-default border-transparent' : ''}
                    ${inMonth && !nablijvenDay ? 'opacity-30 cursor-not-allowed border-slate-800/50 bg-slate-900/30' : ''}
                    ${clickable ? 'cursor-pointer touch-manipulation active:scale-[0.98] hover:border-indigo-400/60' : ''}
                    ${blocked && clickable ? 'border-red-500/60 bg-red-950/40' : ''}
                    ${hasNotice && !blocked && clickable ? 'border-amber-500/50 bg-amber-950/20' : ''}
                    ${!blocked && !hasNotice && session && clickable ? 'border-emerald-500/50 bg-emerald-500/15' : ''}
                    ${!blocked && !hasNotice && !session && clickable ? 'border-slate-600 bg-slate-800/60 hover:border-indigo-500/50' : ''}
                    ${isToday && clickable ? 'ring-1 ring-indigo-400' : ''}
                    ${isSelected && clickable ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-900' : ''}
                  `}
                >
                  <div className={`text-xs sm:text-sm font-bold ${clickable ? 'text-slate-100' : inMonth ? 'text-slate-500' : 'text-slate-600'}`}>
                    {format(day, 'd')}
                  </div>
                  {clickable && blocked && <Lock className="h-3 w-3 text-red-400 mt-0.5" />}
                  {clickable && hasNotice && !blocked && <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5" />}
                  {session && clickable && (
                    <div className="text-[10px] sm:text-xs font-semibold text-emerald-300 mt-0.5 truncate">
                      {session.detentions.length} nabl.
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {!selectedDate && (
            <p className="mt-4 text-center text-sm text-slate-500">
              Klik op een maandag, dinsdag of donderdag om een sessie te openen of aan te maken.
            </p>
          )}

          {selectedDate && (
            <div ref={dayPanelRef}
              id="calendar-day-detail"
              className="mt-6 pt-6 border-t border-slate-700 scroll-mt-28"
              role="region"
              aria-live="polite"
            >
            <h2 className="section-title mb-2">
              {format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: nl })}
            </h2>

            {selectedConfig?.noticeTitle && (
              <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="font-semibold text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {selectedConfig.noticeTitle}
                </p>
                {selectedConfig.notice && (
                  <p className="text-sm text-amber-100/80 mt-2">{selectedConfig.notice}</p>
                )}
              </div>
            )}

            {selectedConfig?.blocked && (
              <p className="text-red-300 text-sm mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Deze dag is geblokkeerd — geen nablijven mogelijk.
              </p>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              {selectedSession ? (
                <button type="button" onClick={handleOpenSession} className="btn-primary flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Sessie openen ({selectedSession.detentions.length})
                </button>
              ) : canCreateOnSelected ? (
                <button type="button" onClick={handleCreateSession} className="btn-primary">
                  Nieuwe sessie aanmaken
                </button>
              ) : selectedSession === undefined && isNablijvenDay && selectedConfig && !selectedConfig.allowDetentions ? (
                <p className="text-slate-400 text-sm">Nablijven niet toegestaan volgens daginstelling.</p>
              ) : null}
            </div>

            {mounted && canAdminCalendar && (
              <div className="border-t border-slate-700 pt-6 mt-6 space-y-4">
                <h3 className="font-bold text-slate-200">Beheer (admin)</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedConfig?.blocked ?? false}
                    disabled={adminSaving}
                    onChange={(e) => updateDayConfig({ blocked: e.target.checked })}
                  />
                  <span className="text-slate-300">Dag blokkeren</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedConfig?.allowDetentions ?? true}
                    disabled={adminSaving || selectedConfig?.blocked}
                    onChange={(e) => updateDayConfig({ allowDetentions: e.target.checked })}
                  />
                  <span className="text-slate-300">Nablijven toestaan op deze dag</span>
                </label>
                <div>
                  <label className="form-label">Titel melding</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="bv. Schooluitstap"
                    value={selectedConfig?.noticeTitle ?? ''}
                    disabled={adminSaving}
                    onChange={(e) =>
                      updateDayConfig({ noticeTitle: e.target.value || undefined })
                    }
                    onBlur={() => {}}
                  />
                </div>
                <div>
                  <label className="form-label">Melding / situatie</label>
                  <textarea
                    className="detention-notes-input w-full"
                    rows={3}
                    placeholder="Uitleg voor leerkrachten..."
                    value={selectedConfig?.notice ?? ''}
                    disabled={adminSaving}
                    onChange={(e) =>
                      updateDayConfig({ notice: e.target.value || undefined })
                    }
                  />
                </div>
              </div>
            )}
            </div>
          )}
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="section-title mb-6">Sessies van deze maand</h2>
          {sessions.filter((s) => isSameMonth(parseISO(s.date), currentDate)).length === 0 ? (
            <p className="text-slate-400 text-center py-12">Geen sessies deze maand.</p>
          ) : (
            <div className="space-y-3">
              {sessions
                .filter((s) => isSameMonth(parseISO(s.date), currentDate))
                .map((session) => (
                  <button
                    key={session.date}
                    type="button"
                    onClick={() => router.push(`/detentions/${session.date}`)}
                    className="w-full text-left border border-slate-700 rounded-xl p-4 hover:bg-slate-700/50 hover:border-indigo-500/50 transition-all"
                  >
                    <h3 className="font-bold text-slate-100">
                      {format(parseISO(session.date), 'EEEE d MMMM', { locale: nl })}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {session.detentions.length} nablijven · {session.dayOfWeek}
                    </p>
                  </button>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
