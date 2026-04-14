import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { Users, Trophy, TrendingUp, DollarSign, ShoppingCart, Star, MapPin } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(v);
const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

const StaffPerformance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/dashboard/staff-performance`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  const totalSales = data.reduce((a, s) => a + s.total_sales, 0);
  const totalSessions = data.reduce((a, s) => a + s.sessions, 0);
  const topPerformer = data[0];

  // Chart data
  const barData = data.filter(d => d.name !== 'System (Seeded)').map(d => ({
    name: d.name.split(' ')[0],
    sales: d.total_sales,
    profit: d.total_profit,
    sessions: d.sessions
  }));

  const pieData = data.filter(d => d.total_sales > 0).map(d => ({
    name: d.name,
    value: d.total_sales
  }));

  return (
    <div className="space-y-6" data-testid="staff-performance">
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Staff Performance</h1>
        <p className="text-zinc-400 mt-2">Track sales performance per team member across markets</p>
      </div>

      {/* Top Performer Highlight */}
      {topPerformer && (
        <Card className="bg-zinc-900 border-zinc-800 border-orange-500/30 glow-orange">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xl font-heading font-bold text-zinc-50">{topPerformer.name}</p>
                  <Badge className="bg-orange-500/10 text-orange-500">Top Performer</Badge>
                  <Badge className="bg-zinc-800 text-zinc-400 capitalize">{topPerformer.role}</Badge>
                </div>
                <div className="flex gap-6 mt-2 text-sm">
                  <div><span className="text-zinc-500">Revenue: </span><span className="font-mono text-orange-500">{fmt(topPerformer.total_sales)}</span></div>
                  <div><span className="text-zinc-500">Profit: </span><span className="font-mono text-emerald-500">{fmt(topPerformer.total_profit)}</span></div>
                  <div><span className="text-zinc-500">Sessions: </span><span className="font-mono text-zinc-200">{topPerformer.sessions}</span></div>
                  <div><span className="text-zinc-500">Best session: </span><span className="font-mono text-zinc-200">{fmt(topPerformer.best_session_sales)}</span></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Users className="w-5 h-5 text-blue-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Team Members</p><p className="text-xl font-bold font-heading text-blue-500">{data.length}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><DollarSign className="w-5 h-5 text-orange-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Total Team Sales</p><p className="text-xl font-bold font-heading text-orange-500">{fmt(totalSales)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><ShoppingCart className="w-5 h-5 text-emerald-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Total Sessions</p><p className="text-xl font-bold font-heading text-emerald-500">{totalSessions}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10"><Star className="w-5 h-5 text-purple-500" /></div>
              <div><p className="text-xs text-zinc-500 uppercase">Best Single Session</p><p className="text-xl font-bold font-heading text-purple-500">{fmt(topPerformer?.best_session_sales || 0)}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Sales by Team Member</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => fmt(v)} />
                  <Legend />
                  <Bar dataKey="sales" name="Revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Revenue Share</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                    {pieData.map((_, i) => <Cell key={`pie-${pieData[i]?.name || i}`} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-1/2 space-y-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-zinc-300">{d.name}</span>
                    </div>
                    <span className="font-mono text-zinc-400">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Performance Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Rank</TableHead>
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Role</TableHead>
                  <TableHead className="text-zinc-400 text-right">Sessions</TableHead>
                  <TableHead className="text-zinc-400 text-right">Revenue</TableHead>
                  <TableHead className="text-zinc-400 text-right">Profit</TableHead>
                  <TableHead className="text-zinc-400 text-right">Avg/Session</TableHead>
                  <TableHead className="text-zinc-400 text-right">Units</TableHead>
                  <TableHead className="text-zinc-400 text-right">COGS %</TableHead>
                  <TableHead className="text-zinc-400 text-right">Best Session</TableHead>
                  <TableHead className="text-zinc-400">Markets</TableHead>
                  <TableHead className="text-zinc-400">Active Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s, idx) => (
                  <TableRow key={s.user_id || idx} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell>
                      <Badge className={idx === 0 ? 'bg-orange-500/10 text-orange-500' : idx === 1 ? 'bg-zinc-600/20 text-zinc-300' : 'bg-zinc-800 text-zinc-500'}>
                        #{idx + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-200">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge className="bg-zinc-800 text-zinc-400 capitalize">{s.role}</Badge></TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{s.sessions}</TableCell>
                    <TableCell className="text-right font-mono text-orange-500">{fmt(s.total_sales)}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-500">{fmt(s.total_profit)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-200">{fmt(s.avg_session_revenue)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{s.total_units}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={s.cogs_percent > 30 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}>
                        {s.cogs_percent}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-purple-400">{fmt(s.best_session_sales)}</TableCell>
                    <TableCell className="text-xs text-zinc-500 max-w-[120px]">
                      {s.markets_worked?.map(m => m.replace(' Market', '')).join(', ')}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {s.first_session && s.last_session ? `${s.first_session} - ${s.last_session}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4 text-center text-sm text-zinc-500">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>New sessions recorded via Session Input or Quick Mode are automatically attributed to the logged-in user.</p>
          <p className="mt-1">Historical sessions imported from Excel are shown as "System (Seeded)".</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPerformance;
