import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, BarChart3 } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(v);

const HistoricalComparison = () => {
  const [data, setData] = useState({ week_over_week: [], month_over_month: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/dashboard/historical`)
      .then(r => setData(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  const wow = data.week_over_week || [];
  const mom = data.month_over_month || [];

  const latestWeek = wow[wow.length - 1];
  const prevWeek = wow[wow.length - 2];
  const latestMonth = mom[mom.length - 1];
  const prevMonth = mom[mom.length - 2];

  return (
    <div className="space-y-6" data-testid="historical-comparison">
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Historical Comparison</h1>
        <p className="text-zinc-400 mt-2">Week-over-week and month-over-month growth analysis</p>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase mb-1">Latest Week Sales</p>
            <p className="text-xl font-bold font-heading text-orange-500">{fmt(latestWeek?.sales || 0)}</p>
            {latestWeek && (
              <div className={`flex items-center gap-1 mt-1 text-sm ${latestWeek.growth_pct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {latestWeek.growth_pct >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {latestWeek.growth_pct >= 0 ? '+' : ''}{latestWeek.growth_pct}% WoW
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase mb-1">Previous Week</p>
            <p className="text-xl font-bold font-heading text-zinc-300">{fmt(prevWeek?.sales || 0)}</p>
            <p className="text-xs text-zinc-500 mt-1">{prevWeek?.period || '-'}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase mb-1">Latest Month Sales</p>
            <p className="text-xl font-bold font-heading text-blue-500">{fmt(latestMonth?.sales || 0)}</p>
            {latestMonth && (
              <div className={`flex items-center gap-1 mt-1 text-sm ${latestMonth.growth_pct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {latestMonth.growth_pct >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {latestMonth.growth_pct >= 0 ? '+' : ''}{latestMonth.growth_pct}% MoM
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase mb-1">Previous Month</p>
            <p className="text-xl font-bold font-heading text-zinc-300">{fmt(prevMonth?.sales || 0)}</p>
            <p className="text-xs text-zinc-500 mt-1">{prevMonth?.period || '-'}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wow" className="space-y-6">
        <TabsList className="bg-zinc-800 border border-zinc-700">
          <TabsTrigger value="wow" data-testid="tab-wow">Week over Week</TabsTrigger>
          <TabsTrigger value="mom" data-testid="tab-mom">Month over Month</TabsTrigger>
        </TabsList>

        <TabsContent value="wow" className="space-y-6">
          {/* WoW Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Weekly Sales Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wow}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="period" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => fmt(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="sales" name="Sales" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} />
                      <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Weekly Growth %</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wow}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="period" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `${v}%`} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => `${v}%`} />
                      <ReferenceLine y={0} stroke="#52525b" />
                      <Bar dataKey="growth_pct" name="Growth %" radius={[4, 4, 0, 0]}>
                        {wow.map((d, i) => (
                          <Cell key={i} fill={d.growth_pct >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* WoW Table */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Week</TableHead>
                    <TableHead className="text-zinc-400 text-right">Sales</TableHead>
                    <TableHead className="text-zinc-400 text-right">Profit</TableHead>
                    <TableHead className="text-zinc-400 text-right">COGS</TableHead>
                    <TableHead className="text-zinc-400 text-right">Units</TableHead>
                    <TableHead className="text-zinc-400 text-right">Sessions</TableHead>
                    <TableHead className="text-zinc-400 text-right">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wow.map(w => (
                    <TableRow key={w.period} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="font-mono text-zinc-200">{w.period}</TableCell>
                      <TableCell className="text-right font-mono text-orange-500">{fmt(w.sales)}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-500">{fmt(w.profit)}</TableCell>
                      <TableCell className="text-right font-mono text-red-400">{fmt(w.cogs)}</TableCell>
                      <TableCell className="text-right font-mono text-zinc-300">{w.units}</TableCell>
                      <TableCell className="text-right font-mono text-zinc-300">{w.sessions}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={w.growth_pct >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                          {w.growth_pct >= 0 ? '+' : ''}{w.growth_pct}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mom" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Monthly Sales Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mom}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="period" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                      <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => fmt(v)} />
                      <Legend />
                      <Bar dataKey="sales" name="Sales" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Monthly Growth %</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mom}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="period" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                      <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `${v}%`} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => `${v}%`} />
                      <ReferenceLine y={0} stroke="#52525b" />
                      <Bar dataKey="growth_pct" name="Growth %" radius={[4, 4, 0, 0]}>
                        {mom.map((d, i) => (
                          <Cell key={i} fill={d.growth_pct >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Month</TableHead>
                    <TableHead className="text-zinc-400 text-right">Sales</TableHead>
                    <TableHead className="text-zinc-400 text-right">Profit</TableHead>
                    <TableHead className="text-zinc-400 text-right">COGS</TableHead>
                    <TableHead className="text-zinc-400 text-right">Units</TableHead>
                    <TableHead className="text-zinc-400 text-right">Sessions</TableHead>
                    <TableHead className="text-zinc-400 text-right">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mom.map(m => (
                    <TableRow key={m.period} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="font-mono text-zinc-200">{m.period}</TableCell>
                      <TableCell className="text-right font-mono text-orange-500">{fmt(m.sales)}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-500">{fmt(m.profit)}</TableCell>
                      <TableCell className="text-right font-mono text-red-400">{fmt(m.cogs)}</TableCell>
                      <TableCell className="text-right font-mono text-zinc-300">{m.units}</TableCell>
                      <TableCell className="text-right font-mono text-zinc-300">{m.sessions}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={m.growth_pct >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                          {m.growth_pct >= 0 ? '+' : ''}{m.growth_pct}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoricalComparison;
