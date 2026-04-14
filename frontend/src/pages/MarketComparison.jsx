import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { MapPin, Trophy, TrendingUp, DollarSign, Users, Star } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(v);

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

const MarketComparison = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/dashboard/market-comparison`)
      .then(r => setData(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  // Radar chart data
  const maxSales = Math.max(...data.map(d => d.total_sales), 1);
  const maxProfit = Math.max(...data.map(d => d.total_profit), 1);
  const maxUnits = Math.max(...data.map(d => d.total_units), 1);
  const maxSessions = Math.max(...data.map(d => d.sessions), 1);
  const maxAvg = Math.max(...data.map(d => d.avg_session_revenue), 1);

  const radarData = [
    { metric: "Sales", ...Object.fromEntries(data.map(d => [d.market.replace(' Market', ''), Math.round(d.total_sales / maxSales * 100)])) },
    { metric: "Profit", ...Object.fromEntries(data.map(d => [d.market.replace(' Market', ''), Math.round(d.total_profit / maxProfit * 100)])) },
    { metric: "Units", ...Object.fromEntries(data.map(d => [d.market.replace(' Market', ''), Math.round(d.total_units / maxUnits * 100)])) },
    { metric: "Sessions", ...Object.fromEntries(data.map(d => [d.market.replace(' Market', ''), Math.round(d.sessions / maxSessions * 100)])) },
    { metric: "Avg Rev", ...Object.fromEntries(data.map(d => [d.market.replace(' Market', ''), Math.round(d.avg_session_revenue / maxAvg * 100)])) },
  ];

  return (
    <div className="space-y-6" data-testid="market-comparison">
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Market Comparison</h1>
        <p className="text-zinc-400 mt-2">Side-by-side market profitability analysis</p>
      </div>

      {/* Ranking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.slice(0, 4).map((m, idx) => (
          <Card key={m.market} className={`bg-zinc-900 border-zinc-800 ${idx === 0 ? 'border-orange-500/40 glow-orange' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {idx === 0 ? <Trophy className="w-5 h-5 text-orange-500" /> : <MapPin className="w-5 h-5 text-zinc-500" />}
                  <Badge className={idx === 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-800 text-zinc-400'}>
                    #{idx + 1}
                  </Badge>
                </div>
                <span className="text-xs text-zinc-500">{m.sessions} sessions</span>
              </div>
              <p className="font-heading font-bold text-zinc-50 text-lg">{m.market.replace(' Market', '')}</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Revenue</span><span className="font-mono text-orange-500">{fmt(m.total_sales)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Profit</span><span className="font-mono text-emerald-500">{fmt(m.total_profit)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Avg/Session</span><span className="font-mono text-zinc-200">{fmt(m.avg_session_revenue)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Margin</span><span className={`font-mono ${m.profit_margin > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{m.profit_margin.toFixed(1)}%</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Top Products</p>
                <div className="flex flex-wrap gap-1">
                  {m.top_products.map((tp, i) => (
                    <Badge key={tp.name} className="bg-zinc-800 text-zinc-300 text-xs">
                      {tp.name.split(' ')[0]} ({tp.units})
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Comparison */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Revenue & Profit by Market</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.map(d => ({ ...d, name: d.market.replace(' Market', '') }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => fmt(v)} />
                  <Legend />
                  <Bar dataKey="total_sales" name="Revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Market Performance Radar</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  {data.map((d, i) => (
                    <Radar key={d.market} name={d.market.replace(' Market', '')} dataKey={d.market.replace(' Market', '')} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Full Comparison</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Rank</TableHead>
                  <TableHead className="text-zinc-400">Market</TableHead>
                  <TableHead className="text-zinc-400 text-right">Sessions</TableHead>
                  <TableHead className="text-zinc-400 text-right">Revenue</TableHead>
                  <TableHead className="text-zinc-400 text-right">COGS</TableHead>
                  <TableHead className="text-zinc-400 text-right">Profit</TableHead>
                  <TableHead className="text-zinc-400 text-right">Avg/Session</TableHead>
                  <TableHead className="text-zinc-400 text-right">COGS %</TableHead>
                  <TableHead className="text-zinc-400 text-right">Margin</TableHead>
                  <TableHead className="text-zinc-400 text-right">Units</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((m, idx) => (
                  <TableRow key={m.market} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell><Badge className={idx === 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-800 text-zinc-400'}>#{idx + 1}</Badge></TableCell>
                    <TableCell className="font-medium text-zinc-200">{m.market}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{m.sessions}</TableCell>
                    <TableCell className="text-right font-mono text-orange-500">{fmt(m.total_sales)}</TableCell>
                    <TableCell className="text-right font-mono text-red-400">{fmt(m.total_cogs)}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-500">{fmt(m.total_profit)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-200">{fmt(m.avg_session_revenue)}</TableCell>
                    <TableCell className="text-right"><Badge className={m.cogs_percent > 30 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}>{m.cogs_percent}%</Badge></TableCell>
                    <TableCell className="text-right font-mono text-emerald-500">{m.profit_margin}%</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{m.total_units}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketComparison;
