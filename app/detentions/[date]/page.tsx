'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2, FileText, Edit, Plus, Save, X, Copy, History, GripVertical, Printer } from 'lucide-react';
import DuplicateSession from '@/app/components/DuplicateSession';
import DetentionTemplateManager from '@/app/components/DetentionTemplate';
import DragDropDetentions from '@/app/components/DragDropDetentions';
import AuditHistory from '@/app/components/AuditHistory';
import FileAttachment from '@/app/components/FileAttachment';
import { Detention, Student, DayOfWeek } from '@/types';
import { apiFetch, OfflineQueuedError } from '@/lib/apiClient';
import { format, parseISO, getDay } from 'date-fns';
import nl from 'date-fns/locale/nl';

const DAYS: DayOfWeek[] = ['MAANDAG', 'DINSDAG', 'DONDERDAG'];

function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  try {
    const d = parseISO(dateStr);
    const dayNum = getDay(d);
    const dayMap: Record<number, DayOfWeek> = {
      1: 'MAANDAG',
      2: 'DINSDAG',
      4: 'DONDERDAG',
    };
    return dayMap[dayNum] ?? 'MAANDAG';
  } catch {
    return 'MAANDAG';
  }
}

export default function DetentionSessionPage() {
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;
  const [detentions, setDetentions] = useState<Detention[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDetention, setEditingDetention] = useState<Partial<Detention> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDetention, setNewDetention] = useState<Partial<Detention> | null>(null);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const fetchDetentions = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/detentions?date=${date}`);
      const data = await response.json();
      // Ordenar por número para asegurar que aparezcan en orden
      // Asegurar que todos los números sean válidos (>= 1)
      const validData = data.map((d: Detention) => ({
        ...d,
        number: d.number && d.number > 0 ? d.number : 1
      }));
      const sorted = validData.sort((a: Detention, b: Detention) => a.number - b.number);
      // Re-numerar si hay números duplicados o faltantes
      const renumbered = sorted.map((d: Detention, index: number) => ({
        ...d,
        number: index + 1
      }));
      setDetentions(renumbered);
    } catch (error) {
      console.error('Error fetching detentions:', error);
    }
  }, [date]);

  const fetchStudents = useCallback(async (day: DayOfWeek) => {
    try {
      const response = await apiFetch(`/api/students?day=${day}`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, []);

  useEffect(() => {
    if (date) {
      fetchDetentions();
    }
  }, [date, fetchDetentions]);

  useEffect(() => {
    if (detentions.length > 0) {
      fetchStudents(detentions[0].dayOfWeek);
    } else if (date) {
      fetchStudents(getDayOfWeekFromDate(date));
    }
  }, [date, detentions, fetchStudents]);

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit nablijven wilt verwijderen?')) return;
    
    try {
      await apiFetch(`/api/detentions?id=${id}`, { method: 'DELETE' });
      fetchDetentions();
    } catch (error) {
      if (error instanceof OfflineQueuedError) {
        alert(error.message);
        return;
      }
      console.error('Error deleting detention:', error);
    }
  };

  const handleReorder = async (reorderedDetentions: Detention[]) => {
    try {
      // Update all detentions with new numbers
      for (const detention of reorderedDetentions) {
        await apiFetch('/api/detentions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(detention),
        });
      }
      fetchDetentions();
    } catch (error) {
      console.error('Error reordering detentions:', error);
    }
  };

  const handleEdit = (detention: Detention) => {
    setEditingId(detention.id);
    // Extraer solo el nombre del estudiante (sin el grado)
    const studentName = detention.student.split(' - ')[0];
    setEditingDetention({
      ...detention,
      student: studentName,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingDetention || !editingId) return;

    const student = students.find(s => s.name === editingDetention.student);
    const studentDisplayName = student 
      ? `${student.name} - ${student.grade}`
      : editingDetention.student || '';

    const updatedDetention: Detention = {
      ...editingDetention as Detention,
      id: editingId,
      student: studentDisplayName,
    };

    try {
      await apiFetch('/api/detentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDetention),
      });
      setEditingId(null);
      setEditingDetention(null);
      fetchDetentions();
    } catch (error) {
      console.error('Error saving detention:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingDetention(null);
  };

  const handleAddNew = () => {
    const dayOfWeek = detentions.length > 0 ? detentions[0].dayOfWeek : getDayOfWeekFromDate(date);
    setNewDetention({
      number: detentions.length + 1,
      date,
      dayOfWeek,
      student: '',
      teacher: '',
      reason: '',
      task: '',
      lvsDate: '',
      shouldPrint: false,
      canUseChromebook: false,
      extraNotes: '',
      isDoublePeriod: false,
      timePeriod: undefined,
      nablijvenGeweigerd: false,
    });
    setShowAddForm(true);
    fetchStudents(dayOfWeek);
  };

  const handleSaveNew = async () => {
    if (!newDetention) return;

    if (!newDetention.student || String(newDetention.student).trim() === '') {
      alert('Selecteer een leerling.');
      return;
    }

    const alreadyInSession = detentions.some(
      d => (d.student.split(' - ')[0] || d.student).trim() === newDetention.student?.trim()
    );
    if (alreadyInSession) {
      alert('Deze leerling heeft al een nablijven voor deze sessie.');
      return;
    }

    const student = students.find(s => s.name === newDetention.student);
    const studentDisplayName = student 
      ? `${student.name} - ${student.grade}`
      : newDetention.student || '';

    const detentionToSave: Detention = {
      id: `detention-${Date.now()}`,
      number: newDetention.number || detentions.length + 1,
      date,
      dayOfWeek: newDetention.dayOfWeek || 'MAANDAG',
      student: studentDisplayName,
      teacher: newDetention.teacher || '',
      reason: newDetention.reason || '',
      task: newDetention.task || '',
      lvsDate: newDetention.lvsDate || '',
      shouldPrint: newDetention.shouldPrint || false,
      canUseChromebook: newDetention.canUseChromebook || false,
      extraNotes: newDetention.extraNotes || '',
      isDoublePeriod: newDetention.isDoublePeriod || false,
      timePeriod: newDetention.timePeriod,
      nablijvenGeweigerd: newDetention.nablijvenGeweigerd || false,
    };

    try {
      const response = await apiFetch('/api/detentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detentionToSave),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data?.details || data?.error || 'Fout bij opslaan. Probeer het opnieuw.');
        return;
      }
      setShowAddForm(false);
      setNewDetention(null);
      fetchDetentions();
    } catch (error) {
      console.error('Error saving new detention:', error);
      alert('Fout bij opslaan. Controleer je verbinding en probeer het opnieuw.');
    }
  };

  const currentDayOfWeek = detentions.length > 0 ? detentions[0].dayOfWeek : getDayOfWeekFromDate(date);
  const hasDoublePeriod = detentions.some(d => d.isDoublePeriod);
  const isMonday = currentDayOfWeek === 'MAANDAG';

  const handleDuplicateSession = async (newDate: string, duplicated: Detention[]) => {
    try {
      for (const detention of duplicated) {
        const { id: _id, ...payload } = detention;
        const response = await apiFetch('/api/detentions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, date: newDate }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          alert(data?.details || data?.error || 'Fout bij dupliceren.');
          return;
        }
      }
      router.push(`/detentions/${newDate}`);
    } catch (error) {
      console.error('Error duplicating session:', error);
      alert('Fout bij dupliceren van sessie.');
    }
  };

  return (
    <div className="app-page">
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.push('/')}
                className="btn-ghost p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">
                  Nablijven Sessie
                </h1>
                <p className="text-slate-400 mt-1 text-xs sm:text-sm">
                  {format(parseISO(date), "EEEE d MMMM yyyy", { locale: nl })}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
                title="Afdrukken"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Afdrukken</span>
              </button>
              {detentions.length > 0 && (
                <DuplicateSession
                  detentions={detentions}
                  currentDate={date}
                  onDuplicate={handleDuplicateSession}
                />
              )}
              {!showAddForm && (
                <button
                  onClick={handleAddNew}
                  className="btn-secondary flex items-center gap-2 text-sm px-3 sm:px-5 py-2"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Nieuwe Toevoegen</span>
                  <span className="sm:hidden">Nieuw</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="card p-8 mb-8 print:shadow-none">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="section-title">
                Nablijven {hasDoublePeriod ? '(Strafstudie: 16u tot 17u40)' : '(van 16u tot 16u50)'}
              </h2>
              <p className="section-subtitle">
                {detentions.length} nablijven geregistreerd
                {hasDoublePeriod && ' • Strafstudie actief'}
              </p>
            </div>
          </div>
        </div>

        {/* Add New Form */}
        {showAddForm && newDetention && (
          <div className="card p-8 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="text-lg font-bold text-primary">Nieuwe nablijven toevoegen</h3>
              <div className="flex items-center gap-2">
                <DetentionTemplateManager
                  currentDetention={newDetention}
                  onSelectTemplate={(template) =>
                    setNewDetention((prev) => (prev ? { ...prev, ...template } : prev))
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewDetention(null);
                  }}
                  className="btn-ghost p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {(() => {
              const availableStudents = students.filter(s => !detentions.some(d => (d.student.split(' - ')[0] || d.student).trim() === s.name));
              return (
                <>
                  {availableStudents.length === 0 && (
                    <p className="text-amber-400 text-sm mb-4">Alle leerlingen voor deze sessie zijn al toegevoegd.</p>
                  )}
                  <DetentionForm
                    detention={newDetention}
                    students={availableStudents}
                    onChange={(field, value) => setNewDetention({ ...newDetention, [field]: value })}
                  />
                </>
              );
            })()}
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveNew} className="btn-primary flex items-center gap-2">
                <Save className="h-5 w-5" />
                Opslaan
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewDetention(null);
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {detentions.length === 0 && !showAddForm ? (
          <div className="card p-16 text-center">
            <p className="text-slate-400 font-medium mb-4">Geen nablijven geregistreerd voor deze datum.</p>
            <button onClick={handleAddNew} className="btn-primary flex items-center gap-2 mx-auto">
              <Plus className="h-5 w-5" />
              Eerste Nablijven Toevoegen
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden print:shadow-none">
            <div className="overflow-auto max-h-[calc(100vh-16rem)]">
              <table className="table-data">
                <colgroup>
                  <col className="print:hidden w-12 shrink-0" />
                  <col className="w-14 shrink-0" />
                  <col style={{ minWidth: '11rem' }} />
                  <col style={{ minWidth: '7rem' }} />
                  <col style={{ minWidth: '7rem' }} />
                  <col style={{ minWidth: '7rem' }} />
                  <col style={{ minWidth: '7rem' }} />
                  <col style={{ width: '5.25rem', minWidth: '5.25rem' }} />
                  <col style={{ width: '6.75rem', minWidth: '6.75rem' }} />
                  <col style={{ width: '6.75rem', minWidth: '6.75rem' }} />
                  {isMonday && <col style={{ width: '7rem', minWidth: '7rem' }} />}
                  <col style={{ minWidth: '12rem' }} />
                  <col className="print:hidden w-[8rem] shrink-0" />
                </colgroup>
                <thead className="shadow-[0_1px_0_0_rgba(148,163,184,0.1)] print:static">
                  <tr>
                    <th className="w-12 min-w-[2.75rem] px-2 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap print:hidden align-middle">
                      <GripVertical className="h-4 w-4 text-muted shrink-0" />
                    </th>
                    <th className="w-14 min-w-[2.75rem] px-2 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap align-middle">
                      #
                    </th>
                    <th className="min-w-[11rem] px-2 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap align-middle">
                      Leerling
                    </th>
                    <th className="min-w-[7rem] px-2 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap align-middle">
                      Leerkracht
                    </th>
                    <th className="min-w-[7rem] px-2 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap align-middle">
                      Reden
                    </th>
                    <th className="min-w-[7rem] px-2 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap align-middle">
                      Opdracht
                    </th>
                    <th className="min-w-[7rem] px-2 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap align-middle">
                      Datum LVS
                    </th>
                    <th className="w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem] px-1 py-4 text-center text-xs font-bold text-muted uppercase tracking-normal whitespace-normal align-middle leading-tight">
                      Afdrukken
                    </th>
                    <th className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] px-1 py-4 text-center text-xs font-bold text-muted uppercase tracking-normal whitespace-normal align-middle leading-tight">
                      Chromebook
                    </th>
                    <th className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] px-1 py-4 text-center text-xs font-bold text-muted uppercase tracking-normal whitespace-normal align-middle leading-tight">
                      Geweigerd
                    </th>
                    {isMonday && (
                      <th className="w-28 min-w-[7rem] max-w-[7rem] px-1 py-4 text-center text-xs font-bold text-muted uppercase tracking-normal whitespace-normal align-middle leading-tight">
                        Strafstudie
                      </th>
                    )}
                    <th className="min-w-[12rem] px-2 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap align-middle">
                      Opmerkingen
                    </th>
                    <th className="sticky right-0 z-20 w-36 min-w-[9rem] max-w-[9rem] px-2 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap print:hidden bg-[rgba(14,15,22,0.95)] backdrop-blur-sm shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.35)] align-middle">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/30 divide-y divide-slate-700">
                  <DragDropDetentions
                    detentions={detentions}
                    onReorder={handleReorder}
                  >
                    {(detention, index, isDragging) => (
                      <tr 
                        key={detention.id} 
                        className={`transition-colors ${isDragging ? 'opacity-50' : ''} ${editingId === detention.id ? 'bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/30' : ''}`}
                      >
                        <td className="whitespace-nowrap print:hidden cursor-move">
                          <GripVertical className="h-5 w-5 text-slate-500 hover:text-indigo-400" />
                        </td>
                        {editingId === detention.id && editingDetention ? (
                          <EditRow
                            detention={editingDetention}
                            students={students}
                            onSave={handleSaveEdit}
                            onCancel={handleCancelEdit}
                            onChange={(field, value) => setEditingDetention({ ...editingDetention, [field]: value })}
                            isMonday={isMonday}
                          />
                        ) : (
                          <>
                            <td className="w-10 min-w-[2.5rem] max-w-[2.5rem] px-2 py-4 whitespace-nowrap align-top">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
                              {detention.number}
                            </div>
                          </td>
                          <td className="px-2 py-4 max-w-0 overflow-hidden align-top">
                            <div className="text-sm font-semibold text-slate-100 truncate" title={detention.student}>
                              {detention.student}
                            </div>
                          </td>
                          <td className="px-2 py-4 max-w-0 overflow-hidden whitespace-nowrap align-top">
                            <div className="text-sm text-slate-400 truncate" title={detention.teacher || '-'}>
                              {detention.teacher || '-'}
                            </div>
                          </td>
                          <td className="px-2 py-4 max-w-0 overflow-hidden align-top">
                            <div className="text-sm text-slate-400 truncate" title={detention.reason || '-'}>
                              {detention.reason || '-'}
                            </div>
                          </td>
                          <td className="px-2 py-4 max-w-0 overflow-hidden align-top">
                            <div className="text-sm text-slate-400 truncate" title={detention.task || '-'}>
                              {detention.task || '-'}
                            </div>
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap align-top">
                            <div className="text-sm text-slate-400">
                              {detention.lvsDate ? format(parseISO(detention.lvsDate), 'dd/MM/yyyy') : '-'}
                            </div>
                          </td>
                          <td className="w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem] px-1 py-4 whitespace-nowrap text-center align-middle">
                            {detention.shouldPrint ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 mx-auto bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-600 inline-block min-h-[1.5rem] leading-[1.5rem]">—</span>
                            )}
                          </td>
                          <td className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] px-1 py-4 whitespace-nowrap text-center align-middle">
                            {detention.canUseChromebook ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 mx-auto bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-600 inline-block min-h-[1.5rem] leading-[1.5rem]">—</span>
                            )}
                          </td>
                          <td className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] px-1 py-4 whitespace-nowrap text-center align-middle">
                            {detention.nablijvenGeweigerd ? (
                              <span className="inline-flex items-center justify-center px-2 py-1 mx-auto bg-red-500/20 text-red-300 rounded-full text-xs font-bold border border-red-500/30">
                                Ja
                              </span>
                            ) : (
                              <span className="text-slate-600 inline-block min-h-[1.5rem] leading-[1.5rem]">—</span>
                            )}
                          </td>
                          {isMonday && (
                            <td className="w-28 min-w-[7rem] max-w-[7rem] px-1 py-4 whitespace-nowrap text-center align-middle">
                              {detention.isDoublePeriod ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 mx-auto bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-slate-600 inline-block min-h-[1.5rem] leading-[1.5rem]">—</span>
                              )}
                            </td>
                          )}
                          <td className="min-w-[12rem] px-2 py-4 max-w-xs align-middle">
                            <div className="text-sm text-slate-400 line-clamp-2 break-words" title={detention.extraNotes || '-'}>
                              {detention.extraNotes || '-'}
                            </div>
                          </td>
                          <td className="sticky right-0 z-20 w-36 min-w-[9rem] max-w-[9rem] text-right print:hidden bg-[rgba(20,22,32,0.92)] backdrop-blur-sm shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.35)] align-middle px-2 py-3">
                            <div className="flex justify-end gap-1 flex-nowrap shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedRecordId(detention.id);
                                  setShowAuditHistory(true);
                                }}
                                className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-500/20 rounded-lg transition-all shrink-0"
                                title="Geschiedenis"
                              >
                                <History className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleEdit(detention)}
                                className="text-indigo-400 hover:text-indigo-300 p-1.5 hover:bg-indigo-500/20 rounded-lg transition-all shrink-0"
                                title="Bewerken"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(detention.id)}
                                className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/20 rounded-lg transition-all shrink-0"
                                title="Verwijderen"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                      </tr>
                    )}
                  </DragDropDetentions>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showAuditHistory && selectedRecordId && (
          <div className="mt-6 space-y-6">
            <AuditHistory
              tableName="detentions"
              recordId={selectedRecordId}
            />
            <FileAttachment
              recordId={selectedRecordId}
              recordType="detention"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowAuditHistory(false);
                  setSelectedRecordId(null);
                }}
                className="btn-secondary"
              >
                Sluiten
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Componente para el formulario de edición inline
function EditRow({
  detention,
  students,
  onSave,
  onCancel,
  onChange,
  isMonday,
}: {
  detention: Partial<Detention>;
  students: Student[];
  onSave: () => void;
  onCancel: () => void;
  onChange: (field: keyof Detention, value: any) => void;
  isMonday?: boolean;
}) {
  return (
    <>
      <td className="whitespace-nowrap align-middle px-2 py-3">
        <div className="w-8 h-8 mx-auto bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          {detention.number}
        </div>
      </td>
      <td className="min-w-[11rem] max-w-[18rem] px-2 py-3 align-middle">
        <select
          value={detention.student || ''}
          onChange={(e) => onChange('student', e.target.value)}
          className="select-field-compact w-full block"
        >
          <option value="">Selecteer...</option>
          {students.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name} - {s.grade}
            </option>
          ))}
        </select>
      </td>
      <td className="min-w-[7rem] max-w-[12rem] px-2 py-3 align-middle">
        <input
          type="text"
          value={detention.teacher || ''}
          onChange={(e) => onChange('teacher', e.target.value)}
          className="input-field-table w-full"
        />
      </td>
      <td className="min-w-[7rem] max-w-[14rem] px-2 py-3 align-middle">
        <input
          type="text"
          value={detention.reason || ''}
          onChange={(e) => onChange('reason', e.target.value)}
          className="input-field-table w-full"
        />
      </td>
      <td className="min-w-[7rem] max-w-[14rem] px-2 py-3 align-middle">
        <input
          type="text"
          value={detention.task || ''}
          onChange={(e) => onChange('task', e.target.value)}
          className="input-field-table w-full"
        />
      </td>
      <td className="min-w-[7rem] w-[8rem] px-2 py-3 align-middle">
        <input
          type="date"
          value={detention.lvsDate || ''}
          onChange={(e) => onChange('lvsDate', e.target.value)}
          className="input-field-table date-field w-full min-h-[2.25rem]"
        />
      </td>
      <td className="w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem] px-1 py-3 align-middle">
        <div className="flex justify-center items-center min-h-[2rem]">
          <input
            type="checkbox"
            checked={detention.shouldPrint || false}
            onChange={(e) => onChange('shouldPrint', e.target.checked)}
            className="h-5 w-5 shrink-0 rounded border border-[var(--border-default)] bg-black/30 accent-[var(--accent)]"
          />
        </div>
      </td>
      <td className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] px-1 py-3 align-middle">
        <div className="flex justify-center items-center min-h-[2rem]">
          <input
            type="checkbox"
            checked={detention.canUseChromebook || false}
            onChange={(e) => onChange('canUseChromebook', e.target.checked)}
            className="h-5 w-5 shrink-0 rounded border border-[var(--border-default)] bg-black/30 accent-[var(--accent)]"
          />
        </div>
      </td>
      <td className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] px-1 py-3 align-middle">
        <div className="flex justify-center items-center min-h-[2rem]">
          <input
            type="checkbox"
            checked={detention.nablijvenGeweigerd || false}
            onChange={(e) => onChange('nablijvenGeweigerd', e.target.checked)}
            className="h-5 w-5 shrink-0 rounded border border-[var(--border-default)] bg-black/30 accent-[var(--coral)]"
          />
        </div>
      </td>
      {isMonday && (
        <td className="w-28 min-w-[7rem] max-w-[7rem] px-1 py-3 align-middle">
          <div className="flex justify-center items-center min-h-[2rem]">
            <input
              type="checkbox"
              checked={detention.isDoublePeriod || false}
              onChange={(e) => onChange('isDoublePeriod', e.target.checked)}
              className="h-5 w-5 shrink-0 rounded border border-[var(--border-default)] bg-black/30 accent-amber-500"
            />
          </div>
        </td>
      )}
      <td className="min-w-[12rem] max-w-[20rem] px-2 py-3 align-middle">
        <textarea
          value={detention.extraNotes || ''}
          onChange={(e) => onChange('extraNotes', e.target.value)}
          rows={1}
          className="input-field-table resize-none w-full min-h-[2.25rem]"
          placeholder="Opmerkingen..."
        />
      </td>
      <td className="sticky right-0 z-20 w-36 min-w-[9rem] max-w-[9rem] text-right print:hidden bg-[rgba(20,22,32,0.92)] backdrop-blur-sm shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.35)] px-2 py-3 align-middle">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onSave}
            className="text-emerald-400 hover:text-emerald-300 p-2 hover:bg-emerald-500/20 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            title="Opslaan"
          >
            <Save className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-300 p-2 hover:bg-slate-700 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            title="Annuleren"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </td>
    </>
  );
}

// Componente para el formulario completo
function DetentionForm({
  detention,
  students,
  onChange,
}: {
  detention: Partial<Detention>;
  students: Student[];
  onChange: (field: keyof Detention, value: any) => void;
}) {
  const isMonday = detention.dayOfWeek === 'MAANDAG';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="form-label">
          Leerling *
        </label>
        <select
          required
          value={detention.student || ''}
          onChange={(e) => onChange('student', e.target.value)}
          className="select-field w-full"
        >
          <option value="">Selecteer leerling...</option>
          {students.map((student) => (
            <option key={student.id} value={student.name}>
              {student.name} - {student.grade}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">
          Leerkracht
        </label>
        <input
          type="text"
          value={detention.teacher || ''}
          onChange={(e) => onChange('teacher', e.target.value)}
          className="input-field"
          placeholder="Naam van leerkracht"
        />
      </div>

      <div>
        <label className="form-label">
          Reden
        </label>
        <input
          type="text"
          value={detention.reason || ''}
          onChange={(e) => onChange('reason', e.target.value)}
          className="input-field"
          placeholder="Bijv: Te veel chill outs"
        />
      </div>

      <div>
        <label className="form-label">
          Opdracht
        </label>
        <input
          type="text"
          value={detention.task || ''}
          onChange={(e) => onChange('task', e.target.value)}
          className="input-field"
          placeholder="Taak voor de leerling"
        />
      </div>

      <div>
        <label className="form-label">
          Datum LVS
        </label>
        <input
          type="date"
          value={detention.lvsDate || ''}
          onChange={(e) => onChange('lvsDate', e.target.value)}
          className="input-field date-field w-full"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 cursor-pointer transition-colors border border-slate-600">
          <input
            type="checkbox"
            checked={detention.shouldPrint || false}
            onChange={(e) => onChange('shouldPrint', e.target.checked)}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 rounded border-slate-500 bg-slate-700"
          />
          <span className="text-sm font-medium text-slate-300">Afdrukken?</span>
        </label>
        <label className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 cursor-pointer transition-colors border border-slate-600">
          <input
            type="checkbox"
            checked={detention.canUseChromebook || false}
            onChange={(e) => onChange('canUseChromebook', e.target.checked)}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 rounded border-slate-500 bg-slate-700"
          />
          <span className="text-sm font-medium text-slate-300">Mag chromebook gebruiken?</span>
        </label>
        <label className="flex items-center gap-3 p-4 bg-red-600/20 rounded-xl hover:bg-red-600/30 cursor-pointer transition-colors border border-red-500/50">
          <input
            type="checkbox"
            checked={detention.nablijvenGeweigerd || false}
            onChange={(e) => onChange('nablijvenGeweigerd', e.target.checked)}
            className="h-5 w-5 text-red-600 focus:ring-red-500 rounded border-slate-500 bg-slate-700"
          />
          <span className="text-sm font-medium text-red-200">Nablijven geweigerd?</span>
        </label>
        {isMonday && (
          <div className="flex items-center gap-3 p-4 bg-amber-600/20 rounded-xl hover:bg-amber-600/30 transition-colors border border-amber-500/50">
            <input
              type="checkbox"
              checked={!!detention.isDoublePeriod}
              onChange={(e) => {
                const isChecked = e.target.checked;
                onChange('isDoublePeriod', isChecked);
                if (!isChecked) {
                  onChange('timePeriod', undefined);
                }
              }}
              className="h-5 w-5 text-amber-600 focus:ring-amber-500 rounded border-slate-500 bg-slate-700 cursor-pointer"
            />
            <div className="flex-1">
              <span className="text-sm font-bold text-amber-200">Strafstudie (16:00-17:40)</span>
              <p className="text-xs text-amber-300/70 mt-0.5">Alleen beschikbaar op maandag</p>
            </div>
          </div>
        )}
      </div>


      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Extra Opmerking
        </label>
        <textarea
          value={detention.extraNotes || ''}
          onChange={(e) => onChange('extraNotes', e.target.value)}
          rows={3}
          className="input-field"
          placeholder="Aanvullende notities..."
        />
      </div>
    </div>
  );
}
