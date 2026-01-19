'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2, FileText, Edit, Plus, Save, X, Copy, History, GripVertical } from 'lucide-react';
import DuplicateSession from '@/app/components/DuplicateSession';
import DragDropDetentions from '@/app/components/DragDropDetentions';
import AuditHistory from '@/app/components/AuditHistory';
import FileAttachment from '@/app/components/FileAttachment';
import { Detention, Student, DayOfWeek } from '@/types';
import { format, parseISO } from 'date-fns';
import nl from 'date-fns/locale/nl';

const DAYS: DayOfWeek[] = ['MAANDAG', 'DINSDAG', 'DONDERDAG'];

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

  useEffect(() => {
    fetchDetentions();
  }, [date]);

  useEffect(() => {
    if (detentions.length > 0) {
      fetchStudents(detentions[0].dayOfWeek);
    }
  }, [detentions]);

  const fetchDetentions = async () => {
    try {
      const response = await fetch(`/api/detentions?date=${date}`);
      const data = await response.json();
      // Ordenar por número para asegurar que aparezcan en orden
      const sorted = data.sort((a: Detention, b: Detention) => a.number - b.number);
      setDetentions(sorted);
    } catch (error) {
      console.error('Error fetching detentions:', error);
    }
  };

  const fetchStudents = async (day: DayOfWeek) => {
    try {
      const response = await fetch(`/api/students?day=${day}`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit nablijven wilt verwijderen?')) return;
    
    try {
      await fetch(`/api/detentions?id=${id}`, { method: 'DELETE' });
      fetchDetentions();
    } catch (error) {
      console.error('Error deleting detention:', error);
    }
  };

  const handleReorder = async (reorderedDetentions: Detention[]) => {
    try {
      // Update all detentions with new numbers
      for (const detention of reorderedDetentions) {
        await fetch('/api/detentions', {
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
      await fetch('/api/detentions', {
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
    const dayOfWeek = detentions.length > 0 ? detentions[0].dayOfWeek : 'MAANDAG';
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
    });
    setShowAddForm(true);
    if (detentions.length > 0) {
      fetchStudents(detentions[0].dayOfWeek);
    }
  };

  const handleSaveNew = async () => {
    if (!newDetention) return;

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
    };

    try {
      await fetch('/api/detentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detentionToSave),
      });
      setShowAddForm(false);
      setNewDetention(null);
      fetchDetentions();
    } catch (error) {
      console.error('Error saving new detention:', error);
    }
  };

  const currentDayOfWeek = detentions.length > 0 ? detentions[0].dayOfWeek : 'MAANDAG';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
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
            <div className="flex items-center gap-3">
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
                Nablijven (van 16u tot 16u50)
              </h2>
              <p className="section-subtitle">
                {detentions.length} nablijven geregistreerd
              </p>
            </div>
          </div>
        </div>

        {/* Add New Form */}
        {showAddForm && newDetention && (
          <div className="card p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-100">Nieuwe Nablijven Toevoegen</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewDetention(null);
                }}
                className="btn-ghost p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DetentionForm
              detention={newDetention}
              students={students}
              onChange={(field, value) => setNewDetention({ ...newDetention, [field]: value })}
            />
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800/50 print:bg-slate-800">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider w-16 print:hidden">
                      <GripVertical className="h-4 w-4 text-slate-500" />
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider w-16">
                      #
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Leerling
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Leerkracht
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Reden
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Opdracht
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Datum LVS
                    </th>
                    <th className="px-2 py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-20">
                      Afdrukken
                    </th>
                    <th className="px-2 py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-20">
                      Chromebook
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Opmerkingen
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider print:hidden w-24">
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
                        className={`hover:bg-slate-700/30 transition-colors ${isDragging ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap print:hidden cursor-move">
                          <GripVertical className="h-5 w-5 text-slate-500 hover:text-indigo-400" />
                        </td>
                        {editingId === detention.id && editingDetention ? (
                          <EditRow
                            detention={editingDetention}
                            students={students}
                            onSave={handleSaveEdit}
                            onCancel={handleCancelEdit}
                            onChange={(field, value) => setEditingDetention({ ...editingDetention, [field]: value })}
                          />
                        ) : (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
                              {detention.number}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold text-slate-100">
                              {detention.student}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">
                              {detention.teacher || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-slate-400">
                              {detention.reason || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-slate-400">
                              {detention.task || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">
                              {detention.lvsDate ? format(parseISO(detention.lvsDate), 'dd/MM/yyyy') : '-'}
                            </div>
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap text-center">
                            {detention.shouldPrint ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap text-center">
                            {detention.canUseChromebook ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-slate-400 max-w-xs">
                              {detention.extraNotes || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right print:hidden">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedRecordId(detention.id);
                                  setShowAuditHistory(true);
                                }}
                                className="text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-500/20 rounded-lg transition-all"
                                title="Geschiedenis"
                              >
                                <History className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleEdit(detention)}
                                className="text-indigo-400 hover:text-indigo-300 p-2 hover:bg-indigo-500/20 rounded-lg transition-all"
                                title="Bewerken"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(detention.id)}
                                className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-all"
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
}: {
  detention: Partial<Detention>;
  students: Student[];
  onSave: () => void;
  onCancel: () => void;
  onChange: (field: keyof Detention, value: any) => void;
}) {
  return (
    <>
      <td className="px-4 py-4 whitespace-nowrap print:hidden"></td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          {detention.number}
        </div>
      </td>
      <td className="px-4 py-4">
        <select
          value={detention.student || ''}
          onChange={(e) => onChange('student', e.target.value)}
          className="input-field text-sm py-2"
        >
          <option value="">Selecteer...</option>
          {students.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name} - {s.grade}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-4">
        <input
          type="text"
          value={detention.teacher || ''}
          onChange={(e) => onChange('teacher', e.target.value)}
          className="input-field text-sm py-2"
        />
      </td>
      <td className="px-4 py-4">
        <input
          type="text"
          value={detention.reason || ''}
          onChange={(e) => onChange('reason', e.target.value)}
          className="input-field text-sm py-2"
        />
      </td>
      <td className="px-4 py-4">
        <input
          type="text"
          value={detention.task || ''}
          onChange={(e) => onChange('task', e.target.value)}
          className="input-field text-sm py-2"
        />
      </td>
      <td className="px-4 py-4">
        <input
          type="date"
          value={detention.lvsDate || ''}
          onChange={(e) => onChange('lvsDate', e.target.value)}
          className="input-field text-sm py-2"
        />
      </td>
      <td className="px-2 py-4 text-center">
        <input
          type="checkbox"
          checked={detention.shouldPrint || false}
          onChange={(e) => onChange('shouldPrint', e.target.checked)}
          className="h-5 w-5 text-indigo-600 rounded border-slate-500 bg-slate-700"
        />
      </td>
      <td className="px-2 py-4 text-center">
        <input
          type="checkbox"
          checked={detention.canUseChromebook || false}
          onChange={(e) => onChange('canUseChromebook', e.target.checked)}
          className="h-5 w-5 text-indigo-600 rounded border-slate-500 bg-slate-700"
        />
      </td>
      <td className="px-4 py-4">
        <textarea
          value={detention.extraNotes || ''}
          onChange={(e) => onChange('extraNotes', e.target.value)}
          rows={2}
          className="input-field text-sm py-2"
          placeholder="Opmerkingen..."
        />
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={onSave}
            className="text-emerald-400 hover:text-emerald-300 p-2 hover:bg-emerald-500/20 rounded-lg transition-all"
            title="Opslaan"
          >
            <Save className="h-5 w-5" />
          </button>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-300 p-2 hover:bg-slate-700 rounded-lg transition-all"
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Leerling *
        </label>
        <select
          required
          value={detention.student || ''}
          onChange={(e) => onChange('student', e.target.value)}
          className="input-field"
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
        <label className="block text-sm font-semibold text-slate-300 mb-2">
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
        <label className="block text-sm font-semibold text-slate-300 mb-2">
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
        <label className="block text-sm font-semibold text-slate-300 mb-2">
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
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Datum LVS
        </label>
        <input
          type="date"
          value={detention.lvsDate || ''}
          onChange={(e) => onChange('lvsDate', e.target.value)}
          className="input-field"
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
