'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RankItem {
  name: string;
  count: number;
}

interface Props {
  title: string;
  nameHeader: string;
  items: RankItem[];
  previewCount?: number;
}

export default function ExpandableRankTable({
  title,
  nameHeader,
  items,
  previewCount = 10,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = items.length > previewCount;
  const visible = expanded || !canExpand ? items : items.slice(0, previewCount);

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {expanded || !canExpand
              ? `${items.length} in totaal`
              : `Top ${Math.min(previewCount, items.length)} van ${items.length}`}
          </p>
        </div>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5 shrink-0"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Toon top {previewCount}
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Toon alle {items.length}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
      <div
        className={`overflow-x-auto ${
          expanded && items.length > 12 ? 'max-h-[28rem] overflow-y-auto' : ''
        }`}
      >
        <table className="table-simple">
          <thead className="sticky top-0 bg-[var(--surface,rgba(15,23,42,0.95))]">
            <tr>
              <th className="w-12">#</th>
              <th>{nameHeader}</th>
              <th className="text-right">Aantal</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item, idx) => (
              <tr key={`${item.name}-${idx}`}>
                <td className="tabular-nums text-slate-500">{idx + 1}</td>
                <td>{item.name}</td>
                <td className="text-right font-semibold tabular-nums">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
