'use client';

import { useId } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  staffNames: string[];
  placeholder?: string;
  className?: string;
  id?: string;
};

/** Tekstveld + datalist van geïmporteerd personeel (vrij typen blijft mogelijk). */
export default function StaffNameInput({
  value,
  onChange,
  staffNames,
  placeholder = 'Naam van personeelslid',
  className = 'input-field',
  id,
}: Props) {
  const autoId = useId();
  const listId = `staff-list-${id || autoId.replace(/:/g, '')}`;

  return (
    <>
      <input
        type="text"
        id={id}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      <datalist id={listId}>
        {staffNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}

export async function fetchStaffNames(): Promise<string[]> {
  try {
    const res = await fetch('/api/staff', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((s: { name?: string }) => String(s.name || '').trim())
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b, 'nl'));
  } catch {
    return [];
  }
}
