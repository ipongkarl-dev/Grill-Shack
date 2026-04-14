import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ClipboardCheck, Download, Printer, Package, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(v);

const PrepChecklist = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState("");
  const [targetRevenue, setTargetRevenue] = useState("1000");
  const [checkedItems, setCheckedItems] = useState({});

  const fetchChecklist = useCallback(async () => {
    try {
      const params = new URLSearchParams({ target_revenue: targetRevenue });
      if (selectedMarket && selectedMarket !== "all") params.append("market_id", selectedMarket);
      const res = await axios.get(`${API}/prep-checklist?${params}`);
      setData(res.data);
      const initial = {};
      res.data.checklist.forEach(item => { initial[item.product_id] = item.to_prep === 0; });
      setCheckedItems(initial);
    } catch (_e) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

  const toggleCheck = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = data?.checklist?.length || 0;
  const progress = totalCount > 0 ? (checkedCount / totalCount * 100) : 0;

  const handlePrint = () => { window.print(); };

  const handleExport = () => {
    const params = new URLSearchParams({ target_revenue: targetRevenue });
    if (selectedMarket && selectedMarket !== "all") params.append("market_id", selectedMarket);
    window.open(`${API}/export/prep-checklist?${params}`, '_blank');
  };

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  const prepItems = data?.checklist?.filter(i => i.to_prep > 0) || [];
  const readyItems = data?.checklist?.filter(i => i.to_prep === 0) || [];

  return (
    <div className="space-y-6" data-testid="prep-checklist">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Daily Prep Checklist</h1>
          <p className="text-zinc-400 mt-2">Auto-generated from stock planner recommendations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="border-zinc-700 hover:bg-zinc-800" data-testid="print-btn">
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="border-zinc-700 hover:bg-zinc-800" data-testid="export-prep-btn">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="bg-zinc-900 border-zinc-800 print:hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-400">Market</Label>
              <Select value={selectedMarket || "all"} onValueChange={(v) => setSelectedMarket(v === "all" ? "" : v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="prep-market-select">
                  <SelectValue placeholder="All Markets" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">All Markets</SelectItem>
                  {data?.markets?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-400">Target Revenue (NZD)</Label>
              <Input type="number" value={targetRevenue} onChange={e => setTargetRevenue(e.target.value)} className="bg-zinc-800 border-zinc-700" data-testid="prep-revenue-input" />
            </div>
            <Button onClick={fetchChecklist} className="bg-orange-500 hover:bg-orange-600" data-testid="prep-generate-btn">
              <ClipboardCheck className="w-4 h-4 mr-2" /> Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Prep Progress</span>
            <span className="text-sm font-mono text-zinc-200">{checkedCount}/{totalCount} items</span>
          </div>
          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-orange-500 to-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <p className="text-xs text-zinc-500 uppercase">To Prep</p>
            <p className="text-2xl font-bold font-heading text-red-500">{data?.total_items_to_prep || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs text-zinc-500 uppercase">Ready</p>
            <p className="text-2xl font-bold font-heading text-emerald-500">{readyItems.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-zinc-500 uppercase">Est. Cost</p>
            <p className="text-2xl font-bold font-heading text-orange-500">{fmt(data?.total_estimated_cost || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Print Header (only visible on print) */}
      <div className="hidden print:block mb-4">
        <h2 className="text-2xl font-bold">GRILL SHACK - Daily Prep Checklist</h2>
        <p>Market: {data?.market_name} | Date: {data?.date} | Target: {fmt(parseFloat(targetRevenue))}</p>
      </div>

      {/* Items to Prep */}
      {prepItems.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Items to Prep ({prepItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {prepItems.map(item => (
              <div
                key={item.product_id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                  checkedItems[item.product_id]
                    ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60'
                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <Checkbox
                  checked={checkedItems[item.product_id] || false}
                  onCheckedChange={() => toggleCheck(item.product_id)}
                  className="border-zinc-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  data-testid={`check-${item.code}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${checkedItems[item.product_id] ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {item.product_name}
                    </span>
                    <Badge className="bg-zinc-700 text-zinc-300 text-xs">{item.code}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Est. orders: {item.estimated_orders} | In stock: {item.current_stock}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-heading text-red-500">+{item.to_prep}</p>
                  <p className="text-xs text-zinc-500">{fmt(item.estimated_cost)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ready Items */}
      {readyItems.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" /> Already Covered ({readyItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {readyItems.map(item => (
              <div
                key={item.product_id}
                className="flex items-center gap-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
              >
                <Checkbox
                  checked={checkedItems[item.product_id] || false}
                  onCheckedChange={() => toggleCheck(item.product_id)}
                  className="border-emerald-600 data-[state=checked]:bg-emerald-500"
                  data-testid={`check-${item.code}`}
                />
                <div className="flex-1">
                  <span className="text-zinc-300">{item.product_name}</span>
                  <Badge className="ml-2 bg-zinc-700 text-zinc-400 text-xs">{item.code}</Badge>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-500/10 text-emerald-500">Stock: {item.current_stock}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PrepChecklist;
