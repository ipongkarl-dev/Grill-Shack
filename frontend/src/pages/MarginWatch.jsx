import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, AlertTriangle, Zap, Eye, DollarSign } from "lucide-react";
import { ProfitChart, CogsChart } from "../components/MarginCharts";
import { MarginTable } from "../components/MarginTable";

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(value);

const MarginWatch = () => {
  const [marginData, setMarginData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
      try {
        const response = await axios.get(`${API}/dashboard/margin-watch`);
        setMarginData(response.data);
      } catch (_err) {
        toast.error("Failed to load margin data");
      } finally {
        setLoading(false);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only module-level imports (API, axios, toast) and stable state setters used
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  const pushHardItems = marginData.filter(p => p.action === 'PUSH HARD');
  const checkPriceItems = marginData.filter(p => p.action === 'CHECK PRICE');
  const promoteItems = marginData.filter(p => p.action === 'PROMOTE');
  const avgCogs = marginData.reduce((acc, p) => acc + p.cogs_percent, 0) / marginData.length;
  const totalProfit = marginData.reduce((acc, p) => acc + p.lifetime_profit, 0);

  const chartData = [...marginData]
    .sort((a, b) => b.lifetime_profit - a.lifetime_profit)
    .map(p => ({ name: p.code, profit: p.lifetime_profit, cogs: p.cogs_percent }));

  return (
    <div className="space-y-6" data-testid="margin-watch">
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Margin Watch</h1>
        <p className="text-zinc-400 mt-2">Analyze product profitability and get strategic recommendations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Total Profit</p>
                <p className="text-xl font-bold font-heading text-emerald-500">{formatCurrency(totalProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><DollarSign className="w-5 h-5 text-orange-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Avg COGS %</p>
                <p className="text-xl font-bold font-heading text-orange-500">{avgCogs.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><Zap className="w-5 h-5 text-emerald-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Push Hard</p>
                <p className="text-xl font-bold font-heading text-emerald-500">{pushHardItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Check Price</p>
                <p className="text-xl font-bold font-heading text-red-500">{checkPriceItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Eye className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Promote</p>
                <p className="text-xl font-bold font-heading text-blue-500">{promoteItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfitChart chartData={chartData} />
        <CogsChart marginData={marginData} />
      </div>

      {/* Detail Table */}
      <MarginTable marginData={marginData} />

      {/* Action Guide */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-zinc-50">Action Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-emerald-500">PUSH HARD</span>
              </div>
              <p className="text-sm text-zinc-400">
                High-profit items with good sales volume. Promote these actively, place prominently on menu, and consider bundling with other items.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-red-500">CHECK PRICE</span>
              </div>
              <p className="text-sm text-zinc-400">
                COGS exceeds 35%. Consider raising prices, reducing portion size, finding cheaper suppliers, or removing from menu if margins can't improve.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-blue-500">PROMOTE</span>
              </div>
              <p className="text-sm text-zinc-400">
                Low sales volume. These items need more visibility. Try special promotions, taste samples, or featured placement to boost awareness.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarginWatch;
