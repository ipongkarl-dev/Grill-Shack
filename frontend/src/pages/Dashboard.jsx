import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { BAR_RADIUS } from "../lib/chartUtils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from "lucide-react";
import { DashboardCalendar } from "../components/DashboardCalendar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2
  }).format(value);
};

const KPICard = ({ title, value, icon: Icon, trend, trendValue, color = "orange" }) => {
  const colors = {
    orange: "text-orange-500",
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    purple: "text-purple-500",
    cyan: "text-cyan-500"
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 card-hover">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg bg-zinc-800 ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="kpi-label">{title}</p>
        </div>
        <p className={`kpi-value ${colors[color]}`}>{value}</p>
        {trend && (
          <div className="flex items-center mt-2 text-sm">
            {trend === "up" ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={trend === "up" ? "text-emerald-500" : "text-red-500"}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CHART_COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
      try {
        const [kpiRes, monthlyRes] = await Promise.all([
          axios.get(`${API}/dashboard/kpis`),
          axios.get(`${API}/dashboard/sales-by-month`)
        ]);
        setKpis(kpiRes.data);
        setMonthlyData(monthlyRes.data);
      } catch (_err) {
        toast.error("Failed to load dashboard data");
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={`skeleton-${i}`} className="h-32 bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const marketData = kpis?.market_sales 
    ? Object.entries(kpis.market_sales).map(([name, data]) => ({
        name: name.replace(' Market', ''),
        sales: data.sales,
        sessions: data.sessions
      }))
    : [];

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">
          Operations Dashboard
        </h1>
        <p className="text-zinc-400 mt-2">
          Real-time overview of Grill Shack performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total Sales"
          value={formatCurrency(kpis?.total_sales || 0)}
          icon={DollarSign}
          color="orange"
        />
        <KPICard
          title="Gross Profit"
          value={formatCurrency(kpis?.total_profit || 0)}
          icon={TrendingUp}
          color="emerald"
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(kpis?.net_profit || 0)}
          icon={Wallet}
          color="cyan"
        />
        <KPICard
          title="Avg COGS %"
          value={`${(kpis?.avg_cogs_percent || 0).toFixed(1)}%`}
          icon={Package}
          color="blue"
        />
        <KPICard
          title="Total Sessions"
          value={kpis?.session_count || 0}
          icon={ShoppingCart}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50">
              Monthly Sales Performance
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
                  <Bar dataKey="sales" name="Sales" fill="#f97316" radius={BAR_RADIUS} />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" radius={BAR_RADIUS} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Market Performance Pie */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50">
              Sales by Market
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={marketData}
                    dataKey="sales"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                  >
                    {marketData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-1/2 space-y-2">
                {marketData.map((market, index) => (
                  <div key={market.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-zinc-300">{market.name}</span>
                    </div>
                    <span className="text-zinc-400 font-mono">{formatCurrency(market.sales)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50">
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis?.recent_sessions?.slice(0, 5).map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div>
                    <p className="font-medium text-zinc-200">{session.market_name}</p>
                    <p className="text-sm text-zinc-500">{session.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-zinc-200">
                      {formatCurrency(session.calculated_sales)}
                    </p>
                    <Badge 
                      variant={session.status === 'OK' ? 'default' : 'destructive'}
                      className={session.status === 'OK' ? 'bg-emerald-500/10 text-emerald-500' : ''}
                    >
                      {session.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpis?.low_stock_products?.length > 0 ? (
              <div className="space-y-3">
                {kpis.low_stock_products.map((product) => (
                  <Link 
                    key={product.id}
                    to="/inventory"
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200"
                    data-testid={`low-stock-${product.code}`}
                  >
                    <div>
                      <p className="font-medium text-zinc-200">{product.name}</p>
                      <p className="text-sm text-zinc-500">Code: {product.code}</p>
                      <p className="text-xs text-orange-500 mt-1">Click to restock</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium text-amber-500">
                        {product.current_stock} units
                      </p>
                      <p className="text-xs text-zinc-500">
                        Reorder at: {product.reorder_point}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>All stock levels are healthy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <DashboardCalendar />
    </div>
  );
};

export default Dashboard;
