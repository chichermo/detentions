'use client';

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
  return (
    <div className="date-field-wrap">
      <input
        type="text"
        readOnly
        tabIndex={-1}
        value={toDisplay(value)}
        placeholder="dd/mm/jjjj"
        className={className}
        aria-hidden="true"
      />
      <input
        type="date"
        id={id}
        lang="nl-BE"
        required={required}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="date-field-native"
      />
    </div>
  );
}
