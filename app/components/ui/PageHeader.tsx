'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconTone?: 'copper' | 'mint' | 'violet' | 'sky';
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
}

const iconTones = {
  copper: 'bg-gradient-to-br from-[#e8953a] to-[#c97a28] text-[#1a1208] shadow-[0_8px_24px_-6px_rgba(232,149,58,0.45)]',
  mint: 'bg-gradient-to-br from-[#5eead4] to-[#2dd4bf] text-[#0a1f1a] shadow-[0_8px_24px_-6px_rgba(94,234,212,0.35)]',
  violet: 'bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] text-[#1a1028] shadow-[0_8px_24px_-6px_rgba(167,139,250,0.35)]',
  sky: 'bg-gradient-to-br from-[#67c6e8] to-[#38a3c9] text-[#0a1820] shadow-[0_8px_24px_-6px_rgba(103,198,232,0.35)]',
};

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconTone = 'copper',
  onBack,
  backLabel = 'Terug',
  actions,
}: PageHeaderProps) {
  return (
    <header className="glass sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="btn-ghost p-2 shrink-0 rounded-xl"
                aria-label={backLabel}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-2xl shrink-0 ${iconTones[iconTone]}`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-primary tracking-tight truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-muted text-xs sm:text-sm mt-0.5 truncate">{subtitle}</p>
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
