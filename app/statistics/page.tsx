'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Download, FileSpreadsheet, FileText, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Detention, Student } from '@/types';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parse } from 'date-fns';
import nl from 'date-fns/locale/nl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import PeriodComparison from '@/app/components/PeriodComparison';
import * as XLSX from 'xlsx';
import { createPDF, autoTable } from '@/lib/pdf-export';

type FilterType = 'day' | 'month' | 'year' | 'custom';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function StatisticsPage() {
  const router = useRouter();
  const [detentions, setDetentions] = useState<Detention[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [pdfReady, setPdfReady] = useState(false);

  // Precargar jspdf-autotable cuando el componente se monte
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('jspdf-autotable')
        .then(() => {
          setPdfReady(true);
          console.log('jspdf-autotable listo para usar');
        })
        .catch(err => {
          console.error('Error precargando jspdf-autotable:', err);
          setPdfReady(false);
        });
    }
  }, []);
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
  const exportToPDF = async () => {
    try {
      // Asegurar que el módulo esté cargado antes de crear el PDF
      if (typeof window !== 'undefined') {
        try {
          await import('jspdf-autotable');
          // Esperar más tiempo para que se registre completamente
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.warn('No se pudo precargar jspdf-autotable:', err);
        }
      }

      const doc = await createPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let yPos = margin;
    
    // Función para agregar nueva página si es necesario
    const checkPageBreak = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };
    
    // Título principal
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Nablijven Statistieken Rapport', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gegenereerd op: ${format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: nl })}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Período analizado
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    let periodText = '';
    switch (filterType) {
      case 'day':
        periodText = `Geanalyseerde Dag: ${format(parseISO(selectedDate), 'dd MMMM yyyy', { locale: nl })}`;
        break;
      case 'month':
        periodText = `Geanalyseerde Maand: ${format(parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date()), 'MMMM yyyy', { locale: nl })}`;
        break;
      case 'year':
        periodText = `Geanalyseerd Jaar: ${selectedYear}`;
        break;
      case 'custom':
        periodText = `Geanalyseerde Periode: ${format(parseISO(customStartDate), 'dd MMMM yyyy', { locale: nl })} tot ${format(parseISO(customEndDate), 'dd MMMM yyyy', { locale: nl })}`;
        break;
    }
    doc.text(periodText, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // ========== SECCIÓN 1: OVERZICHT (RESUMEN) ==========
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Overzicht', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Estadísticas principales en una tabla visual
    const summaryData = [
      ['Totaal aantal nablijven', stats.total.toString()],
      ['Met chromebook toegang', stats.withChromebook.toString()],
      ['Te printen', stats.toPrint.toString()],
      ['Zonder chromebook', (stats.total - stats.withChromebook).toString()],
      ['Percentage met chromebook', stats.total > 0 ? ((stats.withChromebook / stats.total) * 100).toFixed(1) + '%' : '0%'],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Statistiek', 'Waarde']],
      body: summaryData,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
      margin: { left: margin, right: margin },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    checkPageBreak(50);
    
    // ========== SECCIÓN 2: VERDELING PER DAG ==========
    if (dayChartData.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Verdeling per Dag van de Week', margin, yPos);
      yPos += 10;
      
      const dayTableData = dayChartData.map(day => [day.name, day.count.toString()]);
      dayTableData.push(['TOTAAL', stats.total.toString()]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Dag', 'Aantal Nablijven']],
        body: dayTableData,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 
          0: { fontStyle: 'bold' }, 
          1: { halign: 'right' }
        },
        margin: { left: margin, right: margin },
      });
      
      yPos = (doc as any).lastAutoTable?.finalY || yPos + 30;
      checkPageBreak(50);
    }
    
    // ========== SECCIÓN 3: TOP 10 LEERLINGEN ==========
    if (topStudents.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Top 10 Leerlingen met Meeste Nablijven', margin, yPos);
      yPos += 10;
      
      const studentsTableData = topStudents.map((s, idx) => [
        (idx + 1).toString(),
        s.name,
        s.count.toString()
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Leerling', 'Aantal']],
        body: studentsTableData,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 
          0: { halign: 'center', cellWidth: 15 }, 
          1: { fontStyle: 'bold' },
          2: { halign: 'right' }
        },
        margin: { left: margin, right: margin },
      });
      
      yPos = (doc as any).lastAutoTable?.finalY || yPos + 30;
      checkPageBreak(50);
    }
    
    // ========== SECCIÓN 4: TOP 10 LEERKRACHTEN ==========
    if (topTeachers.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Top 10 Leerkrachten met Meeste Nablijven', margin, yPos);
      yPos += 10;
      
      const teachersTableData = topTeachers.map((t, idx) => [
        (idx + 1).toString(),
        t.name,
        t.count.toString()
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Leerkracht', 'Aantal']],
        body: teachersTableData,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 
          0: { halign: 'center', cellWidth: 15 }, 
          1: { fontStyle: 'bold' },
          2: { halign: 'right' }
        },
        margin: { left: margin, right: margin },
      });
      
      yPos = (doc as any).lastAutoTable?.finalY || yPos + 30;
      checkPageBreak(50);
    }
    
    // ========== SECCIÓN 5: TOP 10 REDENEN ==========
    if (topReasons.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('5. Top 10 Meest Voorkomende Redenen', margin, yPos);
      yPos += 10;
      
      const reasonsTableData = topReasons.map((r, idx) => [
        (idx + 1).toString(),
        r.name.length > 50 ? r.name.substring(0, 47) + '...' : r.name,
        r.count.toString()
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Reden', 'Aantal']],
        body: reasonsTableData,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 
          0: { halign: 'center', cellWidth: 15 }, 
          1: { cellWidth: 'auto' },
          2: { halign: 'right' }
        },
        margin: { left: margin, right: margin },
      });
      
      yPos = (doc as any).lastAutoTable?.finalY || yPos + 30;
      checkPageBreak(50);
    }
    
    // ========== SECCIÓN 6: GEDETAILLEERDE LIJST ==========
    if (filteredDetentions.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('6. Gedetailleerde Lijst van Alle Nablijven', margin, yPos);
      yPos += 10;
      
      const detailedTableData = filteredDetentions.map(d => [
        d.number.toString(),
        format(parseISO(d.date), 'dd/MM/yyyy'),
        d.dayOfWeek,
        d.student.length > 30 ? d.student.substring(0, 27) + '...' : d.student,
        (d.teacher || '-').length > 20 ? (d.teacher || '-').substring(0, 17) + '...' : (d.teacher || '-'),
        (d.reason || '-').length > 25 ? (d.reason || '-').substring(0, 22) + '...' : (d.reason || '-'),
        d.shouldPrint ? 'Ja' : 'Nee',
        d.canUseChromebook ? 'Ja' : 'Nee'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Datum', 'Dag', 'Leerling', 'Leerkracht', 'Reden', 'Print', 'Chromebook']],
        body: detailedTableData,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 40 },
          4: { cellWidth: 30 },
          5: { cellWidth: 35 },
          6: { halign: 'center', cellWidth: 15 },
          7: { halign: 'center', cellWidth: 20 }
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // ========== NOTA FINAL ==========
    checkPageBreak(20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Dit rapport is automatisch gegenereerd door het Nablijven Systeem.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    const totalPages = (doc as any).internal.getNumberOfPages();
    doc.text(`Totaal aantal pagina's: ${totalPages}`, pageWidth / 2, yPos, { align: 'center' });
    
    // Guardar PDF
    doc.save(`nablijven-rapport-${filterType}-${Date.now()}.pdf`);
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      alert('Fout bij exporteren naar PDF. Zorg ervoor dat jspdf-autotable correct is geladen.');
    }
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
    
    // Hoja 2: Nablijven
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
    XLSX.utils.book_append_sheet(workbook, detentionsSheet, 'Nablijven');
    
    XLSX.writeFile(workbook, `nablijven-statistieken-${filterType}-${Date.now()}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.push('/')}
                className="btn-ghost p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">Statistieken</h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1 hidden sm:block">Analyse en rapporten van nablijven</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={exportToPDF}
                className="btn-secondary flex items-center gap-2 text-sm px-3 sm:px-5 py-2"
                title="Exporteer naar PDF"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Exporteer PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <button
                onClick={exportToExcel}
                className="btn-secondary flex items-center gap-2 text-sm px-3 sm:px-5 py-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Exporteer Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Filtros */}
        <div className="card p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Filter className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Filters</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
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

        {/* Period Comparison */}
        <div className="mb-8">
          <PeriodComparison detentions={detentions} />
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

        {/* Tabla Completa de Nablijven */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Alle Nablijven ({filteredDetentions.length})</h3>
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
                      Geen nablijven gevonden voor de geselecteerde periode.
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
