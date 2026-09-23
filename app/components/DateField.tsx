'use client';

import { useRef } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  id?: string;
  min?: string;
};

function toDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

/** Datumveld dat dd/mm/jjjj toont; intern blijft yyyy-MM-dd. */
export default function DateField({
  value,
  onChange,
  className = 'input-field date-field w-full',
  required,
  id,
  min,
}: Props) {
  const nativeRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = nativeRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === 'function') {
        el.showPicker();
        return;
      }
    } catch {
      /* showPicker kan falen als de pagina geen user-gesture heeft */
    }
    el.focus();
    el.click();
  };

  return (
    <div className="date-field-wrap">
      <input
        type="text"
        readOnly
        value={toDisplay(value)}
        placeholder="dd/mm/jjjj"
        className={className}
        id={id}
        required={required && !value}
        onClick={openPicker}
        onFocus={openPicker}
        aria-label="Datum"
      />
      <input
        ref={nativeRef}
        type="date"
        lang="nl-BE"
        min={min}
        value={value}
        tabIndex={-1}
        onChange={(e) => onChange(e.target.value)}
        className="date-field-native"
        aria-hidden="true"
      />
    </div>
  );
}
