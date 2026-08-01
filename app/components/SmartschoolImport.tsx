'use client';

import { useState } from 'react';
import { FileSpreadsheet, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, DayOfWeek } from '@/types';
import {
  buildStudentGrade,
  buildStudentName,
  cellExact,
  parseDayOfWeek,
} from '@/lib/studentImport';

interface SmartschoolImportProps {
  onImport: (students: Student[]) => void;
  defaultDay?: DayOfWeek;
}

export default function SmartschoolImport({ onImport, defaultDay = 'MAANDAG' }: SmartschoolImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<Student[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setPreview([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: '',
        raw: false,
      });

      const stamp = Date.now();
      const students: Student[] = jsonData
        .map((row, index) => {
          const name = buildStudentName(row);
          const grade = buildStudentGrade(row);
          const day = parseDayOfWeek(cellExact(row, ['Dag', 'Day']), defaultDay);
          return {
            id: `student-${stamp}-${index}`,
            name,
            grade,
            day,
            sortOrder: index,
          };
        })
        .filter((s) => s.name);

      if (students.length === 0) {
        throw new Error(
          'Geen geldige leerlingen gevonden. Smartschool: kolommen Voornaam + Naam (en Klas).'
        );
      }

      setPreview(students.slice(0, 8));

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.details || result.error || 'Import mislukt');
      }
      if (result.failed && !result.saved) {
        throw new Error(
          result.firstError ||
            `${result.failed} leerlingen mislukt (controleer database / kolom day)`
        );
      }

      setSuccess(
        `${result.saved ?? students.length} leerlingen geïmporteerd (Smartschool-volgorde)` +
          (result.failed ? ` (${result.failed} mislukt)` : '')
      );
      onImport(students);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fout bij importeren van bestand');
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <ExternalLink className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Smartschool import</h3>
          <p className="text-sm text-slate-400">Excel/CSV uit Smartschool — volgorde blijft behouden</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bestand selecteren
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />
        </label>
        {isProcessing && <span className="ml-3 text-slate-400 text-sm">Verwerken…</span>}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 mb-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 mb-4">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Preview:</h4>
          <div className="bg-slate-700/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
            {preview.map((student, idx) => (
              <div key={idx} className="text-xs text-slate-300 flex gap-3">
                <span className="text-slate-500 w-6">{idx + 1}.</span>
                <span className="flex-1">{student.name}</span>
                <span className="text-slate-400">{student.grade}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
        <p className="text-xs text-slate-400">
          Kolommen: Voornaam + Naam (achternaam), Klas/Groep, optioneel Dag. Namen worden met spatie samengevoegd.
        </p>
      </div>
    </div>
  );
}
