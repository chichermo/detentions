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
      <div className="mb-5 pb-4 border-b border-[var(--border-subtle)]">
        <h3 className="font-display text-lg font-bold text-primary">{title}</h3>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {empty ? (
        <div className="empty-state h-[260px]">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
