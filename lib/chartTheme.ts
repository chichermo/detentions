/** Tema compartido Recharts — Nablijven (alineado con chillouts app) */

export const NABLIIJVEN_CHART_COLORS = {
  primary: '#818cf8',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#f87171',
  warning: '#fbbf24',
  info: '#3b82f6',
  purple: '#a78bfa',
  pink: '#ec4899',
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
  backgroundColor: 'rgba(15, 23, 42, 0.96)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '10px',
  color: '#f1f5f9',
  boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
  padding: '10px 12px',
};

export const CHART_AXIS_TICK = { fill: 'rgba(148, 163, 184, 0.85)', fontSize: 11 };
export const CHART_GRID_STROKE = 'rgba(148, 163, 184, 0.12)';
export const BAR_TOP_RADIUS: [number, number, number, number] = [6, 6, 0, 0];
