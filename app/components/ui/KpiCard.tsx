'use client';

import { LucideIcon } from 'lucide-react';

type KpiTone = 'indigo' | 'emerald' | 'amber' | 'purple' | 'red' | 'rose';

const toneStyles: Record<KpiTone, { icon: string; ring: string }> = {
  indigo: { icon: 'bg-indigo-500/20 text-indigo-400', ring: 'group-hover:shadow-indigo-500/10' },
  emerald: { icon: 'bg-emerald-500/20 text-emerald-400', ring: 'group-hover:shadow-emerald-500/10' },
  amber: { icon: 'bg-amber-500/20 text-amber-400', ring: 'group-hover:shadow-amber-500/10' },
  purple: { icon: 'bg-purple-500/20 text-purple-400', ring: 'group-hover:shadow-purple-500/10' },
  red: { icon: 'bg-red-500/20 text-red-400', ring: 'group-hover:shadow-red-500/10' },
  rose: { icon: 'bg-rose-500/20 text-rose-400', ring: 'group-hover:shadow-rose-500/10' },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: KpiTone;
}

export default function KpiCard({ label, value, hint, icon: Icon, tone = 'indigo' }: KpiCardProps) {
  const styles = toneStyles[tone];
  return (
    <div className={`kpi-card group ${styles.ring}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`p-2.5 sm:p-3 rounded-xl ${styles.icon}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </div>
        {hint && <span className="text-xs text-slate-500 text-right leading-tight max-w-[50%]">{hint}</span>}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums tracking-tight">{value}</p>
      <p className="text-xs sm:text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}
