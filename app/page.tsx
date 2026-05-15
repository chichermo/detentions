'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Search,
  Clock,
  ArrowRight,
  BarChart3,
  Plus,
  Download,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import LoadingPage from '@/app/components/ui/LoadingPage';
import { DetentionSession } from '@/types';
import { format } from 'date-fns';
import nl from 'date-fns/locale/nl';
import InstallPrompt from '@/app/components/InstallPrompt';
import BackupRestore from '@/app/components/BackupRestore';

const NAV_ITEMS = [
  {
    href: '/students',
    title: 'Leerlingen',
    desc: 'Lijsten per weekdag beheren',
    icon: Users,
    cardClass: 'nav-card-copper',
    iconClass: 'nav-icon bg-gradient-to-br from-[#e8953a] to-[#c97a28] text-[#1a1208]',
    linkClass: 'text-[#f0c078]',
  },
  {
    href: '/calendar',
    title: 'Kalender',
    desc: 'Alle sessies in één overzicht',
    icon: Calendar,
    cardClass: 'nav-card-violet',
    iconClass: 'nav-icon bg-gradient-to-br from-[#a78bfa] to-[#7c5cc7] text-[#1a1028]',
    linkClass: 'text-[#d4c4fd]',
  },
  {
    href: '/dashboard',
    title: 'Dashboard',
    desc: "KPI's, trends en toplijsten",
    icon: LayoutDashboard,
    cardClass: 'nav-card-sky',
    iconClass: 'nav-icon bg-gradient-to-br from-[#67c6e8] to-[#3d9fc4] text-[#0a1820]',
    linkClass: 'text-[#9dd9f0]',
  },
  {
    href: '/statistics',
    title: 'Statistieken',
    desc: 'Rapporten en export',
    icon: BarChart3,
    cardClass: 'nav-card-mint',
    iconClass: 'nav-icon bg-gradient-to-br from-[#5eead4] to-[#2dd4bf] text-[#0a1f1a]',
    linkClass: 'text-[#8ef0d8]',
  },
] as const;

export default function Home() {
  const [sessions, setSessions] = useState<DetentionSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/detentions/sessions', { cache: 'no-store' });
      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingPage label="Sessies laden..." />;
  }

  const filteredSessions = sessions.filter((session) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return session.detentions.some(
      (d) =>
        d.student.toLowerCase().includes(searchLower) ||
        d.reason?.toLowerCase().includes(searchLower) ||
        d.teacher?.toLowerCase().includes(searchLower)
    );
  });

  const totalDetentions = sessions.reduce((n, s) => n + s.detentions.length, 0);

  return (
    <div className="app-page">
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Schoolbeheer
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                Nablijven
              </h1>
              <p className="text-secondary mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="time-pill">
                  <Clock className="h-3.5 w-3.5" />
                  16:00 – 16:50
                </span>
                <span className="text-muted">· {totalDetentions} registraties totaal</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/backup');
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `nablijven-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading backup:', error);
                    alert('Fout bij downloaden van backup');
                  }
                }}
                className="btn-secondary flex items-center gap-2 text-sm"
                title="Download Backup"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Backup</span>
              </button>
              <BackupRestore />
              <Link href="/detentions/new" className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" />
                <span>Nieuwe sessie</span>
              </Link>
              <InstallPrompt />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-card ${item.cardClass} group`}>
              <div className="relative flex flex-col gap-4">
                <div className={item.iconClass}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-primary">{item.title}</h2>
                  <p className="text-sm text-muted mt-1 leading-relaxed">{item.desc}</p>
                </div>
                <div
                  className={`flex items-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${item.linkClass}`}
                >
                  <span>Openen</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
            <div>
              <h2 className="section-title">Recente sessies</h2>
              <p className="section-subtitle">
                {filteredSessions.length} sessie{filteredSessions.length !== 1 ? 's' : ''} gevonden
              </p>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted pointer-events-none" />
              <input
                type="search"
                placeholder="Leerling, reden of leerkracht…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12"
              />
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="empty-state">
              <Calendar className="h-12 w-12 text-muted mb-4 opacity-60" />
              <p className="text-secondary font-medium mb-4">Nog geen sessies geregistreerd.</p>
              <Link href="/detentions/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Eerste sessie aanmaken
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions
                .slice(-10)
                .reverse()
                .map((session) => (
                  <Link key={session.date} href={`/detentions/${session.date}`} className="session-row group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-primary text-base mb-2 group-hover:text-[var(--accent-hover)] transition-colors">
                          {format(new Date(session.date), 'EEEE d MMMM yyyy', { locale: nl })}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-muted" />
                            <span className="font-semibold text-secondary">{session.detentions.length}</span>
                            nablijven
                          </span>
                          <span className="badge-primary">{session.dayOfWeek}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end shrink-0">
                        {session.detentions.filter((d) => d.shouldPrint).length > 0 && (
                          <span className="badge-success">
                            {session.detentions.filter((d) => d.shouldPrint).length} print
                          </span>
                        )}
                        {session.detentions.filter((d) => d.nablijvenGeweigerd).length > 0 && (
                          <span className="badge-danger">
                            {session.detentions.filter((d) => d.nablijvenGeweigerd).length} geweigerd
                          </span>
                        )}
                        {session.detentions.filter((d) => d.isDoublePeriod).length > 0 && (
                          <span className="badge-warning">
                            {session.detentions.filter((d) => d.isDoublePeriod).length} strafstudie
                          </span>
                        )}
                      </div>
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
