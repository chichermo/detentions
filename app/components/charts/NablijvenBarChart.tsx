'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
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

export type BarChartPoint = { label: string; value: number };

interface NablijvenBarChartProps {
  data: BarChartPoint[];
  color?: string;
  layout?: 'vertical' | 'horizontal';
  height?: number;
  ariaLabel: string;
  valueLabel?: string;
}

function BarTooltip({
  active,
  payload,
  label,
  valueLabel = 'Aantal',
}: {
  active?: boolean;
  payload?: { value?: number; color?: string }[];
  label?: string;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const color = payload[0]?.color ?? NABLIIJVEN_CHART_COLORS.primary;
  return (
    <div style={CHART_TOOLTIP_STYLE} className="text-sm">
      <p className="font-semibold mb-1.5 text-slate-100">{label}</p>
      <p className="flex justify-between gap-4 tabular-nums">
        <span style={{ color }}>{valueLabel}</span>
        <span className="font-semibold">{value}</span>
      </p>
    </div>
  );
}

export default function NablijvenBarChart({
  data,
  color = NABLIIJVEN_CHART_COLORS.primary,
  layout = 'vertical',
  height = 300,
  ariaLabel,
  valueLabel = 'Aantal',
}: NablijvenBarChartProps) {
  const chartData = data.map((d) => ({ label: d.label, value: d.value }));
  const isHorizontal = layout === 'horizontal';
  const manyLabels = chartData.length > 6;

  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        <BarChart
          data={chartData}
          layout={isHorizontal ? 'vertical' : undefined}
          margin={
            isHorizontal
              ? { left: 8, right: 24, top: 8, bottom: 8 }
              : { top: 8, right: 12, left: 4, bottom: manyLabels ? 72 : 8 }
          }
          barCategoryGap={isHorizontal ? '18%' : '22%'}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_GRID_STROKE}
            vertical={!isHorizontal}
            horizontal={isHorizontal}
          />
          {isHorizontal ? (
            <>
              <XAxis type="number" stroke="transparent" tick={CHART_AXIS_TICK} allowDecimals={false} />
              <YAxis
                dataKey="label"
                type="category"
                stroke="transparent"
                tick={CHART_AXIS_TICK}
                width={Math.min(180, Math.max(72, ...chartData.map((d) => d.label.length * 6)))}
                interval={0}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                stroke="transparent"
                tick={CHART_AXIS_TICK}
                angle={manyLabels ? -32 : 0}
                textAnchor={manyLabels ? 'end' : 'middle'}
                height={manyLabels ? 72 : 36}
                interval={0}
              />
              <YAxis stroke="transparent" tick={CHART_AXIS_TICK} allowDecimals={false} width={36} />
            </>
          )}
          <Tooltip
            content={<BarTooltip valueLabel={valueLabel} />}
            cursor={{ fill: 'rgba(129, 140, 248, 0.08)', radius: 4 }}
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={isHorizontal ? [0, 6, 6, 0] : BAR_TOP_RADIUS}
            maxBarSize={isHorizontal ? 28 : 48}
            isAnimationActive
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
