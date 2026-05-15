'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TrendingUp, Users, BarChart3, AlertCircle, Clock, FileText, RefreshCw, XCircle, BookOpen } from 'lucide-react';
import KpiCard from '@/app/components/ui/KpiCard';
import PageHeader from '@/app/components/ui/PageHeader';
import LoadingPage from '@/app/components/ui/LoadingPage';
import RankList from '@/app/components/ui/RankList';
import { Detention, Student } from '@/types';
import { format, subDays, subMonths, subYears, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import nl from 'date-fns/locale/nl';
import ChartCard from '@/app/components/charts/ChartCard';
import NablijvenLineChart from '@/app/components/charts/NablijvenLineChart';
import NablijvenPieChart from '@/app/components/charts/NablijvenPieChart';
import { DAY_LABELS, NABLIIJVEN_CHART_COLORS } from '@/lib/chartTheme';

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [detentions, setDetentions] = useState<Detention[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [detentionsRes, studentsRes] = await Promise.all([
        fetch('/api/detentions', { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' }),
      ]);
      const detentionsData = await detentionsRes.json();
      const studentsData = await studentsRes.json();
      setDetentions(Array.isArray(detentionsData) ? detentionsData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [pathname, fetchData]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchData(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchData]);

  const getFilteredDetentions = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'all':
        return detentions;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    return detentions.filter(d => {
      const detDate = parseISO(d.date);
      return isWithinInterval(detDate, { start: startDate, end: endDate });
    });
  };

  const filteredDetentions = getFilteredDetentions();

  // KPIs
  const kpis = {
    total: filteredDetentions.length,
    thisWeek: detentions.filter(d => {
      const detDate = parseISO(d.date);
      return isWithinInterval(detDate, { start: subDays(new Date(), 7), end: new Date() });
    }).length,
    uniqueStudents: new Set(filteredDetentions.map(d => d.student.split(' - ')[0])).size,
    withChromebook: filteredDetentions.filter(d => d.canUseChromebook).length,
    toPrint: filteredDetentions.filter(d => d.shouldPrint).length,
    geweigerd: filteredDetentions.filter(d => d.nablijvenGeweigerd).length,
    strafstudie: filteredDetentions.filter(d => d.isDoublePeriod).length,
    averagePerDay: period === 'week' ? (filteredDetentions.length / 7).toFixed(1) : 
                   period === 'month' ? (filteredDetentions.length / 30).toFixed(1) : 
                   period === 'year' ? (filteredDetentions.length / 365).toFixed(1) : '0',
  };

  const periodHint =
    period === 'week' ? 'Deze week' : period === 'month' ? 'Deze maand' : period === 'year' ? 'Dit jaar' : 'Alle periodes';

  // Tendencias - últimos 12 meses
  const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), 11 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const monthDetentions = detentions.filter(d => {
      const detDate = parseISO(d.date);
      return isWithinInterval(detDate, { start: monthStart, end: monthEnd });
    });
    return {
      month: format(date, 'MMM', { locale: nl }),
      count: monthDetentions.length,
      students: new Set(monthDetentions.map(d => d.student.split(' - ')[0])).size,
    };
  });

  // Top estudiantes
  const topStudents = Object.entries(
    filteredDetentions.reduce((acc, d) => {
      const studentName = d.student.split(' - ')[0];
      acc[studentName] = (acc[studentName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Distribución por día
  const dayDistribution = Object.entries(
    filteredDetentions.reduce((acc, d) => {
      acc[d.dayOfWeek] = (acc[d.dayOfWeek] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([day, count]) => ({ label: day, value: count }));

  // Razones más comunes
  const topReasons = Object.entries(
    filteredDetentions.reduce((acc, d) => {
      if (d.reason) {
        const reason = d.reason.length > 30 ? d.reason.substring(0, 30) + '...' : d.reason;
        acc[reason] = (acc[reason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  if (loading) {
    return <LoadingPage label="Dashboard laden..." />;
  }

  const periodButtons = (
    <>
      {(['week', 'month', 'year', 'all'] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPeriod(p)}
          className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'} text-sm px-3 sm:px-4 py-2`}
        >
          {p === 'week' ? 'Week' : p === 'month' ? 'Maand' : p === 'year' ? 'Jaar' : 'Alles'}
        </button>
      ))}
      <button
        type="button"
        onClick={() => fetchData(true)}
        disabled={refreshing}
        className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5"
        title="Vernieuwen"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Vernieuwen</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      <PageHeader
        title="Dashboard"
        subtitle="Overzicht en inzichten"
        icon={BarChart3}
        onBack={() => router.push('/')}
        actions={periodButtons}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <KpiCard label="Nablijven" value={kpis.total} hint={periodHint} icon={FileText} tone="indigo" />
          <KpiCard label="Unieke leerlingen" value={kpis.uniqueStudents} hint={periodHint} icon={Users} tone="emerald" />
          <KpiCard label="Gemiddeld per dag" value={kpis.averagePerDay} hint={periodHint} icon={Clock} tone="amber" />
          <KpiCard label="Nieuwe deze week" value={kpis.thisWeek} icon={TrendingUp} tone="purple" />
          <KpiCard label="Geweigerd" value={kpis.geweigerd} hint={periodHint} icon={XCircle} tone="red" />
          <KpiCard label="Strafstudies" value={kpis.strafstudie} hint={periodHint} icon={BookOpen} tone="rose" />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <ChartCard
            title="Tendens (Laatste 12 Maanden)"
            subtitle="Nablijven en unieke leerlingen per maand"
            empty={monthlyTrends.every((m) => m.count === 0 && m.students === 0)}
          >
            <NablijvenLineChart
              data={monthlyTrends}
              labelKey="month"
              series={[
                { dataKey: 'count', name: 'Nablijven', color: NABLIIJVEN_CHART_COLORS.primary },
                { dataKey: 'students', name: 'Unieke Leerlingen', color: NABLIIJVEN_CHART_COLORS.secondary },
              ]}
              ariaLabel="Tendens nablijven laatste 12 maanden"
            />
          </ChartCard>

          <ChartCard
            title="Verdeling per Dag"
            subtitle="Maandag, dinsdag en donderdag"
            empty={dayDistribution.length === 0}
          >
            <NablijvenPieChart
              data={dayDistribution}
              formatLabel={(d) => DAY_LABELS[d] ?? d}
              ariaLabel="Verdeling nablijven per weekdag"
            />
          </ChartCard>
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Top 5 Leerlingen</h3>
            <RankList
              items={topStudents.map((s) => ({ label: s.name, value: s.count }))}
            />
          </div>
          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Top 5 Redenen</h3>
            <RankList
              items={topReasons.map((r) => ({ label: r.reason, value: r.count }))}
              tone="red"
            />
          </div>
        </div>

        {/* Métricas Adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <KpiCard
            label="Met Chromebook"
            value={kpis.withChromebook}
            hint={
              filteredDetentions.length > 0
                ? `${((kpis.withChromebook / filteredDetentions.length) * 100).toFixed(1)}% van totaal`
                : '0% van totaal'
            }
            icon={Users}
            tone="emerald"
          />
          <KpiCard
            label="Te printen"
            value={kpis.toPrint}
            hint={
              filteredDetentions.length > 0
                ? `${((kpis.toPrint / filteredDetentions.length) * 100).toFixed(1)}% van totaal`
                : '0% van totaal'
            }
            icon={FileText}
            tone="purple"
          />
          <KpiCard
            label="Geregistreerde leerlingen"
            value={students.length}
            hint="In het systeem"
            icon={AlertCircle}
            tone="amber"
          />
        </div>

      </main>
    </div>
  );
}
