'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit, ArrowLeft, Users, Check, Upload, X } from 'lucide-react';
import { Student, DayOfWeek } from '@/types';
import { apiFetch, OfflineQueuedError } from '@/lib/apiClient';
import AdvancedSearch, { SearchFilters } from '@/app/components/AdvancedSearch';
import EnhancedTable from '@/app/components/EnhancedTable';
import MassImport from '@/app/components/MassImport';
import SmartschoolImport from '@/app/components/SmartschoolImport';
import FileAttachment from '@/app/components/FileAttachment';
import { parseBulkStudentLines } from '@/lib/studentImport';

const DAYS: DayOfWeek[] = ['MAANDAG', 'DINSDAG', 'DONDERDAG'];

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MAANDAG');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ name: '', grade: '' });
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ text: '' });
  const [showImport, setShowImport] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<Student[] | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [selectedDay]);

  const fetchStudents = async () => {
    try {
      const response = await apiFetch(`/api/students?day=${selectedDay}`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const getFilteredStudents = () => {
    let filtered = students;

    if (searchFilters.text) {
      const term = searchFilters.text.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.grade?.toLowerCase().includes(term)
      );
    }

    if (searchFilters.student) {
      const term = searchFilters.student.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(term));
    }

    return filtered;
  };

  const filteredStudents = getFilteredStudents().sort((a, b) => {
    const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    const gradeCmp = (a.grade || '').localeCompare(b.grade || '', 'nl');
    if (gradeCmp !== 0) return gradeCmp;
    return a.name.localeCompare(b.name, 'nl');
  });

  const handleImportStudents = async () => {
    await fetchStudents();
    setShowImport(false);
  };

  const handleBulkPreview = () => {
    const rows = parseBulkStudentLines(bulkText);
    if (!rows.length) {
      alert('Plak minstens één regel: Achternaam;Voornaam;Klas');
      setBulkPreview(null);
      return;
    }
    const base = students.reduce((max, s) => Math.max(max, s.sortOrder ?? -1), -1) + 1;
    const stamp = Date.now();
    setBulkPreview(
      rows.map((r, index) => ({
        id: `student-${stamp}-${index}`,
        name: r.name,
        grade: r.grade,
        day: selectedDay,
        sortOrder: base + index,
      }))
    );
  };

  const handleBulkSave = async () => {
    const payload = bulkPreview;
    if (!payload?.length) {
      handleBulkPreview();
      return;
    }

    setBulkSaving(true);
    try {
      const res = await apiFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Bulk opslaan mislukt');
      }
      setBulkText('');
      setBulkPreview(null);
      setShowBulk(false);
      await fetchStudents();
      alert(`${data.saved ?? payload.length} leerlingen toegevoegd`);
    } catch (error) {
      if (error instanceof OfflineQueuedError) {
        alert(error.message);
        return;
      }
      alert(error instanceof Error ? error.message : 'Bulk opslaan mislukt');
    } finally {
      setBulkSaving(false);
    }
  };

  const doSaveStudent = async () => {
    const nextOrder =
      editingStudent?.sortOrder ??
      students.reduce((max, s) => Math.max(max, s.sortOrder ?? -1), -1) + 1;
    const student: Student = {
      id: editingStudent?.id || `student-${Date.now()}`,
      name: formData.name,
      grade: formData.grade,
      day: selectedDay,
      sortOrder: nextOrder,
    };

    try {
      const res = await apiFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { details?: string; error?: string }).details ||
            (data as { error?: string }).error ||
            'Opslaan mislukt'
        );
      }
      setFormData({ name: '', grade: '' });
      setShowForm(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      if (error instanceof OfflineQueuedError) {
        alert(error.message);
        setFormData({ name: '', grade: '' });
        setShowForm(false);
        setEditingStudent(null);
        return;
      }
      console.error('Error saving student:', error);
      alert(error instanceof Error ? error.message : 'Opslaan mislukt');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSaveStudent();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze leerling wilt verwijderen?')) return;
    
    try {
      await apiFetch(`/api/students?id=${id}`, { method: 'DELETE' });
      fetchStudents();
    } catch (error) {
      if (error instanceof OfflineQueuedError) {
        alert(error.message);
        return;
      }
      console.error('Error deleting student:', error);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ name: student.name, grade: student.grade });
  };

  return (
    <div className="app-page">
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
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">Leerlingen Beheer</h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 hidden sm:block">Beheer lijsten van leerlingen per dag</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Import / Bulk */}
        <div className="mb-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Namen herstellen? (Achternaam;Voornaam → Voornaam Achternaam)')) return;
              try {
                const res = await apiFetch('/api/students', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ repairNames: true }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.details || data.error || 'Herstel mislukt');
                await fetchStudents();
                alert(`${data.repaired ?? 0} namen hersteld`);
              } catch (e) {
                alert(e instanceof Error ? e.message : 'Herstel mislukt');
              }
            }}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            Herstel namen
          </button>
          <button
            type="button"
            onClick={() => {
              setShowBulk(!showBulk);
              if (!showBulk) setShowImport(false);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {showBulk ? 'Verberg bulk' : 'Bulk toevoegen'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowImport(!showImport);
              if (!showImport) setShowBulk(false);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="h-5 w-5" />
            {showImport ? 'Verberg import' : 'Excel / Smartschool'}
          </button>
        </div>

        {showBulk && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Bulk toevoegen — {selectedDay}</h3>
            <p className="text-sm text-slate-400 mb-4">
              Eén leerling per regel. Aanbevolen:{' '}
              <code className="text-slate-300">Achternaam;Voornaam;Klas</code> of{' '}
              <code className="text-slate-300">Voornaam Achternaam;Klas</code>.
              Volgorde blijft behouden.
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => {
                setBulkText(e.target.value);
                setBulkPreview(null);
              }}
              rows={10}
              className="input-field font-mono text-sm"
              placeholder={'Degrendele;Leandro;1 Aarde\nGeers;Lewis;1 Aarde\nLisa Janssens;2 Vuur'}
            />
            {bulkPreview && bulkPreview.length > 0 && (
              <div className="mt-4 bg-slate-700/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                <p className="text-xs text-slate-400 mb-2">
                  Preview — {bulkPreview.length} leerlingen
                </p>
                {bulkPreview.map((s, idx) => (
                  <div key={s.id} className="text-xs text-slate-300 flex gap-3">
                    <span className="text-slate-500 w-6">{idx + 1}.</span>
                    <span className="flex-1">{s.name}</span>
                    <span className="text-slate-400">{s.grade}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={handleBulkPreview} className="btn-secondary">
                Preview tonen
              </button>
              <button
                type="button"
                onClick={handleBulkSave}
                disabled={bulkSaving || !bulkPreview?.length}
                className="btn-primary"
              >
                {bulkSaving ? 'Opslaan…' : 'Bevestigen & opslaan'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowBulk(false);
                  setBulkPreview(null);
                }}
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {showImport && (
          <div className="mb-6 space-y-4">
            <SmartschoolImport
              defaultDay={selectedDay}
              onImport={handleImportStudents}
            />
            <MassImport
              type="students"
              defaultDay={selectedDay}
              onImportStudents={handleImportStudents}
            />
          </div>
        )}
        {/* Advanced Search */}
        <AdvancedSearch
          onSearch={setSearchFilters}
          placeholder="Zoek leerlingen..."
        />

        {/* Day Selector */}
        <div className="mb-8 flex gap-3">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(day);
                setShowForm(false);
                setEditingStudent(null);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                selectedDay === day
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 shadow-sm border border-slate-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Add New Form (edit is inline in the table) */}
        {showForm && !editingStudent && (
          <div className="card p-8 mb-8">
            <h2 className="section-title mb-6">
              Nieuwe Leerling
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Naam
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Voornaam Achternaam"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Klas
                </label>
                <input
                  type="text"
                  required
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="input-field"
                  placeholder="Bijv: 1 aarde, 2 vuur Move"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {editingStudent ? 'Bijwerken' : 'Opslaan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingStudent(null);
                    setFormData({ name: '', grade: '' });
                  }}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Students List */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">
                Leerlingen - {selectedDay}
              </h2>
              <p className="section-subtitle">
                {filteredStudents.length} van {students.length} leerling{students.length !== 1 ? 'en' : ''}
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nieuwe Leerling
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-2xl mb-5 border border-slate-700">
                <Users className="h-10 w-10 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">Geen leerlingen geregistreerd voor {selectedDay}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-simple">
                <thead>
                  <tr>
                    <th>Naam</th>
                    <th>Klas</th>
                    <th className="text-right">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className={editingStudent?.id === student.id ? 'bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/30' : ''}>
                      {editingStudent?.id === student.id ? (
                        <>
                          <td className="whitespace-nowrap">
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="input-field-table"
                              placeholder="Naam"
                            />
                          </td>
                          <td className="whitespace-nowrap">
                            <input
                              type="text"
                              value={formData.grade}
                              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                              className="input-field-table"
                              placeholder="Klas"
                            />
                          </td>
                          <td className="whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => doSaveStudent()}
                                className="text-emerald-400 hover:text-emerald-300 p-2 hover:bg-emerald-500/20 rounded-lg transition-all"
                                title="Opslaan"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStudent(null);
                                  setFormData({ name: '', grade: '' });
                                }}
                                className="text-slate-400 hover:text-slate-300 p-2 hover:bg-slate-500/20 rounded-lg transition-all"
                                title="Annuleren"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-slate-100">
                              {student.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">
                              {student.grade}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(student)}
                                className="text-indigo-400 hover:text-indigo-300 p-2 hover:bg-indigo-500/20 rounded-lg transition-all"
                                title="Bewerken"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
