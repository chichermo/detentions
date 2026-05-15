'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Detention, Student } from '@/types';

type BackupPayload = {
  version?: string;
  students?: Student[];
  detentions?: Detention[];
};

export default function BackupRestore() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        'Backup importeren kan bestaande gegevens aanvullen. Doorgaan? (Aanbevolen: eerst een backup downloaden.)'
      )
    ) {
      e.target.value = '';
      return;
    }

    setRestoring(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupPayload;
      const students = Array.isArray(data.students) ? data.students : [];
      const detentions = Array.isArray(data.detentions) ? data.detentions : [];

      let studentOk = 0;
      let detentionOk = 0;

      for (const student of students) {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: student.name,
            grade: student.grade,
            day: student.day,
          }),
        });
        if (res.ok) studentOk++;
      }

      for (const detention of detentions) {
        const res = await fetch('/api/detentions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(detention),
        });
        if (res.ok) detentionOk++;
      }

      alert(
        `Import voltooid: ${studentOk}/${students.length} leerlingen, ${detentionOk}/${detentions.length} nablijven.`
      );
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Ongeldig backup-bestand of import mislukt.');
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={restoring}
        className="btn-secondary flex items-center gap-2 text-sm"
        title="Backup JSON importeren"
      >
        <Upload className={`h-4 w-4 ${restoring ? 'animate-pulse' : ''}`} />
        <span className="hidden sm:inline">{restoring ? 'Importeren…' : 'Import'}</span>
      </button>
    </>
  );
}
