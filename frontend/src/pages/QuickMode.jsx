import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, Send, RotateCcw, Zap } from "lucide-react";

const formatCurrency = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(v);

const QuickMode = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date());
  const [selectedMarket, setSelectedMarket] = useState("");
  const [counts, setCounts] = useState({});
  const [showPayment, setShowPayment] = useState(false);
  const [cash, setCash] = useState("");
  const [eftpos, setEftpos] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/markets`)
        ]);
        setProducts(pRes.data);
        setMarkets(mRes.data);
        const init = {};
        pRes.data.forEach(p => { init[p.id] = 0; });
        setCounts(init);
      } catch (_e) { /* logged server-side */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const increment = (id) => setCounts(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const decrement = (id) => setCounts(c => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));

  const totalUnits = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalSales = products.reduce((acc, p) => acc + (counts[p.id] || 0) * p.price, 0);
  const totalCogs = products.reduce((acc, p) => acc + (counts[p.id] || 0) * (p.food_cost + p.packaging_cost), 0);
  const grossProfit = totalSales - totalCogs;

  const reset = () => {
    const init = {};
    products.forEach(p => { init[p.id] = 0; });
    setCounts(init);
    setCash("");
    setEftpos("");
    setShowPayment(false);
  };

  const submit = async () => {
    if (!selectedMarket) { toast.error("Select a market first"); return; }
    if (totalUnits === 0) { toast.error("Add at least one item"); return; }
    setSaving(true);
    try {
      const market = markets.find(m => m.id === selectedMarket);
      const salesList = Object.entries(counts)
        .filter(([_, u]) => u > 0)
        .map(([pid, u]) => ({ product_id: pid, units_sold: u }));

      await axios.post(`${API}/sessions`, {
        date: format(date, "yyyy-MM-dd"),
        market_id: selectedMarket,
        market_name: market?.name || "",
        cash: parseFloat(cash) || 0,
        eftpos: parseFloat(eftpos) || 0,
        sales: salesList,
        created_by_id: user?.id || "",
        created_by_name: user?.name || "",
        created_by_role: user?.role || ""
      });
      toast.success("Session saved!");
      reset();
    } catch (e) {
      toast.error("Failed to save");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Zap className="w-10 h-10 text-orange-500 animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="quick-mode">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-zinc-50 flex items-center gap-2">
            <Zap className="w-7 h-7 text-orange-500" /> Quick Mode
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Tap to count, reconcile later</p>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="border-zinc-700 hover:bg-zinc-800" data-testid="reset-btn">
          <RotateCcw className="w-4 h-4 mr-1" /> Reset
        </Button>
      </div>

      {/* Market & Date */}
      <div className="grid grid-cols-2 gap-3">
        <Select value={selectedMarket} onValueChange={setSelectedMarket}>
          <SelectTrigger className="bg-zinc-900 border-zinc-700 h-12" data-testid="qm-market-select">
            <SelectValue placeholder="Market" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {markets.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-12 bg-zinc-900 border-zinc-700 justify-start" data-testid="qm-date-btn">
              <CalendarIcon className="w-4 h-4 mr-2" /> {format(date, "dd MMM")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800"><Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} /></PopoverContent>
        </Popover>
      </div>

      {/* Product Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map(product => (
          <div
            key={product.id}
            className={`rounded-xl border p-3 transition-all duration-150 select-none ${
              counts[product.id] > 0
                ? 'bg-orange-500/10 border-orange-500/40'
                : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <div className="text-center mb-2">
              <p className="text-sm font-semibold text-zinc-200 truncate">{product.name}</p>
              <p className="text-xs text-zinc-500">{formatCurrency(product.price)}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => decrement(product.id)}
                className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors active:scale-95"
                data-testid={`qm-minus-${product.code}`}
              >
                <Minus className="w-5 h-5 text-zinc-400" />
              </button>
              <span className={`text-2xl font-bold font-heading w-10 text-center ${counts[product.id] > 0 ? 'text-orange-500' : 'text-zinc-600'}`}>
                {counts[product.id] || 0}
              </span>
              <button
                onClick={() => increment(product.id)}
                className="w-10 h-10 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors active:scale-95"
                data-testid={`qm-plus-${product.code}`}
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Summary Bar */}
      <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div><p className="text-xs text-zinc-500">Units</p><p className="text-lg font-bold text-zinc-50">{totalUnits}</p></div>
          <div><p className="text-xs text-zinc-500">Sales</p><p className="text-lg font-bold text-orange-500">{formatCurrency(totalSales)}</p></div>
          <div><p className="text-xs text-zinc-500">COGS</p><p className="text-lg font-bold text-red-400">{formatCurrency(totalCogs)}</p></div>
          <div><p className="text-xs text-zinc-500">Profit</p><p className="text-lg font-bold text-emerald-500">{formatCurrency(grossProfit)}</p></div>
        </div>

        {!showPayment ? (
          <Button
            onClick={() => setShowPayment(true)}
            disabled={totalUnits === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base"
            data-testid="qm-add-payment-btn"
          >
            Add Payment & Save
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-500 text-xs">Cash</Label>
                <Input type="number" step="0.01" value={cash} onChange={e => setCash(e.target.value)} className="bg-zinc-800 border-zinc-700 h-10" placeholder="0.00" data-testid="qm-cash" />
              </div>
              <div>
                <Label className="text-zinc-500 text-xs">EFTPOS</Label>
                <Input type="number" step="0.01" value={eftpos} onChange={e => setEftpos(e.target.value)} className="bg-zinc-800 border-zinc-700 h-10" placeholder="0.00" data-testid="qm-eftpos" />
              </div>
            </div>
            <Button onClick={submit} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base" data-testid="qm-submit-btn">
              <Send className="w-5 h-5 mr-2" /> {saving ? "Saving..." : "Save Session"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickMode;
