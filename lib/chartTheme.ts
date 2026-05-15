/** Tema Recharts — paleta Nablijven (cobre / menta / coral) */

export const NABLIIJVEN_CHART_COLORS = {
  primary: '#e8953a',
  secondary: '#5eead4',
  accent: '#a78bfa',
  danger: '#ff7b72',
  warning: '#ffc878',
  info: '#67c6e8',
  purple: '#c4b5fd',
  pink: '#f9a8d4',
} as const;

export const CHART_PALETTE = [
  NABLIIJVEN_CHART_COLORS.primary,
  NABLIIJVEN_CHART_COLORS.secondary,
  NABLIIJVEN_CHART_COLORS.accent,
  NABLIIJVEN_CHART_COLORS.danger,
  NABLIIJVEN_CHART_COLORS.info,
  NABLIIJVEN_CHART_COLORS.purple,
  NABLIIJVEN_CHART_COLORS.pink,
] as const;

export const DAY_LABELS: Record<string, string> = {
  MAANDAG: 'Ma',
  DINSDAG: 'Di',
  DONDERDAG: 'Do',
};

import type { CSSProperties } from 'react';

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: 'rgba(14, 15, 22, 0.96)',
  border: '1px solid rgba(244, 239, 230, 0.12)',
  borderRadius: '12px',
  color: '#f4efe6',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
  padding: '10px 14px',
  fontFamily: 'var(--font-sans)',
};

export const CHART_AXIS_TICK = { fill: 'rgba(244, 239, 230, 0.45)', fontSize: 11 };
export const CHART_GRID_STROKE = 'rgba(244, 239, 230, 0.08)';
export const BAR_TOP_RADIUS: [number, number, number, number] = [8, 8, 0, 0];
