import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { Calendar, DollarSign, TrendingUp, Banknote, CreditCard } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(v);

const WeeklyControl = () => {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/dashboard/weekly-control`)
      .then(r => setWeeks(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  const totals = weeks.reduce((a, w) => ({
    sales: a.sales + w.sales, profit: a.profit + w.gross_profit,
    cogs: a.cogs + w.total_cogs, collected: a.collected + w.total_collected,
    expenses: a.expenses + w.expenses, net: a.net + w.net_profit
  }), { sales: 0, profit: 0, cogs: 0, collected: 0, expenses: 0, net: 0 });

  return (
    <div className="space-y-6" data-testid="weekly-control">
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Weekly Control</h1>
        <p className="text-zinc-400 mt-2">Week-by-week financial performance summary</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><DollarSign className="w-5 h-5 text-orange-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Total Sales</p><p className="text-xl font-bold font-heading text-orange-500">{fmt(totals.sales)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Net Profit</p><p className="text-xl font-bold font-heading text-emerald-500">{fmt(totals.net)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Banknote className="w-5 h-5 text-blue-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Total Collected</p><p className="text-xl font-bold font-heading text-blue-500">{fmt(totals.collected)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10"><Calendar className="w-5 h-5 text-purple-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Weeks Tracked</p><p className="text-xl font-bold font-heading text-purple-500">{weeks.length}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Weekly Sales & Profit Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="week" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                  <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => fmt(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" name="Sales" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} />
                  <Line type="monotone" dataKey="net_profit" name="Net Profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Cash vs EFTPOS Split</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="week" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                  <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => fmt(v)} />
                  <Legend />
                  <Bar dataKey="cash" name="Cash" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="eftpos" name="EFTPOS" fill="#3b82f6" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Weekly Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Week</TableHead>
                  <TableHead className="text-zinc-400">Dates</TableHead>
                  <TableHead className="text-zinc-400 text-right">Sessions</TableHead>
                  <TableHead className="text-zinc-400 text-right">Sales</TableHead>
                  <TableHead className="text-zinc-400 text-right">Cash</TableHead>
                  <TableHead className="text-zinc-400 text-right">EFTPOS</TableHead>
                  <TableHead className="text-zinc-400 text-right">COGS</TableHead>
                  <TableHead className="text-zinc-400 text-right">COGS %</TableHead>
                  <TableHead className="text-zinc-400 text-right">Gross Profit</TableHead>
                  <TableHead className="text-zinc-400 text-right">Expenses</TableHead>
                  <TableHead className="text-zinc-400 text-right">Net Profit</TableHead>
                  <TableHead className="text-zinc-400">Markets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeks.map(w => (
                  <TableRow key={w.week} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-mono text-zinc-200 font-semibold">{w.week}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{w.start_date} - {w.end_date}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{w.sessions}</TableCell>
                    <TableCell className="text-right font-mono text-orange-500">{fmt(w.sales)}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-400">{fmt(w.cash)}</TableCell>
                    <TableCell className="text-right font-mono text-blue-400">{fmt(w.eftpos)}</TableCell>
                    <TableCell className="text-right font-mono text-red-400">{fmt(w.total_cogs)}</TableCell>
                    <TableCell className="text-right"><Badge className={w.cogs_percent > 30 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}>{w.cogs_percent}%</Badge></TableCell>
                    <TableCell className="text-right font-mono text-emerald-500">{fmt(w.gross_profit)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">{fmt(w.expenses)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-emerald-500">{fmt(w.net_profit)}</TableCell>
                    <TableCell className="text-xs text-zinc-500 max-w-[150px] truncate">{w.markets?.join(', ')}</TableCell>
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

export default WeeklyControl;
