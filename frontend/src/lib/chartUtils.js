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
