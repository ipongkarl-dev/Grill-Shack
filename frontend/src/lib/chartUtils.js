import { useMemo } from "react";

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: '8px'
};

export const CHART_AXIS_TICK = { fill: '#a1a1aa', fontSize: 12 };
export const CHART_AXIS_TICK_SM = { fill: '#a1a1aa', fontSize: 10 };
export const CHART_GRID_STROKE = "#27272a";
export const CHART_AXIS_STROKE = "#71717a";

export const CHART_DOT_ORANGE = { fill: '#f97316', r: 4 };
export const CHART_DOT_GREEN = { fill: '#10b981', r: 4 };
export const BAR_RADIUS = [4, 4, 0, 0];
export const BAR_RADIUS_HORIZONTAL = [0, 4, 4, 0];
export const BAR_RADIUS_LARGE = [6, 6, 0, 0];

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2
  }).format(value);
};

export const formatCurrencyShort = (value) => `$${(value / 1000).toFixed(1)}k`;

export const useChartConfig = () => {
  return useMemo(() => ({
    tooltipStyle: CHART_TOOLTIP_STYLE,
    axisTick: CHART_AXIS_TICK,
    axisTickSm: CHART_AXIS_TICK_SM,
    gridStroke: CHART_GRID_STROKE,
    axisStroke: CHART_AXIS_STROKE,
  }), []);
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'OK': return "bg-emerald-500/10 text-emerald-500";
    case 'Over-collected': return "bg-blue-500/10 text-blue-500";
    case 'Under-collected': return "bg-amber-500/10 text-amber-500";
    default: return "bg-red-500/10 text-red-500";
  }
};

export const getCogsBadgeClass = (cogsPercent) => {
  if (cogsPercent > 35) return "bg-red-500/10 text-red-500";
  if (cogsPercent > 25) return "bg-amber-500/10 text-amber-500";
  return "bg-emerald-500/10 text-emerald-500";
};

export const getCogsColor = (cogsPercent) => {
  if (cogsPercent > 35) return 'text-red-500';
  if (cogsPercent > 25) return 'text-amber-500';
  return 'text-emerald-500';
};

export const getCogsChartColor = (cogsPercent) => {
  if (cogsPercent > 35) return '#ef4444';
  if (cogsPercent > 25) return '#f97316';
  return '#10b981';
};

export const getProfitChartColor = (profit) => {
  if (profit > 500) return '#10b981';
  if (profit > 200) return '#f97316';
  return '#ef4444';
};

export const getGrowthColor = (pct) => pct >= 0 ? '#10b981' : '#ef4444';

export const getPctBadgeClass = (pct) => {
  if (pct >= 100) return 'bg-emerald-500/10 text-emerald-500';
  if (pct >= 75) return 'bg-amber-500/10 text-amber-500';
  return 'bg-red-500/10 text-red-500';
};

export const getRankClass = (idx) => {
  if (idx === 0) return 'bg-orange-500/20 text-orange-500';
  if (idx === 1) return 'bg-zinc-600/20 text-zinc-400';
  if (idx === 2) return 'bg-amber-600/20 text-amber-600';
  return 'bg-zinc-800 text-zinc-500';
};

export const getActionLink = (action) => {
  if (action === 'CHECK PRICE' || action === 'PROMOTE') return '/products';
  return '/calculator';
};
