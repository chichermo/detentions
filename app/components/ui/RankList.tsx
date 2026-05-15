'use client';

interface RankListItem {
  label: string;
  value: number;
}

interface RankListProps {
  items: RankListItem[];
  emptyMessage?: string;
  tone?: 'indigo' | 'red';
}

export default function RankList({
  items,
  emptyMessage = 'Geen data beschikbaar',
  tone = 'indigo',
}: RankListProps) {
  const badgeClass =
    tone === 'red'
      ? 'bg-red-500/20 text-red-400'
      : 'bg-indigo-500/20 text-indigo-400';

  if (items.length === 0) {
    return <p className="text-slate-400 text-sm py-2">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2" role="list">
      {items.map((item, idx) => (
        <li
          key={`${item.label}-${idx}`}
          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-700/40 border border-slate-700/50 hover:bg-slate-700/60 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${badgeClass}`}
            >
              {idx + 1}
            </span>
            <span className="text-slate-200 font-medium truncate">{item.label}</span>
          </div>
          <span className="text-slate-300 font-bold tabular-nums shrink-0">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
