'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconTone?: 'indigo' | 'purple' | 'orange' | 'emerald';
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
}

const iconTones = {
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/30',
  purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
  orange: 'from-orange-500 to-amber-600 shadow-orange-500/30',
  emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
};

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconTone = 'indigo',
  onBack,
  backLabel = 'Terug',
  actions,
}: PageHeaderProps) {
  return (
    <header className="glass sticky top-0 z-20 border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="btn-ghost p-2 shrink-0"
                aria-label={backLabel}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div
                className={`p-2 sm:p-2.5 bg-gradient-to-br rounded-xl shadow-lg shrink-0 ${iconTones[iconTone]}`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" aria-hidden />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
