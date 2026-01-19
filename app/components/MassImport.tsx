'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, Detention } from '@/types';

interface MassImportProps {
  onImportStudents?: (students: Student[]) => void;
  onImportDetentions?: (detentions: Detention[]) => void;
  type: 'students' | 'detentions';
}

export default function MassImport({ onImportStudents, onImportDetentions, type }: MassImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

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
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (type === 'students') {
        const students: Student[] = jsonData.map((row: any, index) => ({
          id: `student-${Date.now()}-${index}`,
          name: row['Naam'] || row['Name'] || row['naam'] || row['name'] || '',
          grade: row['Klas'] || row['Grade'] || row['klas'] || row['grade'] || '',
          day: (row['Dag'] || row['Day'] || row['dag'] || row['day'] || 'MAANDAG').toUpperCase() as any,
        })).filter(s => s.name);

        setPreview(students.slice(0, 5));
        if (onImportStudents) {
          // Importar todos los estudiantes
          for (const student of students) {
            await fetch('/api/students', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(student),
            });
          }
          setSuccess(`${students.length} leerlingen geïmporteerd`);
        }
      } else {
        const detentions: Partial<Detention>[] = jsonData.map((row: any, index) => ({
          id: `detention-${Date.now()}-${index}`,
          number: row['Nummer'] || row['Number'] || row['nummer'] || row['number'] || index + 1,
          date: row['Datum'] || row['Date'] || row['datum'] || row['date'] || '',
          dayOfWeek: (row['Dag'] || row['Day'] || row['dag'] || row['day'] || 'MAANDAG').toUpperCase() as any,
          student: row['Leerling'] || row['Student'] || row['leerling'] || row['student'] || '',
          teacher: row['Leerkracht'] || row['Teacher'] || row['leerkracht'] || row['teacher'] || '',
          reason: row['Reden'] || row['Reason'] || row['reden'] || row['reason'] || '',
          task: row['Opdracht'] || row['Task'] || row['opdracht'] || row['task'] || '',
          lvsDate: row['LVS Datum'] || row['LVS Date'] || row['lvs_datum'] || row['lvs_date'] || '',
          shouldPrint: row['Print'] === 'Ja' || row['Print'] === true || row['print'] === 'ja',
          canUseChromebook: row['Chromebook'] === 'Ja' || row['Chromebook'] === true || row['chromebook'] === 'ja',
          extraNotes: row['Opmerkingen'] || row['Notes'] || row['opmerkingen'] || row['notes'] || '',
        })).filter(d => d.student && d.date);

        setPreview(detentions.slice(0, 5));
        if (onImportDetentions) {
          // Importar todas las detenciones
          for (const detention of detentions) {
            await fetch('/api/detentions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(detention),
            });
          }
          setSuccess(`${detentions.length} nablijven geïmporteerd`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Fout bij importeren van bestand');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Upload className="h-5 w-5 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">
          Massa Import {type === 'students' ? 'Leerlingen' : 'Nablijven'}
        </h3>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Upload Excel/CSV Bestand
        </label>
        <div className="flex items-center gap-3">
          <label className="btn-primary cursor-pointer flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bestand Selecteren
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </label>
          {isProcessing && (
            <span className="text-slate-400 text-sm">Verwerken...</span>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 mb-4">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Preview (eerste 5):</h4>
          <div className="bg-slate-700/50 rounded-lg p-3 max-h-48 overflow-y-auto">
            <pre className="text-xs text-slate-300">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
        <p className="text-xs text-slate-400">
          <strong>Formaat:</strong> Excel (.xlsx, .xls) of CSV bestand. 
          {type === 'students' 
            ? ' Kolommen: Naam, Klas, Dag'
            : ' Kolommen: Datum, Leerling, Leerkracht, Reden, Opdracht, etc.'
          }
        </p>
      </div>
    </div>
  );
}
