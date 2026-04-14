import { toast } from "sonner";
import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Package, TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(v);

const RefillTrends = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/dashboard/refill-trends`)
      .then(r => setData(r.data))
      .catch(() => { toast.error('Failed to load data'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  const totalSpent = data.reduce((a, p) => a + p.total_spent, 0);
  const totalBought = data.reduce((a, p) => a + p.total_units_bought, 0);

  return (
    <div className="space-y-6" data-testid="refill-trends">
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Refill Cost Trends</h1>
        <p className="text-zinc-400 mt-2">Track supplier cost changes and purchasing patterns</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><DollarSign className="w-5 h-5 text-orange-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Total Spent</p><p className="text-xl font-bold font-heading text-orange-500">{fmt(totalSpent)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Package className="w-5 h-5 text-blue-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Units Purchased</p><p className="text-xl font-bold font-heading text-blue-500">{totalBought}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Products Tracked</p><p className="text-xl font-bold font-heading text-emerald-500">{data.length}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10"><TrendingDown className="w-5 h-5 text-purple-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">With History</p><p className="text-xl font-bold font-heading text-purple-500">{data.filter(d => d.cost_history.length > 0).length}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Cost Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Product Cost Overview</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Product</TableHead>
                  <TableHead className="text-zinc-400 text-right">Current Cost</TableHead>
                  <TableHead className="text-zinc-400 text-right">Avg Cost</TableHead>
                  <TableHead className="text-zinc-400 text-right">Cost Trend</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total Spent</TableHead>
                  <TableHead className="text-zinc-400 text-right">Units Bought</TableHead>
                  <TableHead className="text-zinc-400 text-right">Units Sold</TableHead>
                  <TableHead className="text-zinc-400 text-right">Revenue</TableHead>
                  <TableHead className="text-zinc-400 text-right">Purchase Records</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(p => (
                  <TableRow key={p.product_id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-200">{p.name}</span>
                        <span className="text-xs text-zinc-500">({p.code})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-200">{fmt(p.current_cost)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">{fmt(p.avg_cost)}</TableCell>
                    <TableCell className="text-right">
                      {p.cost_trend_pct !== 0 ? (
                        <Badge className={p.cost_trend_pct > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}>
                          {p.cost_trend_pct > 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                          {p.cost_trend_pct > 0 ? '+' : ''}{p.cost_trend_pct}%
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-800 text-zinc-500"><Minus className="w-3 h-3 inline mr-1" />Stable</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-orange-400">{fmt(p.total_spent)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{p.total_units_bought}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{p.lifetime_units_sold}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-500">{fmt(p.lifetime_revenue)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">{p.cost_history.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Purchase History per product */}
      {data.filter(p => p.cost_history.length > 0).map(p => (
        <Card key={p.product_id} className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-base font-heading text-zinc-50">{p.name} - Purchase History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Date</TableHead>
                  <TableHead className="text-zinc-400 text-right">Cost/Unit</TableHead>
                  <TableHead className="text-zinc-400 text-right">Units Added</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total Cost</TableHead>
                  <TableHead className="text-zinc-400">Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.cost_history.map((h, i) => (
                  <TableRow key={`${h.date}-${h.supplier}-${i}`} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-zinc-300">{h.date}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-200">{fmt(h.cost_per_unit)}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-500">+{h.units_added}</TableCell>
                    <TableCell className="text-right font-mono text-orange-400">{fmt(h.cost_per_unit * h.units_added)}</TableCell>
                    <TableCell className="text-zinc-400">{h.supplier || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {data.filter(p => p.cost_history.length > 0).length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center text-zinc-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No purchase history yet</p>
            <p className="text-sm mt-1">Record stock arrivals in the Inventory Tracker to build cost history</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RefillTrends;
