'use client';

import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export default function ChartCard({
  title,
  subtitle,
  children,
  empty = false,
  emptyMessage = 'Geen data voor deze periode.',
  className = '',
}: ChartCardProps) {
  return (
    <div className={`card p-4 sm:p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {empty ? (
        <div className="flex items-center justify-center h-[280px] rounded-xl border border-dashed border-slate-600/50 bg-slate-800/30">
          <p className="text-slate-400 text-sm px-4 text-center">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
