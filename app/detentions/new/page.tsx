'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { Student, Detention, DayOfWeek } from '@/types';
import { format } from 'date-fns';

const DAYS: DayOfWeek[] = ['MAANDAG', 'DINSDAG', 'DONDERDAG'];

export default function NewDetentionPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MAANDAG');
  const [date, setDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('date') || format(new Date(), 'yyyy-MM-dd');
    }
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [detentions, setDetentions] = useState<Partial<Detention>[]>([]);

  useEffect(() => {
    fetchStudents();
  }, [selectedDay]);

  useEffect(() => {
    if (detentions.length === 0) {
      setDetentions([createEmptyDetention()]);
    }
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?day=${selectedDay}`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const createEmptyDetention = (): Partial<Detention> => ({
    number: detentions.length + 1,
    student: '',
    teacher: '',
    reason: '',
    task: '',
    lvsDate: '',
    shouldPrint: false,
    canUseChromebook: false,
    extraNotes: '',
  });

  const addDetention = () => {
    setDetentions([...detentions, createEmptyDetention()]);
  };

  const removeDetention = (index: number) => {
    if (detentions.length > 1) {
      setDetentions(detentions.filter((_, i) => i !== index));
    }
  };

  const updateDetention = (index: number, field: keyof Detention, value: any) => {
    const updated = [...detentions];
    updated[index] = { ...updated[index], [field]: value };
    setDetentions(updated);
  };

  const getStudentDisplayName = (studentName: string): string => {
    const student = students.find(s => s.name === studentName);
    if (student) {
      return `${student.name} - ${student.grade}`;
    }
    return studentName;
  };

  const handleSave = async () => {
    const detentionsToSave: Detention[] = detentions
      .filter(d => d.student && d.student.trim() !== '')
      .map((d, index) => ({
        id: `detention-${Date.now()}-${index}`,
        number: d.number || index + 1,
        date,
        dayOfWeek: selectedDay,
        student: getStudentDisplayName(d.student || ''),
        teacher: d.teacher || '',
        reason: d.reason || '',
        task: d.task || '',
        lvsDate: d.lvsDate || '',
        shouldPrint: d.shouldPrint || false,
        canUseChromebook: d.canUseChromebook || false,
        extraNotes: d.extraNotes || '',
      }));

    if (detentionsToSave.length === 0) {
      alert('Voeg ten minste één leerling toe voordat je opslaat.');
      return;
    }

    try {
      for (const detention of detentionsToSave) {
        await fetch('/api/detentions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(detention),
        });
      }
      router.push(`/detentions/${date}`);
    } catch (error) {
      console.error('Error saving detentions:', error);
      alert('Fout bij het opslaan van de nablijven.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="btn-ghost p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Nieuw Nablijven</h1>
                <p className="text-slate-400 text-sm mt-1">Registreer een nieuwe nablijven sessie</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Session Info */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Datum
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Dag van de Week
              </label>
              <select
                value={selectedDay}
                onChange={(e) => {
                  setSelectedDay(e.target.value as DayOfWeek);
                  fetchStudents();
                }}
                className="input-field"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSave}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                Sessie Opslaan
              </button>
            </div>
          </div>
        </div>

        {/* Detentions */}
        <div className="space-y-6">
          {detentions.map((detention, index) => (
            <div key={index} className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">
                    Nablijven #{index + 1}
                  </h3>
                </div>
                {detentions.length > 1 && (
                  <button
                    onClick={() => removeDetention(index)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-xl transition-all"
                    title="Verwijderen"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Leerling *
                  </label>
                  <select
                    required
                    value={detention.student || ''}
                    onChange={(e) => updateDetention(index, 'student', e.target.value)}
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
                    onChange={(e) => updateDetention(index, 'teacher', e.target.value)}
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
                    onChange={(e) => updateDetention(index, 'reason', e.target.value)}
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
                    onChange={(e) => updateDetention(index, 'task', e.target.value)}
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
                    onChange={(e) => updateDetention(index, 'lvsDate', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 cursor-pointer transition-colors border border-slate-600">
                    <input
                      type="checkbox"
                      checked={detention.shouldPrint || false}
                      onChange={(e) => updateDetention(index, 'shouldPrint', e.target.checked)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 rounded border-slate-500 bg-slate-700"
                    />
                    <span className="text-sm font-medium text-slate-300">Afdrukken?</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 cursor-pointer transition-colors border border-slate-600">
                    <input
                      type="checkbox"
                      checked={detention.canUseChromebook || false}
                      onChange={(e) => updateDetention(index, 'canUseChromebook', e.target.checked)}
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
                    onChange={(e) => updateDetention(index, 'extraNotes', e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Aanvullende notities..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={addDetention}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nog een Nablijven Toevoegen
          </button>
        </div>
      </main>
    </div>
  );
}
