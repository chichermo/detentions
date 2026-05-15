'use client';

import { LucideIcon } from 'lucide-react';

type KpiTone = 'copper' | 'mint' | 'violet' | 'coral' | 'sky' | 'cream';
type KpiToneProp = KpiTone | 'indigo' | 'emerald' | 'amber' | 'purple' | 'red' | 'rose';

const toneAlias: Record<string, KpiTone> = {
  indigo: 'copper',
  emerald: 'mint',
  amber: 'cream',
  purple: 'violet',
  red: 'coral',
  rose: 'coral',
};

const toneStyles: Record<KpiTone, { icon: string }> = {
  copper: { icon: 'bg-[var(--accent-muted)] text-[#f0c078]' },
  mint: { icon: 'bg-[var(--mint-muted)] text-[#8ef0d8]' },
  violet: { icon: 'bg-[var(--violet-muted)] text-[#d4c4fd]' },
  coral: { icon: 'bg-[var(--coral-muted)] text-[#ffb4ae]' },
  sky: { icon: 'bg-[var(--sky-muted)] text-[#9dd9f0]' },
  cream: { icon: 'bg-[rgba(244,239,230,0.08)] text-[var(--text-secondary)]' },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: KpiToneProp;
}

export default function KpiCard({ label, value, hint, icon: Icon, tone = 'copper' }: KpiCardProps) {
  const resolved = toneAlias[tone] ?? (tone as KpiTone);
  const styles = toneStyles[resolved];
  return (
    <div className="kpi-card group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`p-2.5 sm:p-3 rounded-2xl ${styles.icon}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </div>
        {hint && (
          <span className="text-xs text-muted text-right leading-tight max-w-[50%]">{hint}</span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-display font-bold text-primary tabular-nums tracking-tight">
        {value}
      </p>
      <p className="text-xs sm:text-sm text-muted mt-1">{label}</p>
    </div>
  );
}
