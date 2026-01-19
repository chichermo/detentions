'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit, ArrowLeft, Users, Check, Upload } from 'lucide-react';
import { Student, DayOfWeek } from '@/types';
import AdvancedSearch, { SearchFilters } from '@/app/components/AdvancedSearch';
import EnhancedTable from '@/app/components/EnhancedTable';
import MassImport from '@/app/components/MassImport';
import SmartschoolImport from '@/app/components/SmartschoolImport';
import FileAttachment from '@/app/components/FileAttachment';

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

  useEffect(() => {
    fetchStudents();
  }, [selectedDay]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?day=${selectedDay}`);
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

  const filteredStudents = getFilteredStudents();

  const handleImportStudents = async (importedStudents: Student[]) => {
    // Los estudiantes ya se importaron en el componente MassImport
    await fetchStudents();
    setShowImport(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const student: Student = {
      id: editingStudent?.id || `student-${Date.now()}`,
      name: formData.name,
      grade: formData.grade,
      day: selectedDay,
    };

    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
      setFormData({ name: '', grade: '' });
      setShowForm(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze leerling wilt verwijderen?')) return;
    
    try {
      await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ name: student.name, grade: student.grade });
    setShowForm(true);
  };

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
        {/* Import Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowImport(!showImport)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="h-5 w-5" />
            {showImport ? 'Verberg Import' : 'Massa Import'}
          </button>
        </div>

        {showImport && (
          <div className="mb-6 space-y-4">
            <SmartschoolImport
              onImport={handleImportStudents}
            />
            <MassImport
              type="students"
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

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card p-8 mb-8">
            <h2 className="section-title mb-6">
              {editingStudent ? 'Leerling Bewerken' : 'Nieuwe Leerling'}
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
                  Graad/Klas
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
                {students.length} leerling{students.length !== 1 ? 'en' : ''} geregistreerd
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
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Naam
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Graad/Klas
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/30 divide-y divide-slate-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-700/30 transition-colors">
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
