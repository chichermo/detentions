'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
  NABLIIJVEN_CHART_COLORS,
} from '@/lib/chartTheme';

export type LineSeries = { dataKey: string; name: string; color: string };

export type LineChartPoint = Record<string, string | number>;

interface NablijvenLineChartProps {
  data: LineChartPoint[];
  series: LineSeries[];
  labelKey?: string;
  height?: number;
  ariaLabel: string;
}

function LineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CHART_TOOLTIP_STYLE} className="text-sm">
      <p className="font-semibold mb-2 text-primary">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <p key={p.name} className="flex justify-between gap-4 tabular-nums">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-semibold">{p.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export default function NablijvenLineChart({
  data,
  series,
  labelKey = 'label',
  height = 320,
  ariaLabel,
}: NablijvenLineChartProps) {
  const tickInterval = data.length > 12 ? Math.ceil(data.length / 10) : 0;
  const primary = series[0];

  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        <ComposedChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
          <XAxis
            dataKey={labelKey}
            stroke="transparent"
            tick={CHART_AXIS_TICK}
            interval={tickInterval || 'preserveStartEnd'}
            minTickGap={40}
            angle={data.length > 8 ? -28 : 0}
            textAnchor={data.length > 8 ? 'end' : 'middle'}
            height={data.length > 8 ? 64 : 36}
          />
          <YAxis stroke="transparent" tick={CHART_AXIS_TICK} allowDecimals={false} width={36} />
          <Tooltip content={<LineTooltip />} cursor={{ stroke: 'rgba(148, 163, 184, 0.2)' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.9)', paddingTop: 8 }}
            iconType="line"
          />
          {primary && (
            <Area
              type="monotone"
              dataKey={primary.dataKey}
              name={primary.name}
              stroke={primary.color}
              fill={primary.color}
              fillOpacity={0.12}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              legendType="none"
            />
          )}
          {series.map((s) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
