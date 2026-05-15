'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BAR_TOP_RADIUS,
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
  NABLIIJVEN_CHART_COLORS,
} from '@/lib/chartTheme';

export type ComparisonPoint = {
  label: string;
  period1: number;
  period2: number;
};

interface ComparisonBarChartProps {
  data: ComparisonPoint[];
  period1Name: string;
  period2Name: string;
  height?: number;
  ariaLabel: string;
}

function ComparisonTooltip({
  active,
  payload,
  label,
  period1Name,
  period2Name,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  period1Name: string;
  period2Name: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CHART_TOOLTIP_STYLE} className="text-sm">
      <p className="font-semibold mb-2 text-primary">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex justify-between gap-4 tabular-nums">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function ComparisonBarChart({
  data,
  period1Name,
  period2Name,
  height = 300,
  ariaLabel,
}: ComparisonBarChartProps) {
  const chartData = data.map((d) => ({
    label: d.label,
    period1: d.period1,
    period2: d.period2,
  }));

  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }} barGap={4} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" stroke="transparent" tick={CHART_AXIS_TICK} />
          <YAxis stroke="transparent" tick={CHART_AXIS_TICK} allowDecimals={false} width={36} />
          <Tooltip
            content={
              <ComparisonTooltip period1Name={period1Name} period2Name={period2Name} />
            }
            cursor={{ fill: 'rgba(129, 140, 248, 0.06)', radius: 4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.9)', paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            dataKey="period1"
            name={period1Name}
            fill={NABLIIJVEN_CHART_COLORS.primary}
            radius={BAR_TOP_RADIUS}
            maxBarSize={40}
          />
          <Bar
            dataKey="period2"
            name={period2Name}
            fill={NABLIIJVEN_CHART_COLORS.secondary}
            radius={BAR_TOP_RADIUS}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
