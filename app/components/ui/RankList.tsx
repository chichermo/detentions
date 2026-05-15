'use client';

interface RankListItem {
  label: string;
  value: number;
}

interface RankListProps {
  items: RankListItem[];
  emptyMessage?: string;
  tone?: 'copper' | 'coral' | 'red';
}

export default function RankList({
  items,
  emptyMessage = 'Geen data beschikbaar',
  tone = 'copper',
}: RankListProps) {
  const badgeClass =
    tone === 'coral' || tone === 'red'
      ? 'bg-[var(--coral-muted)] text-[#ffb4ae]'
      : 'bg-[var(--accent-muted)] text-[#f0c078]';

  if (items.length === 0) {
    return <p className="text-muted text-sm py-2">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2" role="list">
      {items.map((item, idx) => (
        <li key={`${item.label}-${idx}`} className="rank-row">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${badgeClass}`}
            >
              {idx + 1}
            </span>
            <span className="text-primary font-medium truncate">{item.label}</span>
          </div>
          <span className="text-secondary font-bold tabular-nums shrink-0">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
