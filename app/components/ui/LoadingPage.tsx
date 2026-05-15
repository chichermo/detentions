'use client';

interface LoadingPageProps {
  label?: string;
}

export default function LoadingPage({ label = 'Laden...' }: LoadingPageProps) {
  return (
    <div className="app-page min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] flex items-center justify-center">
          <span
            className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin"
            aria-hidden
          />
        </div>
        <div
          className="absolute -inset-4 rounded-3xl opacity-40 blur-xl -z-10"
          style={{ background: 'var(--accent-glow)' }}
          aria-hidden
        />
      </div>
      <p className="text-muted text-sm font-medium tracking-wide" role="status">
        {label}
      </p>
      <div className="w-full max-w-sm space-y-3" aria-hidden>
        <div className="h-20 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 skeleton rounded-xl" />
          <div className="h-16 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}
