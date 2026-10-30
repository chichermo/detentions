'use client';

import {
  ANDERE_HINT,
  ANDERE_OPTION_LABEL,
  ANDERE_REASON,
  DETENTION_REASONS,
  toCanonicalReason,
} from '@/lib/reasonNormalize';

interface ReasonSelectProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
  className?: string;
}

export default function ReasonSelect({
  value,
  onChange,
  required = true,
  id,
  className = 'select-field w-full',
}: ReasonSelectProps) {
  const selected = toCanonicalReason(value);

  return (
    <div>
      <select
        id={id}
        required={required}
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        <option value="">Selecteer reden...</option>
        {DETENTION_REASONS.map((reason) => (
          <option key={reason} value={reason}>
            {reason === ANDERE_REASON ? ANDERE_OPTION_LABEL : reason}
          </option>
        ))}
      </select>
      {selected === ANDERE_REASON && (
        <p className="mt-1.5 text-xs text-slate-400">
          {ANDERE_HINT.charAt(0).toUpperCase() + ANDERE_HINT.slice(1)}.
        </p>
      )}
    </div>
  );
}
