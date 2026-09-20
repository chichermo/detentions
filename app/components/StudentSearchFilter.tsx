'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Detention, Student } from '@/types';
import { sortStudentsByClass } from '@/lib/studentImport';

type StudentOption = {
  key: string;
  name: string;
  grade?: string;
  label: string;
};

function uniqueStudentOptions(students: Student[], detentions: Detention[]): StudentOption[] {
  const map = new Map<string, StudentOption>();

  for (const student of students) {
    const name = student.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    map.set(key, {
      key,
      name,
      grade: student.grade,
      label: student.grade ? `${name} — ${student.grade}` : name,
    });
  }

  for (const detention of detentions) {
    const [rawName, ...rest] = String(detention.student || '').split(' - ');
    const name = rawName.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (map.has(key)) continue;
    const grade = rest.join(' - ').trim();
    map.set(key, {
      key,
      name,
      grade: grade || undefined,
      label: grade ? `${name} — ${grade}` : name,
    });
  }

  return sortStudentsByClass(Array.from(map.values()));
}

interface StudentSearchFilterProps {
  students: Student[];
  detentions: Detention[];
  value: string;
  onChange: (value: string) => void;
}

export default function StudentSearchFilter({
  students,
  detentions,
  value,
  onChange,
}: StudentSearchFilterProps) {
  const [open, setOpen] = useState(false);
  const options = useMemo(
    () => uniqueStudentOptions(students, detentions),
    [students, detentions]
  );

  const term = value.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!term) return options.slice(0, 12);
    return options
      .filter(
        (option) =>
          option.name.toLowerCase().includes(term) ||
          option.grade?.toLowerCase().includes(term) ||
          option.label.toLowerCase().includes(term)
      )
      .slice(0, 12);
  }, [options, term]);

  const exact = options.find((option) => option.name.toLowerCase() === term);

  return (
    <div className="relative">
      <label className="form-label">Leerling</label>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none z-10" />
        <input
          type="search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Zoek op naam of klas…"
          className={`input-field input-field-with-icon w-full${value ? ' input-field-with-icon-right' : ''}`}
          autoComplete="off"
          aria-expanded={open}
          aria-controls="student-filter-results"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            aria-label="Leerlingfilter wissen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <>
          <button
            type="button"
            className="dropdown-backdrop"
            aria-label="Suggesties sluiten"
            onClick={() => setOpen(false)}
          />
          <ul id="student-filter-results" className="dropdown-menu left-0 right-0 w-full mt-1">
            {matches.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-muted">Geen leerlingen gevonden</li>
            ) : (
              matches.map((option) => (
                <li key={option.key}>
                  <button
                    type="button"
                    className={`dropdown-item ${
                      exact?.key === option.key ? 'bg-[var(--accent-muted)] text-[var(--accent-hover)]' : ''
                    }`}
                    onClick={() => {
                      onChange(option.name);
                      setOpen(false);
                    }}
                  >
                    <span className="block font-medium truncate">{option.name}</span>
                    {option.grade && (
                      <span className="block text-xs text-muted truncate">{option.grade}</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}
