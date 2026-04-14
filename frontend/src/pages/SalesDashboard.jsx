import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { SalesTrendChart, ProductPerformanceTable, SessionsTable } from "../components/SalesWidgets";
import { formatCurrency } from "../lib/chartUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign, Package, ShoppingCart, Download } from "lucide-react";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, CHART_GRID_STROKE, CHART_AXIS_STROKE } from "../lib/chartUtils";

const KpiCard = ({ icon: Icon, label, value, color }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}-500/10`}><Icon className={`w-5 h-5 text-${color}-500`} /></div>
        <div>
          <p className="text-xs text-zinc-500 uppercase">{label}</p>
          <p className={`text-xl font-bold font-heading text-${color === 'zinc' ? 'zinc-50' : color + '-500'}`}>{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const UnitsCogsChart = ({ data }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardContent className="pt-6">
      <p className="text-lg font-heading text-zinc-50 mb-4">Units Sold &amp; COGS</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
            <XAxis dataKey="month" stroke={CHART_AXIS_STROKE} tick={CHART_AXIS_TICK} />
            <YAxis yAxisId="left" stroke={CHART_AXIS_STROKE} tick={CHART_AXIS_TICK} />
            <YAxis yAxisId="right" orientation="right" stroke={CHART_AXIS_STROKE} tick={CHART_AXIS_TICK} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Legend />
            <Bar yAxisId="left" dataKey="units" name="Units" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="cogs" name="COGS ($)" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const SalesDashboard = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [monthlyRes, productRes, sessionsRes] = await Promise.all([
        axios.get(`${API}/dashboard/sales-by-month`),
        axios.get(`${API}/dashboard/product-performance`),
        axios.get(`${API}/sessions?limit=50`)
      ]);
      setMonthlyData(monthlyRes.data);
      setProductPerformance(productRes.data);
      setSessions(sessionsRes.data);
    } catch (_err) {
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
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

  const totals = monthlyData.reduce((acc, m) => ({
    sales: acc.sales + m.sales, cogs: acc.cogs + m.cogs,
    profit: acc.profit + m.profit, units: acc.units + m.units
  }), { sales: 0, cogs: 0, profit: 0, units: 0 });

  return (
    <div className="space-y-6" data-testid="sales-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Sales Dashboard</h1>
          <p className="text-zinc-400 mt-2">Track sales performance across markets and products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800" onClick={() => window.open(`${API}/export/sessions`, '_blank')} data-testid="export-sessions-btn">
            <Download className="w-4 h-4 mr-1" /> Export Sessions
          </Button>
          <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800" onClick={() => window.open(`${API}/export/products`, '_blank')} data-testid="export-products-btn">
            <Download className="w-4 h-4 mr-1" /> Export Products
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Total Sales" value={formatCurrency(totals.sales)} color="orange" />
        <KpiCard icon={TrendingUp} label="Total Profit" value={formatCurrency(totals.profit)} color="emerald" />
        <KpiCard icon={Package} label="Total COGS" value={formatCurrency(totals.cogs)} color="red" />
        <KpiCard icon={ShoppingCart} label="Units Sold" value={totals.units.toLocaleString()} color="blue" />
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="bg-zinc-800 border border-zinc-700">
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
          <TabsTrigger value="sessions" data-testid="tab-sessions">Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesTrendChart data={monthlyData} />
            <UnitsCogsChart data={monthlyData} />
          </div>
        </TabsContent>
        <TabsContent value="products"><ProductPerformanceTable products={productPerformance} /></TabsContent>
        <TabsContent value="sessions"><SessionsTable sessions={sessions} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesDashboard;
