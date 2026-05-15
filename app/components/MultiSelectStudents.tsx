'use client';

import { useState, useMemo } from 'react';
import { Check, X, Search, ChevronDown } from 'lucide-react';
import { Student } from '@/types';

interface MultiSelectStudentsProps {
  students: Student[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectStudents({
  students,
  selected,
  onChange,
  placeholder = "Selecteer leerlingen...",
}: MultiSelectStudentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.grade?.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const toggleStudent = (studentId: string) => {
    if (selected.includes(studentId)) {
      onChange(selected.filter(id => id !== studentId));
    } else {
      onChange([...selected, studentId]);
    }
  };

  const removeStudent = (studentId: string) => {
    onChange(selected.filter(id => id !== studentId));
  };

  const selectedStudents = students.filter(s => selected.includes(s.id));

  return (
    <div className="relative">
      <div
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="select-field cursor-pointer flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-muted">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedStudents.slice(0, 3).map(student => (
                <span
                  key={student.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--accent-muted)] text-[var(--accent-hover)] rounded text-sm"
                >
                  {student.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStudent(student.id);
                    }}
                    className="hover:text-primary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {selected.length > 3 && (
                <span className="text-muted text-sm">
                  +{selected.length - 3} meer
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-muted shrink-0 flex items-center">
          {selected.length > 0 && (
            <span className="text-sm mr-2">{selected.length} geselecteerd</span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <>
          <button
            type="button"
            className="dropdown-backdrop"
            aria-label="Sluiten"
            onClick={() => setIsOpen(false)}
          />
          <div className="dropdown-menu left-0 right-0 w-full max-h-80 overflow-hidden p-0 mt-2">
            <div className="p-3 border-b border-[var(--border-subtle)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Zoek leerlingen..."
                  className="input-field pl-12"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-64">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-muted text-sm">
                  Geen leerlingen gevonden
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selected.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-[var(--border-subtle)] last:border-b-0"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-[var(--accent)] border-[var(--accent)]'
                          : 'border-[var(--border-strong)]'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-[#1a1208]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-primary font-medium">{student.name}</div>
                        {student.grade && (
                          <div className="text-muted text-sm">{student.grade}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
