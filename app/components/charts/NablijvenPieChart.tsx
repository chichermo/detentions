'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  CHART_PALETTE,
  CHART_TOOLTIP_STYLE,
  DAY_LABELS,
  NABLIIJVEN_CHART_COLORS,
} from '@/lib/chartTheme';

export type PieChartPoint = { label: string; value: number };

interface NablijvenPieChartProps {
  data: PieChartPoint[];
  height?: number;
  ariaLabel: string;
  formatLabel?: (label: string) => string;
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload?: { fill?: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
  return (
    <div style={CHART_TOOLTIP_STYLE} className="text-sm">
      <p className="font-semibold text-slate-100">{item.name}</p>
      <p className="tabular-nums mt-1">
        <span className="font-semibold">{item.value}</span>
        <span className="text-slate-400 ml-1">({pct}%)</span>
      </p>
    </div>
  );
}

export default function NablijvenPieChart({
  data,
  height = 300,
  ariaLabel,
  formatLabel = (l) => DAY_LABELS[l] ?? l,
}: NablijvenPieChartProps) {
  const chartData = data
    .filter((d) => d.value > 0)
    .map((d) => ({ name: formatLabel(d.label), value: d.value }));

  if (chartData.length === 0) return null;

  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => {
              const p = percent ?? 0;
              return p > 0.06 ? `${name} ${(p * 100).toFixed(0)}%` : '';
            }}
            labelLine={false}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2 px-2">
        {chartData.map((d, i) => (
          <span key={d.name} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}
            />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}
