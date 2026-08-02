'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, Detention, DayOfWeek, StaffMember } from '@/types';
import {
  buildStudentGrade,
  buildStudentName,
  cellExact,
  parseDayOfWeek,
} from '@/lib/studentImport';
import { buildStaffName } from '@/lib/staffImport';

interface MassImportProps {
  onImportStudents?: (students: Student[]) => void;
  onImportDetentions?: (detentions: Detention[]) => void;
  onImportStaff?: (staff: StaffMember[]) => void;
  type: 'students' | 'detentions' | 'staff';
  /** Dag als Excel geen Dag-kolom heeft */
  defaultDay?: DayOfWeek;
}

export default function MassImport({
  onImportStudents,
  onImportDetentions,
  onImportStaff,
  type,
  defaultDay = 'MAANDAG',
}: MassImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingStudents, setPendingStudents] = useState<Student[] | null>(null);
  const [pendingDetentions, setPendingDetentions] = useState<Partial<Detention>[] | null>(null);
  const [pendingStaff, setPendingStaff] = useState<StaffMember[] | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setPendingStudents(null);
    setPendingDetentions(null);
    setPendingStaff(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: '',
        raw: false,
      });

      if (type === 'staff') {
        const stamp = Date.now();
        const seen = new Set<string>();
        const staff: StaffMember[] = [];
        jsonData.forEach((row, index) => {
          const name = buildStaffName(row);
          if (!name) return;
          const key = name.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          staff.push({
            id: `staff-${stamp}-${index}`,
            name,
            sortOrder: staff.length,
          });
        });
        if (!staff.length) {
          throw new Error(
            'Geen geldige namen gevonden. Verwacht kolommen Voornaam + Naam (of Achternaam).'
          );
        }
        setPendingStaff(staff);
      } else if (type === 'students') {
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

        setPendingStudents(students);
      } else {
        const detentions: Partial<Detention>[] = jsonData
          .map((row, index) => ({
            id: `detention-${Date.now()}-${index}`,
            number: Number(cellExact(row, ['Nummer', 'Number']) || index + 1),
            date: cellExact(row, ['Datum', 'Date']),
            dayOfWeek: parseDayOfWeek(cellExact(row, ['Dag', 'Day']), defaultDay),
            student: buildStudentName(row) || cellExact(row, ['Leerling', 'Student', 'Naam']),
            teacher: cellExact(row, ['Personeel', 'Leerkracht', 'Teacher']),
            reason: cellExact(row, ['Reden', 'Reason']),
            task: cellExact(row, ['Opdracht', 'Task']),
            lvsDate: cellExact(row, ['LVS Datum', 'LVS Date', 'lvs_date']),
            shouldPrint: /^(ja|true|1|yes)$/i.test(cellExact(row, ['Print'])),
            canUseChromebook: /^(ja|true|1|yes)$/i.test(cellExact(row, ['Chromebook'])),
            extraNotes: cellExact(row, ['Opmerkingen', 'Notes']),
          }))
          .filter((d) => d.student && d.date);

        if (!detentions.length) {
          throw new Error('Geen geldige nablijven gevonden.');
        }
        setPendingDetentions(detentions);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fout bij lezen van bestand');
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const clearPending = () => {
    setPendingStudents(null);
    setPendingDetentions(null);
    setPendingStaff(null);
    setError(null);
  };

  const confirmStaff = async () => {
    if (!pendingStaff?.length) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
        if (onImportStaff) {
          await onImportStaff(pendingStaff);
          setSuccess(`${pendingStaff.length} personeelsleden geïmporteerd`);
          setPendingStaff(null);
      } else {
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff: pendingStaff }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.details || result.error || 'Import mislukt');
        if (result.failed && !result.saved) {
          throw new Error(
            result.firstError || result.details || 'Geen personeelsleden opgeslagen'
          );
        }
        setSuccess(`${result.saved ?? pendingStaff.length} personeelsleden geïmporteerd`);
        setPendingStaff(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import mislukt');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmStudents = async () => {
    if (!pendingStudents?.length) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: pendingStudents }),
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
        `${result.saved ?? pendingStudents.length} leerlingen geïmporteerd in Excel-volgorde` +
          (result.failed ? ` (${result.failed} mislukt)` : '')
      );
      onImportStudents?.(pendingStudents);
      setPendingStudents(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import mislukt');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDetentions = async () => {
    if (!pendingDetentions?.length || !onImportDetentions) return;
    setIsSaving(true);
    setError(null);
    try {
      for (const detention of pendingDetentions) {
        await fetch('/api/detentions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(detention),
        });
      }
      setSuccess(`${pendingDetentions.length} nablijven geïmporteerd`);
      onImportDetentions(pendingDetentions as Detention[]);
      setPendingDetentions(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import mislukt');
    } finally {
      setIsSaving(false);
    }
  };

  const previewStudents = pendingStudents || [];
  const previewDetentions = pendingDetentions || [];
  const previewStaff = pendingStaff || [];

  const typeLabel =
    type === 'students' ? 'leerlingen' : type === 'staff' ? 'personeel' : 'nablijven';

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Upload className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">
            Excel import {typeLabel}
          </h3>
          <p className="text-sm text-slate-400">
            Eerst preview, daarna bevestigen — volgorde blijft behouden
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
              disabled={isProcessing || isSaving}
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

      {previewStudents.length > 0 && type === 'students' && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-slate-300">
              Preview — {previewStudents.length} leerlingen
            </h4>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary text-sm" onClick={clearPending}>
                Annuleren
              </button>
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={isSaving}
                onClick={confirmStudents}
              >
                {isSaving ? 'Opslaan…' : `Bevestigen (${previewStudents.length})`}
              </button>
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 max-h-56 overflow-y-auto space-y-1">
            {previewStudents.map((s, idx) => (
              <div key={s.id || idx} className="text-xs text-slate-300 flex gap-3">
                <span className="text-slate-500 w-6">{(s.sortOrder ?? idx) + 1}.</span>
                <span className="flex-1">{s.name}</span>
                <span className="text-slate-400">{s.grade}</span>
                <span className="text-slate-500">{s.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewStaff.length > 0 && type === 'staff' && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-slate-300">
              Preview — {previewStaff.length} personeelsleden
            </h4>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary text-sm" onClick={clearPending}>
                Annuleren
              </button>
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={isSaving}
                onClick={confirmStaff}
              >
                {isSaving ? 'Opslaan…' : `Bevestigen (${previewStaff.length})`}
              </button>
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 max-h-56 overflow-y-auto space-y-1">
            {previewStaff.map((s, idx) => (
              <div key={s.id || idx} className="text-xs text-slate-300 flex gap-3">
                <span className="text-slate-500 w-6">{idx + 1}.</span>
                <span className="flex-1">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewDetentions.length > 0 && type === 'detentions' && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-slate-300">
              Preview — {previewDetentions.length} nablijven
            </h4>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary text-sm" onClick={clearPending}>
                Annuleren
              </button>
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={isSaving}
                onClick={confirmDetentions}
              >
                {isSaving ? 'Opslaan…' : `Bevestigen (${previewDetentions.length})`}
              </button>
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
            {previewDetentions.slice(0, 20).map((d, idx) => (
              <div key={idx} className="text-xs text-slate-300 flex gap-3">
                <span className="text-slate-500 w-6">{idx + 1}.</span>
                <span className="flex-1">{d.student}</span>
                <span className="text-slate-400">{d.date}</span>
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
            : type === 'staff'
              ? ' Kolommen: Voornaam + Naam (of Achternaam). Resultaat: Voornaam Achternaam.'
              : ' Kolommen: Datum, Leerling, …'}
        </p>
      </div>
    </div>
  );
}
