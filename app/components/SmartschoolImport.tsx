'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student } from '@/types';

interface SmartschoolImportProps {
  onImport: (students: Student[]) => void;
}

export default function SmartschoolImport({ onImport }: SmartschoolImportProps) {
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

      // Mapear diferentes formatos de Smartschool
      const students: Student[] = jsonData.map((row: any, index) => {
        // Intentar diferentes nombres de columnas comunes en Smartschool
        const name = row['Naam'] || row['Name'] || row['naam'] || row['name'] || 
                     row['Voornaam'] + ' ' + row['Achternaam'] || 
                     row['Leerling'] || '';
        
        const grade = row['Klas'] || row['Grade'] || row['klas'] || row['grade'] || 
                      row['Groep'] || row['Jaar'] || '';
        
        // Determinar día basado en algún campo o aleatorio
        const dayField = row['Dag'] || row['Day'] || row['dag'] || row['day'];
        const day = dayField ? dayField.toUpperCase() : 
                   (index % 3 === 0 ? 'MAANDAG' : index % 3 === 1 ? 'DINSDAG' : 'DONDERDAG');

        return {
          id: `student-${Date.now()}-${index}`,
          name: name.trim(),
          grade: grade ? grade.toString().trim() : '',
          day: day as any,
        };
      }).filter(s => s.name);

      if (students.length === 0) {
        throw new Error('Geen geldige leerlingen gevonden in het bestand');
      }

      setPreview(students.slice(0, 5));
      onImport(students);
      setSuccess(`${students.length} leerlingen geïmporteerd`);
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
          <ExternalLink className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Smartschool Import</h3>
          <p className="text-sm text-slate-400">Importeer leerlingen vanuit Smartschool</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Upload Excel/CSV Bestand van Smartschool
        </label>
        <div className="flex items-center gap-3">
          <label className="btn-primary cursor-pointer flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bestand Selecteren
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
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
            <div className="space-y-2">
              {preview.map((student, idx) => (
                <div key={idx} className="text-xs text-slate-300">
                  {student.name} - {student.grade} ({student.day})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
        <p className="text-xs text-slate-400">
          <strong>Formaat:</strong> Excel (.xlsx, .xls) o CSV bestand geëxporteerd vanuit Smartschool.
          <br />
          <strong>Kolommen:</strong> Naam, Klas/Groep, Dag (optioneel)
          <br />
          <strong>Nota:</strong> Als de kolomnamen niet automatisch worden herkend, controleer de eerste regel van uw bestand.
        </p>
      </div>
    </div>
  );
}
