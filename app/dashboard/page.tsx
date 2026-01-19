'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Users, Calendar, BarChart3, AlertCircle, Clock, FileText } from 'lucide-react';
import { Detention, Student } from '@/types';
import { format, subDays, subMonths, subYears, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import nl from 'date-fns/locale/nl';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function DashboardPage() {
  const router = useRouter();
  const [detentions, setDetentions] = useState<Detention[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [detentionsRes, studentsRes] = await Promise.all([
        fetch('/api/detentions'),
        fetch('/api/students')
      ]);
      const detentionsData = await detentionsRes.json();
      const studentsData = await studentsRes.json();
      setDetentions(detentionsData);
      setStudents(studentsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

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
    averagePerDay: period === 'week' ? (filteredDetentions.length / 7).toFixed(1) : 
                   period === 'month' ? (filteredDetentions.length / 30).toFixed(1) : 
                   period === 'year' ? (filteredDetentions.length / 365).toFixed(1) : '0',
  };

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
  ).map(([day, count]) => ({ day, count }));

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.push('/')}
                className="btn-ghost p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1 hidden sm:block">Overzicht en inzichten</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('week')}
                className={`btn ${period === 'week' ? 'btn-primary' : 'btn-secondary'} text-sm px-3 sm:px-5 py-2`}
              >
                Week
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`btn ${period === 'month' ? 'btn-primary' : 'btn-secondary'} text-sm px-3 sm:px-5 py-2`}
              >
                Maand
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`btn ${period === 'year' ? 'btn-primary' : 'btn-secondary'} text-sm px-3 sm:px-5 py-2`}
              >
                Jaar
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`btn ${period === 'all' ? 'btn-primary' : 'btn-secondary'} text-sm px-3 sm:px-5 py-2`}
              >
                Alles
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 sm:p-3 bg-indigo-500/20 rounded-xl">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
              </div>
              <span className="text-xs sm:text-sm text-slate-400">{period === 'week' ? 'Deze week' : period === 'month' ? 'Deze maand' : period === 'year' ? 'Dit jaar' : 'Totaal'}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100">{kpis.total}</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Nablijven</p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 sm:p-3 bg-emerald-500/20 rounded-xl">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
              </div>
              <span className="text-xs sm:text-sm text-slate-400">Unieke</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100">{kpis.uniqueStudents}</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Leerlingen</p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 sm:p-3 bg-amber-500/20 rounded-xl">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              </div>
              <span className="text-xs sm:text-sm text-slate-400">Gemiddeld</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100">{kpis.averagePerDay}</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Per dag</p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 sm:p-3 bg-purple-500/20 rounded-xl">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              </div>
              <span className="text-xs sm:text-sm text-slate-400">Deze week</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100">{kpis.thisWeek}</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Nieuwe</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Tendencia Mensual */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Tendens (Laatste 12 Maanden)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} name="Nablijven" />
                <Line type="monotone" dataKey="students" stroke="#10b981" strokeWidth={2} name="Unieke Leerlingen" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por Día */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Verdeling per Dag</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dayDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => {
                    const data = entry as { day: string; count: number; percent?: number };
                    return `${data.day}: ${((data.percent || 0) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  labelStyle={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fill: '#f1f5f9',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.8), 1px -1px 2px rgba(0, 0, 0, 0.8), -1px 1px 2px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {dayDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Top Estudiantes */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Top 5 Leerlingen</h3>
            <div className="space-y-3">
              {topStudents.length === 0 ? (
                <p className="text-slate-400 text-sm">Geen data beschikbaar</p>
              ) : (
                topStudents.map((student, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <span className="text-slate-200 font-medium">{student.name}</span>
                    </div>
                    <span className="text-slate-300 font-bold">{student.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Razones */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Top 5 Redenen</h3>
            <div className="space-y-3">
              {topReasons.length === 0 ? (
                <p className="text-slate-400 text-sm">Geen data beschikbaar</p>
              ) : (
                topReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <span className="text-slate-200 text-sm truncate">{reason.reason}</span>
                    </div>
                    <span className="text-slate-300 font-bold ml-2">{reason.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Métricas Adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <h4 className="font-bold text-slate-100">Met Chromebook</h4>
            </div>
            <p className="text-3xl font-bold text-slate-100">{kpis.withChromebook}</p>
            <p className="text-sm text-slate-400 mt-1">
              {filteredDetentions.length > 0 
                ? ((kpis.withChromebook / filteredDetentions.length) * 100).toFixed(1) 
                : '0'}% van totaal
            </p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              <h4 className="font-bold text-slate-100">Te Printen</h4>
            </div>
            <p className="text-3xl font-bold text-slate-100">{kpis.toPrint}</p>
            <p className="text-sm text-slate-400 mt-1">
              {filteredDetentions.length > 0 
                ? ((kpis.toPrint / filteredDetentions.length) * 100).toFixed(1) 
                : '0'}% van totaal
            </p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-400" />
              </div>
              <h4 className="font-bold text-slate-100">Totaal Leerlingen</h4>
            </div>
            <p className="text-3xl font-bold text-slate-100">{students.length}</p>
            <p className="text-sm text-slate-400 mt-1">Geregistreerd in systeem</p>
          </div>
        </div>
      </main>
    </div>
  );
}
