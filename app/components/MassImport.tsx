'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, Detention, DayOfWeek } from '@/types';
import {
  buildStudentGrade,
  buildStudentName,
  cellExact,
  parseDayOfWeek,
} from '@/lib/studentImport';

interface MassImportProps {
  onImportStudents?: (students: Student[]) => void;
  onImportDetentions?: (detentions: Detention[]) => void;
  type: 'students' | 'detentions';
  /** Dag als Excel geen Dag-kolom heeft */
  defaultDay?: DayOfWeek;
}

export default function MassImport({
  onImportStudents,
  onImportDetentions,
  type,
  defaultDay = 'MAANDAG',
}: MassImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<Student[] | Partial<Detention>[]>([]);

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

      if (type === 'students') {
        const stamp = Date.now();
        const students: Student[] = jsonData
          .map((row, index) => {
            const name = buildStudentName(row);
            const grade = buildStudentGrade(row);
            const dayRaw = cellExact(row, ['Dag', 'Day', 'Nablijfdag']);
            return {
              id: `student-${stamp}-${index}`,
              name,
              grade,
              day: parseDayOfWeek(dayRaw, defaultDay),
              sortOrder: index,
            } satisfies Student;
          })
          .filter((s) => s.name);

        if (!students.length) {
          throw new Error(
            'Geen geldige leerlingen gevonden. Verwacht kolommen Naam/Klas of Voornaam+Achternaam (Smartschool: Voornaam+Naam).'
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
          `${result.saved ?? students.length} leerlingen geïmporteerd in Excel-volgorde` +
            (result.failed ? ` (${result.failed} mislukt)` : '')
        );
        onImportStudents?.(students);
      } else {
        const detentions: Partial<Detention>[] = jsonData
          .map((row, index) => ({
            id: `detention-${Date.now()}-${index}`,
            number: Number(cellExact(row, ['Nummer', 'Number']) || index + 1),
            date: cellExact(row, ['Datum', 'Date']),
            dayOfWeek: parseDayOfWeek(cellExact(row, ['Dag', 'Day']), defaultDay),
            student: buildStudentName(row) || cellExact(row, ['Leerling', 'Student', 'Naam']),
            teacher: cellExact(row, ['Leerkracht', 'Teacher']),
            reason: cellExact(row, ['Reden', 'Reason']),
            task: cellExact(row, ['Opdracht', 'Task']),
            lvsDate: cellExact(row, ['LVS Datum', 'LVS Date', 'lvs_date']),
            shouldPrint: /^(ja|true|1|yes)$/i.test(cellExact(row, ['Print'])),
            canUseChromebook: /^(ja|true|1|yes)$/i.test(cellExact(row, ['Chromebook'])),
            extraNotes: cellExact(row, ['Opmerkingen', 'Notes']),
          }))
          .filter((d) => d.student && d.date);

        setPreview(detentions.slice(0, 5) as Partial<Detention>[]);
        if (onImportDetentions) {
          for (const detention of detentions) {
            await fetch('/api/detentions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(detention),
            });
          }
          setSuccess(`${detentions.length} nablijven geïmporteerd`);
          onImportDetentions(detentions as Detention[]);
        }
      }
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
          <Upload className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">
            Excel import {type === 'students' ? 'leerlingen' : 'nablijven'}
          </h3>
          <p className="text-sm text-slate-400">
            Volgorde en klas-organisatie uit het bestand blijven behouden
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Upload Excel/CSV
        </label>
        <div className="flex items-center gap-3">
          <label className="btn-primary cursor-pointer flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bestand selecteren
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </label>
          {isProcessing && <span className="text-slate-400 text-sm">Verwerken…</span>}
        </div>
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

      {preview.length > 0 && type === 'students' && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Preview (eerste rijen):</h4>
          <div className="bg-slate-700/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
            {(preview as Student[]).map((s, idx) => (
              <div key={idx} className="text-xs text-slate-300 flex gap-3">
                <span className="text-slate-500 w-6">{(s.sortOrder ?? idx) + 1}.</span>
                <span className="flex-1">{s.name}</span>
                <span className="text-slate-400">{s.grade}</span>
                <span className="text-slate-500">{s.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
        <p className="text-xs text-slate-400">
          <strong>Formaat:</strong> .xlsx / .xls / .csv — rijen in de volgorde van het bestand.
          {type === 'students'
            ? ' Kolommen: Voornaam+Naam/Achternaam (of volledige Naam), Klas, optioneel Dag.'
            : ' Kolommen: Datum, Leerling, …'}
        </p>
      </div>
    </div>
  );
}
