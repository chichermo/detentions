'use client';

interface LoadingPageProps {
  label?: string;
}

export default function LoadingPage({ label = 'Laden...' }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-6 px-4">
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <p className="text-slate-400 text-sm font-medium" role="status">
        {label}
      </p>
      <div className="w-full max-w-md space-y-3 px-2" aria-hidden>
        <div className="h-24 rounded-2xl skeleton" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-2xl skeleton" />
          <div className="h-20 rounded-2xl skeleton" />
        </div>
      </div>
    </div>
  );
}
