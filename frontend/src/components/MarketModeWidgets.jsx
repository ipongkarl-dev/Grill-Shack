import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { DollarSign, CreditCard, Eye, Clock } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(v);

export const TransactionLog = ({ transactions, onView }) => (
  <div className="space-y-1 max-h-[300px] overflow-y-auto">
    {[...transactions].reverse().map((txn, idx) => (
      <button key={txn.id || idx} onClick={() => onView(txn)}
        className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left" data-testid={`txn-${transactions.length - idx}`}>
        <div className="flex items-center gap-3">
          <Badge className={`text-xs ${txn.payment_method === 'cash' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
            {txn.payment_method === 'cash' ? <DollarSign className="w-3 h-3 mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
            {txn.payment_method.toUpperCase()}
          </Badge>
          <span className="text-zinc-400 text-xs font-mono">#{transactions.length - idx}</span>
          <span className="text-zinc-500 text-xs">{txn.timestamp?.slice(11, 19)}</span>
          <span className="text-zinc-400 text-xs">{(txn.items || []).map(i => `${i.product_name} x${i.units}`).join(', ')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-orange-500 font-mono text-sm font-bold">{fmt(txn.total)}</span>
          <Eye className="w-3 h-3 text-zinc-600" />
        </div>
      </button>
    ))}
  </div>
);

export const OrderSummary = ({ currentUnits, currentCOGS, currentTotal }) => (
  <div className="border-t border-zinc-800 pt-3 space-y-1">
    <div className="flex justify-between text-sm"><span className="text-zinc-400">Units</span><span className="text-zinc-200">{currentUnits}</span></div>
    <div className="flex justify-between text-sm"><span className="text-zinc-400">COGS</span><span className="text-red-400">{fmt(currentCOGS)}</span></div>
    <div className="flex justify-between text-sm"><span className="text-zinc-400">Profit</span><span className="text-emerald-500">{fmt(currentTotal - currentCOGS)}</span></div>
    <div className="flex justify-between font-bold text-lg pt-2 border-t border-zinc-800">
      <span className="text-zinc-200">Total</span>
      <span className="text-orange-500">{fmt(currentTotal)}</span>
    </div>
  </div>
);
