'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Users, Plus, Search, Clock, ArrowRight, BarChart3, LayoutDashboard } from 'lucide-react';
import { DetentionSession } from '@/types';
import { format } from 'date-fns';
import nl from 'date-fns/locale/nl';
import InstallPrompt from '@/app/components/InstallPrompt';

export default function Home() {
  const [sessions, setSessions] = useState<DetentionSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return session.detentions.some(d => 
      d.student.toLowerCase().includes(searchLower) ||
      d.reason?.toLowerCase().includes(searchLower) ||
      d.teacher?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
                Nablijven Systeem
              </h1>
              <p className="text-slate-400 mt-1.5 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Beheer van nablijven (16:00 - 16:50)</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-12">
          <Link
            href="/students"
            className="card-hover p-6 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-100 mb-1.5">Leerlingen</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Beheer lijsten van leerlingen per dag
                </p>
                <div className="mt-3 flex items-center text-indigo-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Bekijken</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/detentions/new"
            className="card-hover p-6 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-100 mb-1.5">Nieuw Nablijven</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Registreer een nieuwe nablijven sessie
                </p>
                <div className="mt-3 flex items-center text-emerald-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Aanmaken</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/calendar"
            className="card-hover p-6 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-100 mb-1.5">Kalender</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Bekijk alle nablijven sessies
                </p>
                <div className="mt-3 flex items-center text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Bekijken</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="card-hover p-6 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-100 mb-1.5">Dashboard</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Overzicht en KPIs in real-time
                </p>
                <div className="mt-3 flex items-center text-cyan-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Bekijken</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/statistics"
            className="card-hover p-6 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-100 mb-1.5">Statistieken</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Analyse en rapporten met export
                </p>
                <div className="mt-3 flex items-center text-orange-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Bekijken</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Sessions */}
        <div className="card p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
            <div>
              <h2 className="section-title">Recente Sessies</h2>
              <p className="section-subtitle">
                {filteredSessions.length} sessie{filteredSessions.length !== 1 ? 's' : ''} gevonden
              </p>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Zoeken naar leerling, reden of leerkracht..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-2xl mb-5 border border-slate-700">
                <Calendar className="h-10 w-10 text-slate-500" />
              </div>
              <p className="text-slate-400 mb-3 font-medium">Geen sessies geregistreerd.</p>
              <Link
                href="/detentions/new"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                <span>Eerste sessie aanmaken</span>
                <Plus className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.slice(-10).reverse().map((session) => (
                <Link
                  key={session.date}
                  href={`/detentions/${session.date}`}
                  className="block border border-slate-700 rounded-xl p-5 hover:bg-slate-700/50 hover:border-indigo-500/50 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-100 text-base mb-2 group-hover:text-indigo-400 transition-colors">
                        {format(new Date(session.date), "EEEE d MMMM yyyy", { locale: nl })}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-300">{session.detentions.length}</span>
                          <span>nablijven</span>
                        </span>
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
