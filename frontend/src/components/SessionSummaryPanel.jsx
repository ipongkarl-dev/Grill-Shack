import { Badge } from "../components/ui/badge";
import { formatCurrency, getStatusBadgeClass } from "../lib/chartUtils";

const SessionSummaryPanel = ({ calculations }) => {
  const { totalUnits, calculatedSales, totalCollected, variance, status, foodCogs, packaging, totalCogs, cogsPercent, grossProfit } = calculations;

  const varianceColor = variance > 0 ? 'text-amber-500' : variance < 0 ? 'text-blue-500' : 'text-emerald-500';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-zinc-400">Status</span>
        <Badge className={getStatusBadgeClass(status)}>{status}</Badge>
      </div>

      <div className="border-t border-zinc-800 pt-4 space-y-3">
        <Row label="Total Units" value={totalUnits} />
        <Row label="Calculated Sales" value={formatCurrency(calculatedSales)} valueClass="text-orange-500 font-semibold" />
        <Row label="Total Collected" value={formatCurrency(totalCollected)} />
        <Row label="Variance" value={formatCurrency(variance)} valueClass={varianceColor} />
      </div>

      <div className="border-t border-zinc-800 pt-4 space-y-3">
        <Row label="Food COGS" value={formatCurrency(foodCogs)} />
        <Row label="Packaging" value={formatCurrency(packaging)} />
        <Row label="Total COGS" value={formatCurrency(totalCogs)} valueClass="text-red-400" />
        <Row label="COGS %" value={`${cogsPercent.toFixed(1)}%`} />
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <div className="flex justify-between">
          <span className="text-zinc-400 font-medium">Gross Profit</span>
          <span className="font-mono text-emerald-500 font-bold text-lg">{formatCurrency(grossProfit)}</span>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, valueClass = "text-zinc-200" }) => (
  <div className="flex justify-between">
    <span className="text-zinc-400">{label}</span>
    <span className={`font-mono ${valueClass}`}>{value}</span>
  </div>
);

export default SessionSummaryPanel;
