import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { getCogsBadgeClass, getStatusBadgeClass } from "../lib/chartUtils";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { TrendingUp, DollarSign, Package, ShoppingCart, Download } from "lucide-react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2
  }).format(value);
};

const SalesDashboard = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Calculate totals
  const totals = monthlyData.reduce((acc, m) => ({
    sales: acc.sales + m.sales,
    cogs: acc.cogs + m.cogs,
    profit: acc.profit + m.profit,
    units: acc.units + m.units
  }), { sales: 0, cogs: 0, profit: 0, units: 0 });

  return (
    <div className="space-y-6" data-testid="sales-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">
            Sales Dashboard
          </h1>
          <p className="text-zinc-400 mt-2">
            Track sales performance across markets and products
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 hover:bg-zinc-800"
            onClick={() => window.open(`${API}/export/sessions`, '_blank')}
            data-testid="export-sessions-btn"
          >
            <Download className="w-4 h-4 mr-1" /> Export Sessions
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 hover:bg-zinc-800"
            onClick={() => window.open(`${API}/export/products`, '_blank')}
            data-testid="export-products-btn"
          >
            <Download className="w-4 h-4 mr-1" /> Export Products
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <DollarSign className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Total Sales</p>
                <p className="text-xl font-bold font-heading text-zinc-50">
                  {formatCurrency(totals.sales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Total Profit</p>
                <p className="text-xl font-bold font-heading text-emerald-500">
                  {formatCurrency(totals.profit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Package className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Total COGS</p>
                <p className="text-xl font-bold font-heading text-red-400">
                  {formatCurrency(totals.cogs)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Units Sold</p>
                <p className="text-xl font-bold font-heading text-zinc-50">
                  {totals.units.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="bg-zinc-800 border border-zinc-700">
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
          <TabsTrigger value="sessions" data-testid="tab-sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales & Profit Trend */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg font-heading text-zinc-50">
                  Monthly Sales & Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#71717a"
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#71717a"
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                        tickFormatter={(v) => `$${v/1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          border: '1px solid #27272a',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [formatCurrency(value), '']}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        name="Sales"
                        stroke="#f97316" 
                        fill="url(#salesGradient)"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        name="Profit"
                        stroke="#10b981" 
                        fill="url(#profitGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Units & COGS Trend */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg font-heading text-zinc-50">
                  Units Sold & COGS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#71717a"
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#71717a"
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#71717a"
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          border: '1px solid #27272a',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="units" 
                        name="Units" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="cogs" 
                        name="COGS ($)" 
                        fill="#ef4444" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg font-heading text-zinc-50">
                Product Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Product</TableHead>
                      <TableHead className="text-zinc-400 text-right">Units Sold</TableHead>
                      <TableHead className="text-zinc-400 text-right">Revenue</TableHead>
                      <TableHead className="text-zinc-400 text-right">COGS</TableHead>
                      <TableHead className="text-zinc-400 text-right">Profit</TableHead>
                      <TableHead className="text-zinc-400 text-right">COGS %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productPerformance.map((product, idx) => (
                      <TableRow 
                        key={product.code} 
                        className="border-zinc-800 hover:bg-zinc-800/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                              ${idx === 0 ? 'bg-orange-500/20 text-orange-500' : 
                                idx === 1 ? 'bg-zinc-600/20 text-zinc-400' :
                                idx === 2 ? 'bg-amber-600/20 text-amber-600' :
                                'bg-zinc-800 text-zinc-500'}`}
                            >
                              #{idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-200">{product.name}</p>
                              <p className="text-xs text-zinc-500">{product.code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-zinc-300">
                          {product.units_sold.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-zinc-200">
                          {formatCurrency(product.revenue)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-400">
                          {formatCurrency(product.cogs)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-500">
                          {formatCurrency(product.profit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            className={
                              getCogsBadgeClass(product.cogs_percent)
                            }
                          >
                            {product.cogs_percent?.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg font-heading text-zinc-50">
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Session ID</TableHead>
                      <TableHead className="text-zinc-400">Date</TableHead>
                      <TableHead className="text-zinc-400">Market</TableHead>
                      <TableHead className="text-zinc-400 text-right">Units</TableHead>
                      <TableHead className="text-zinc-400 text-right">Sales</TableHead>
                      <TableHead className="text-zinc-400 text-right">COGS</TableHead>
                      <TableHead className="text-zinc-400 text-right">Profit</TableHead>
                      <TableHead className="text-zinc-400 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow 
                        key={session.id} 
                        className="border-zinc-800 hover:bg-zinc-800/50"
                      >
                        <TableCell className="font-mono text-zinc-400">
                          #{session.session_id}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {session.date}
                        </TableCell>
                        <TableCell className="text-zinc-200">
                          {session.market_name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-zinc-300">
                          {session.total_units}
                        </TableCell>
                        <TableCell className="text-right font-mono text-zinc-200">
                          {formatCurrency(session.calculated_sales)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-400">
                          {formatCurrency(session.total_cogs)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-500">
                          {formatCurrency(session.gross_profit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            className={
                              getStatusBadgeClass(session.status)
                            }
                          >
                            {session.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesDashboard;
