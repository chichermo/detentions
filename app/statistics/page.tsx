'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Download, FileSpreadsheet, FileText, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Detention, Student } from '@/types';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parse } from 'date-fns';
import nl from 'date-fns/locale/nl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

type FilterType = 'day' | 'month' | 'year' | 'custom';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function StatisticsPage() {
  const router = useRouter();
  const [detentions, setDetentions] = useState<Detention[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getFilteredDetentions = () => {
    let filtered = [...detentions];

    switch (filterType) {
      case 'day':
        filtered = filtered.filter(d => d.date === selectedDate);
        break;
      case 'month':
        const monthStart = startOfMonth(parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date()));
        const monthEnd = endOfMonth(monthStart);
        filtered = filtered.filter(d => {
          const detDate = parseISO(d.date);
          return isWithinInterval(detDate, { start: monthStart, end: monthEnd });
        });
        break;
      case 'year':
        const yearStart = startOfYear(parse(selectedYear + '-01-01', 'yyyy-MM-dd', new Date()));
        const yearEnd = endOfYear(yearStart);
        filtered = filtered.filter(d => {
          const detDate = parseISO(d.date);
          return isWithinInterval(detDate, { start: yearStart, end: yearEnd });
        });
        break;
      case 'custom':
        const customStart = parseISO(customStartDate);
        const customEnd = parseISO(customEndDate);
        filtered = filtered.filter(d => {
          const detDate = parseISO(d.date);
          return isWithinInterval(detDate, { start: customStart, end: customEnd });
        });
        break;
    }

    return filtered;
  };

  const filteredDetentions = getFilteredDetentions();

  // Estadísticas calculadas
  const stats = {
    total: filteredDetentions.length,
    byDay: filteredDetentions.reduce((acc, d) => {
      acc[d.dayOfWeek] = (acc[d.dayOfWeek] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStudent: filteredDetentions.reduce((acc, d) => {
      const studentName = d.student.split(' - ')[0];
      acc[studentName] = (acc[studentName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byTeacher: filteredDetentions.reduce((acc, d) => {
      if (d.teacher) {
        acc[d.teacher] = (acc[d.teacher] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>),
    byReason: filteredDetentions.reduce((acc, d) => {
      if (d.reason) {
        acc[d.reason] = (acc[d.reason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>),
    withChromebook: filteredDetentions.filter(d => d.canUseChromebook).length,
    toPrint: filteredDetentions.filter(d => d.shouldPrint).length,
  };

  // Datos para gráficos
  const dayChartData = Object.entries(stats.byDay).map(([day, count]) => ({
    name: day,
    count
  }));

  const topStudents = Object.entries(stats.byStudent)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topTeachers = Object.entries(stats.byTeacher)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topReasons = Object.entries(stats.byReason)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Título
    doc.setFontSize(20);
    doc.text('Nablijven Statistieken', pageWidth / 2, 20, { align: 'center' });
    
    // Período
    doc.setFontSize(12);
    let periodText = '';
    switch (filterType) {
      case 'day':
        periodText = `Dag: ${format(parseISO(selectedDate), 'dd MMMM yyyy', { locale: nl })}`;
        break;
      case 'month':
        periodText = `Maand: ${format(parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date()), 'MMMM yyyy', { locale: nl })}`;
        break;
      case 'year':
        periodText = `Jaar: ${selectedYear}`;
        break;
      case 'custom':
        periodText = `Periode: ${format(parseISO(customStartDate), 'dd MMM yyyy', { locale: nl })} - ${format(parseISO(customEndDate), 'dd MMM yyyy', { locale: nl })}`;
        break;
    }
    doc.text(periodText, pageWidth / 2, 30, { align: 'center' });
    
    let yPos = 45;
    
    // Resumen
    doc.setFontSize(14);
    doc.text('Resumen', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Total nablijven: ${stats.total}`, 14, yPos);
    yPos += 7;
    doc.text(`Met chromebook: ${stats.withChromebook}`, 14, yPos);
    yPos += 7;
    doc.text(`Te printen: ${stats.toPrint}`, 14, yPos);
    yPos += 15;
    
    // Tabla de detenciones
    if (filteredDetentions.length > 0) {
      doc.setFontSize(14);
      doc.text('Detenciones', 14, yPos);
      yPos += 10;
      
      const tableData = filteredDetentions.map(d => [
        d.number.toString(),
        format(parseISO(d.date), 'dd/MM/yyyy'),
        d.student,
        d.teacher || '',
        d.reason || '',
        d.shouldPrint ? 'Ja' : 'Nee',
        d.canUseChromebook ? 'Ja' : 'Nee'
      ]);
      
      (doc as any).autoTable({
        startY: yPos,
        head: [['#', 'Datum', 'Leerling', 'Leerkracht', 'Reden', 'Print', 'Chromebook']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246] },
        margin: { top: yPos }
      });
    }
    
    doc.save(`nablijven-statistieken-${filterType}-${Date.now()}.pdf`);
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Hoja 1: Resumen
    const summaryData = [
      ['Nablijven Statistieken'],
      [''],
      ['Periode', filterType === 'day' ? selectedDate : filterType === 'month' ? selectedMonth : filterType === 'year' ? selectedYear : `${customStartDate} - ${customEndDate}`],
      ['Total nablijven', stats.total],
      ['Met chromebook', stats.withChromebook],
      ['Te printen', stats.toPrint],
      [''],
      ['Per Dag'],
      ['Dag', 'Aantal'],
      ...Object.entries(stats.byDay).map(([day, count]) => [day, count]),
      [''],
      ['Top 10 Leerlingen'],
      ['Leerling', 'Aantal'],
      ...topStudents.map(s => [s.name, s.count]),
      [''],
      ['Top 10 Leerkrachten'],
      ['Leerkracht', 'Aantal'],
      ...topTeachers.map(t => [t.name, t.count]),
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    
    // Hoja 2: Detenciones
    const detentionsData = [
      ['#', 'Datum', 'Dag', 'Leerling', 'Leerkracht', 'Reden', 'Opdracht', 'LVS Datum', 'Print', 'Chromebook', 'Opmerkingen'],
      ...filteredDetentions.map(d => [
        d.number,
        d.date,
        d.dayOfWeek,
        d.student,
        d.teacher || '',
        d.reason || '',
        d.task || '',
        d.lvsDate || '',
        d.shouldPrint ? 'Ja' : 'Nee',
        d.canUseChromebook ? 'Ja' : 'Nee',
        d.extraNotes || ''
      ])
    ];
    
    const detentionsSheet = XLSX.utils.aoa_to_sheet(detentionsData);
    XLSX.utils.book_append_sheet(workbook, detentionsSheet, 'Detenciones');
    
    XLSX.writeFile(workbook, `nablijven-statistieken-${filterType}-${Date.now()}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="btn-ghost p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Statistieken</h1>
                  <p className="text-slate-400 text-sm mt-1">Analyse en rapporten van nablijven</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                className="btn-secondary flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Exporteer PDF
              </button>
              <button
                onClick={exportToExcel}
                className="btn-secondary flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exporteer Excel
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Filtros */}
        <div className="card p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="h-5 w-5 text-indigo-400" />
            <h2 className="section-title">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => setFilterType('day')}
              className={`btn ${filterType === 'day' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Per Dag
            </button>
            <button
              onClick={() => setFilterType('month')}
              className={`btn ${filterType === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Per Maand
            </button>
            <button
              onClick={() => setFilterType('year')}
              className={`btn ${filterType === 'year' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Per Jaar
            </button>
            <button
              onClick={() => setFilterType('custom')}
              className={`btn ${filterType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Aangepast
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filterType === 'day' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Datum</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field"
                />
              </div>
            )}
            
            {filterType === 'month' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Maand</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input-field"
                />
              </div>
            )}
            
            {filterType === 'year' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Jaar</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  min="2020"
                  max="2030"
                  className="input-field"
                />
              </div>
            )}
            
            {filterType === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Van</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tot</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resumen de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Nablijven</p>
                <p className="text-3xl font-bold text-slate-100">{stats.total}</p>
              </div>
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <BarChart3 className="h-6 w-6 text-indigo-400" />
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Met Chromebook</p>
                <p className="text-3xl font-bold text-slate-100">{stats.withChromebook}</p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <CalendarIcon className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Te Printen</p>
                <p className="text-3xl font-bold text-slate-100">{stats.toPrint}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <FileText className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico por Día */}
          {dayChartData.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Nablijven per Dag</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico Top Estudiantes */}
          {topStudents.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Top 10 Leerlingen</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topStudents}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tablas de Datos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tabla Top Leerkrachten */}
          {topTeachers.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Top 10 Leerkrachten</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Leerkracht</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Aantal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTeachers.map((teacher, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="py-3 px-4 text-slate-200">{teacher.name}</td>
                        <td className="py-3 px-4 text-slate-200 text-right font-semibold">{teacher.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabla Top Redenen */}
          {topReasons.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Top 10 Redenen</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Reden</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Aantal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReasons.map((reason, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="py-3 px-4 text-slate-200">{reason.name}</td>
                        <td className="py-3 px-4 text-slate-200 text-right font-semibold">{reason.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Tabla Completa de Detenciones */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Alle Detenciones ({filteredDetentions.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">#</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Datum</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Leerling</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Leerkracht</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Reden</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">Print</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">Chromebook</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetentions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Geen detenciones gevonden voor de geselecteerde periode.
                    </td>
                  </tr>
                ) : (
                  filteredDetentions.map((detention) => (
                    <tr key={detention.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-slate-200">{detention.number}</td>
                      <td className="py-3 px-4 text-slate-200">{format(parseISO(detention.date), 'dd/MM/yyyy', { locale: nl })}</td>
                      <td className="py-3 px-4 text-slate-200">{detention.student}</td>
                      <td className="py-3 px-4 text-slate-200">{detention.teacher || '-'}</td>
                      <td className="py-3 px-4 text-slate-200">{detention.reason || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        {detention.shouldPrint ? (
                          <span className="badge-success">✓</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {detention.canUseChromebook ? (
                          <span className="badge-success">✓</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
