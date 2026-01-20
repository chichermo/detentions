'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DetentionSession } from '@/types';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import nl from 'date-fns/locale/nl';

export default function CalendarPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<DetentionSession[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/detentions/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSessionsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.find(s => s.date === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/')}
              className="btn-ghost p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">Nablijven Kalender</h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 hidden sm:block">Overzicht van alle nablijven sessies</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Calendar Controls */}
        <div className="card p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={goToPreviousMonth}
              className="btn-secondary flex items-center gap-2"
            >
              <ChevronLeft className="h-5 w-5" />
              Vorige
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-100">
                {format(currentDate, 'MMMM yyyy', { locale: nl })}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={goToToday}
                className="btn-primary"
              >
                Vandaag
              </button>
              <button
                onClick={goToNextMonth}
                className="btn-secondary flex items-center gap-2"
              >
                Volgende
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div key={day} className="text-center font-bold text-slate-400 py-3 text-sm">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {daysInMonth.map((day) => {
              const session = getSessionsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate === format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    if (session) {
                      router.push(`/detentions/${format(day, 'yyyy-MM-dd')}`);
                    } else if (isCurrentMonth) {
                      router.push(`/detentions/new?date=${format(day, 'yyyy-MM-dd')}`);
                    }
                  }}
                  className={`
                    aspect-square p-2 rounded-xl border-2 transition-all duration-200
                    ${isToday ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/30' : 'border-slate-700'}
                    ${isSelected && !session ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-800' : ''}
                    ${session ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50' : 'hover:bg-slate-800'}
                    ${!isCurrentMonth ? 'opacity-40' : ''}
                    ${!isCurrentMonth && !session ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div className={`text-sm font-bold mb-1 ${isToday ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {format(day, 'd')}
                  </div>
                  {session && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-emerald-300">
                        {session.detentions.length} nabl.
                      </div>
                      {session.detentions.filter(d => d.shouldPrint).length > 0 && (
                        <div className="text-xs text-indigo-400 font-bold">📄</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Info */}
        {selectedDate && !sessions.find(s => s.date === selectedDate) && (
          <div className="card p-8 mb-8">
            <h2 className="section-title mb-4">
              {format(parseISO(selectedDate), "EEEE d MMMM yyyy", { locale: nl })}
            </h2>
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-2xl mb-5 border border-slate-700">
                <CalendarIcon className="h-10 w-10 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium mb-4">Geen nablijven sessie geregistreerd voor deze datum.</p>
              <button
                onClick={() => router.push(`/detentions/new?date=${selectedDate}`)}
                className="btn-primary"
              >
                Nieuwe Sessie Aanmaken
              </button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="card p-8">
          <h2 className="section-title mb-8">
            Sessies van deze Maand
          </h2>
          {sessions.filter(s => {
            const sessionDate = parseISO(s.date);
            return isSameMonth(sessionDate, currentDate);
          }).length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-2xl mb-5 border border-slate-700">
                <CalendarIcon className="h-10 w-10 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">Geen sessies geregistreerd voor deze maand.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions
                .filter(s => {
                  const sessionDate = parseISO(s.date);
                  return isSameMonth(sessionDate, currentDate);
                })
                .map((session) => (
                  <button
                    key={session.date}
                    onClick={() => {
                      setSelectedDate(null);
                      router.push(`/detentions/${session.date}`);
                    }}
                    className="w-full text-left border border-slate-700 rounded-xl p-5 hover:bg-slate-700/50 hover:border-indigo-500/50 hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-100 text-base mb-2 group-hover:text-indigo-400 transition-colors">
                          {format(parseISO(session.date), "EEEE d MMMM", { locale: nl })}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{session.detentions.length} nablijven</span>
                          <span className="text-slate-600">•</span>
                          <span className="badge-primary">{session.dayOfWeek}</span>
                        </div>
                      </div>
                      {session.detentions.filter(d => d.shouldPrint).length > 0 && (
                        <div className="ml-4 flex-shrink-0">
                          <div className="badge-success">
                            {session.detentions.filter(d => d.shouldPrint).length} te printen
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
