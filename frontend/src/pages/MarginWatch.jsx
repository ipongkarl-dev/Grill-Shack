import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { getCogsBadgeClass, getCogsChartColor, getProfitChartColor, getActionLink, BAR_RADIUS_HORIZONTAL } from "../lib/chartUtils";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Zap, Eye, DollarSign } from "lucide-react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2
  }).format(value);
};

const getActionColor = (action) => {
  switch (action) {
    case 'PUSH HARD': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'CHECK PRICE': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'PROMOTE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
};

const getActionIcon = (action) => {
  switch (action) {
    case 'PUSH HARD': return <Zap className="w-3 h-3" />;
    case 'CHECK PRICE': return <AlertTriangle className="w-3 h-3" />;
    case 'PROMOTE': return <Eye className="w-3 h-3" />;
    default: return null;
  }
};

const MarginWatch = () => {
  const [marginData, setMarginData] = useState([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchData = useCallback(async () => {
      try {
        const response = await axios.get(`${API}/dashboard/margin-watch`);
        setMarginData(response.data);
      } catch (_err) {
        toast.error("Failed to load margin data");
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

  // Summary stats
  const pushHardItems = marginData.filter(p => p.action === 'PUSH HARD');
  const checkPriceItems = marginData.filter(p => p.action === 'CHECK PRICE');
  const promoteItems = marginData.filter(p => p.action === 'PROMOTE');
  const avgCogs = marginData.reduce((acc, p) => acc + p.cogs_percent, 0) / marginData.length;
  const totalProfit = marginData.reduce((acc, p) => acc + p.lifetime_profit, 0);

  // Chart data - profit per product
  const chartData = marginData
    .sort((a, b) => b.lifetime_profit - a.lifetime_profit)
    .map(p => ({
      name: p.code,
      profit: p.lifetime_profit,
      cogs: p.cogs_percent
    }));

  return (
    <div className="space-y-6" data-testid="margin-watch">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">
          Margin Watch
        </h1>
        <p className="text-zinc-400 mt-2">
          Analyze product profitability and get strategic recommendations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Total Profit</p>
                <p className="text-xl font-bold font-heading text-emerald-500">
                  {formatCurrency(totalProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <DollarSign className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Avg COGS %</p>
                <p className="text-xl font-bold font-heading text-orange-500">
                  {avgCogs.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Push Hard</p>
                <p className="text-xl font-bold font-heading text-emerald-500">
                  {pushHardItems.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Check Price</p>
                <p className="text-xl font-bold font-heading text-red-500">
                  {checkPriceItems.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Promote</p>
                <p className="text-xl font-bold font-heading text-blue-500">
                  {promoteItems.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Chart */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50">
              Lifetime Profit by Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis 
                    type="number"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Profit']}
                  />
                  <Bar dataKey="profit" radius={BAR_RADIUS_HORIZONTAL}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getProfitChartColor(entry.profit)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* COGS Chart */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50">
              COGS % by Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marginData.sort((a, b) => b.cogs_percent - a.cogs_percent)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis 
                    type="number"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 50]}
                  />
                  <YAxis 
                    type="category"
                    dataKey="code"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value.toFixed(1)}%`, 'COGS']}
                  />
                  <Bar dataKey="cogs_percent" radius={BAR_RADIUS_HORIZONTAL}>
                    {marginData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getCogsChartColor(entry.cogs_percent)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-zinc-50">
            Menu Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Product</TableHead>
                  <TableHead className="text-zinc-400 text-right">Price</TableHead>
                  <TableHead className="text-zinc-400 text-right">Unit Cost</TableHead>
                  <TableHead className="text-zinc-400 text-right">COGS %</TableHead>
                  <TableHead className="text-zinc-400 text-right">Profit/Unit</TableHead>
                  <TableHead className="text-zinc-400 text-right">Lifetime Units</TableHead>
                  <TableHead className="text-zinc-400 text-right">Lifetime Revenue</TableHead>
                  <TableHead className="text-zinc-400 text-right">Lifetime Profit</TableHead>
                  <TableHead className="text-zinc-400 text-center">Stock</TableHead>
                  <TableHead className="text-zinc-400 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marginData.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className="border-zinc-800 hover:bg-zinc-800/50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-zinc-200">{product.name}</p>
                        <p className="text-xs text-zinc-500">{product.code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-200">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">
                      {formatCurrency(product.unit_cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        className={
                          getCogsBadgeClass(product.cogs_percent)
                        }
                      >
                        {product.cogs_percent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-500">
                      {formatCurrency(product.profit_per_order)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {product.lifetime_units.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-200">
                      {formatCurrency(product.lifetime_revenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-500">
                      {formatCurrency(product.lifetime_profit)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-zinc-300">
                      {product.current_stock <= 10 ? (
                        <Link to="/inventory" className="text-amber-500 hover:text-amber-400 underline underline-offset-2">
                          {product.current_stock}
                        </Link>
                      ) : product.current_stock}
                    </TableCell>
                    <TableCell className="text-center">
                      <Link
                        to={getActionLink(product.action)}
                        data-testid={`action-${product.code}`}
                      >
                        <Badge className={`border cursor-pointer hover:opacity-80 transition-opacity ${getActionColor(product.action)}`}>
                          {getActionIcon(product.action)}
                          <span className="ml-1">{product.action}</span>
                        </Badge>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Guide */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-zinc-50">
            Action Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-emerald-500">PUSH HARD</span>
              </div>
              <p className="text-sm text-zinc-400">
                High-profit items with good sales volume. Promote these actively, place prominently on menu, 
                and consider bundling with other items.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-red-500">CHECK PRICE</span>
              </div>
              <p className="text-sm text-zinc-400">
                COGS exceeds 35%. Consider raising prices, reducing portion size, finding cheaper suppliers, 
                or removing from menu if margins can't improve.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-blue-500">PROMOTE</span>
              </div>
              <p className="text-sm text-zinc-400">
                Low sales volume. These items need more visibility. Try special promotions, taste samples, 
                or featured placement to boost awareness.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarginWatch;
