import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Wallet, TrendingUp, Shield, PiggyBank } from "lucide-react";

const AllocationSlider = ({ icon: Icon, label, value, onChange, color, iconColor }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <Label className="text-zinc-400 flex items-center">
        <Icon className={`w-4 h-4 mr-2 ${iconColor}`} />
        {label}
      </Label>
      <span className={`${color} font-mono font-bold`}>{value}%</span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} max={100} min={0} step={5} className="w-full" />
  </div>
);

export const AllocationSliders = ({ settings, onPercentChange }) => (
  <div className="space-y-4">
    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Profit Distribution (Must total 100%)</p>
    <AllocationSlider icon={Wallet} label="Owner Pay" value={settings.owner_pay_percent} onChange={(v) => onPercentChange('owner_pay_percent', v)} color="text-orange-500" iconColor="text-orange-500" />
    <AllocationSlider icon={TrendingUp} label="Growth / Savings" value={settings.growth_percent} onChange={(v) => onPercentChange('growth_percent', v)} color="text-emerald-500" iconColor="text-emerald-500" />
    <AllocationSlider icon={Shield} label="Emergency / Tax" value={settings.emergency_percent} onChange={(v) => onPercentChange('emergency_percent', v)} color="text-blue-500" iconColor="text-blue-500" />
    <AllocationSlider icon={PiggyBank} label="Business Buffer" value={settings.buffer_percent} onChange={(v) => onPercentChange('buffer_percent', v)} color="text-purple-500" iconColor="text-purple-500" />
  </div>
);

export const AllocationResult = ({ allocation, formatCurrency }) => (
  <div className="grid grid-cols-2 gap-3">
    <ResultCard icon={Wallet} label="Owner Pay" value={formatCurrency(allocation.allocations.owner_pay)} color="orange" />
    <ResultCard icon={TrendingUp} label="Growth" value={formatCurrency(allocation.allocations.growth)} color="emerald" />
    <ResultCard icon={Shield} label="Emergency" value={formatCurrency(allocation.allocations.emergency)} color="blue" />
    <ResultCard icon={PiggyBank} label="Buffer" value={formatCurrency(allocation.allocations.buffer)} color="purple" />
  </div>
);

const ResultCard = ({ icon: Icon, label, value, color }) => (
  <div className={`p-3 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 text-${color}-500`} />
      <span className={`text-xs text-${color}-500 uppercase`}>{label}</span>
    </div>
    <p className={`text-xl font-bold font-heading text-${color}-500`}>{value}</p>
  </div>
);

export const TransferInstructions = ({ allocation, formatCurrency }) => (
  <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Transfer Instructions</p>
    <div className="text-sm space-y-1">
      <TransferRow label="GST Account" value={formatCurrency(allocation.gst_amount)} />
      <TransferRow label="Personal Account" value={formatCurrency(allocation.allocations.owner_pay)} />
      <TransferRow label="Savings Account" value={formatCurrency(allocation.allocations.growth)} />
      <TransferRow label="Emergency Fund" value={formatCurrency(allocation.allocations.emergency)} />
      <TransferRow label="Leave in Business" value={formatCurrency(allocation.allocations.buffer)} />
    </div>
  </div>
);

const TransferRow = ({ label, value }) => (
  <p className="text-zinc-300">
    <span className="text-zinc-500">{label}:</span> {value}
  </p>
);
