import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Rocket, Target, DollarSign, TrendingUp, Calendar, ShoppingCart, Warehouse, ArrowRight } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(v);

const ScalePlanner = () => {
  const [targetRevenue, setTargetRevenue] = useState("3000");
  const [weeksHorizon, setWeeksHorizon] = useState(12);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    try {
      const res = await axios.get(`${API}/dashboard/scale-planner?target_weekly_revenue=${targetRevenue}&weeks_horizon=${weeksHorizon}`);
      setPlan(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlan(); }, []);

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  const chartData = plan ? [
    { name: 'Current', weekly: plan.current_weekly_avg, target: plan.target_weekly_revenue },
    { name: 'Target', weekly: plan.target_weekly_revenue, target: plan.target_weekly_revenue },
  ] : [];

  const projectionData = plan ? [
    { name: 'Revenue', value: plan.projections.gross_revenue },
    { name: 'Net Revenue', value: plan.projections.net_revenue },
    { name: 'COGS', value: plan.projections.total_cogs },
    { name: 'Profit', value: plan.projections.total_profit },
  ] : [];

  return (
    <div className="space-y-6" data-testid="scale-planner">
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Scale Planner</h1>
        <p className="text-zinc-400 mt-2">Plan your growth trajectory and capital requirements</p>
      </div>

      {/* Controls */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-400">Target Weekly Revenue (NZD)</Label>
              <Input type="number" value={targetRevenue} onChange={e => setTargetRevenue(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="3000" data-testid="scale-target-input" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Label className="text-zinc-400">Planning Horizon</Label>
                <span className="text-orange-500 font-mono font-bold">{weeksHorizon} weeks</span>
              </div>
              <Slider value={[weeksHorizon]} onValueChange={([v]) => setWeeksHorizon(v)} min={4} max={52} step={4} />
            </div>
            <Button onClick={fetchPlan} className="bg-orange-500 hover:bg-orange-600" data-testid="scale-calculate-btn">
              <Rocket className="w-4 h-4 mr-2" /> Calculate Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan && (
        <>
          {/* Growth Gap */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={`bg-zinc-900 border-zinc-800 ${plan.growth_needed_pct > 0 ? 'border-orange-500/30' : 'border-emerald-500/30'}`}>
              <CardContent className="p-5 text-center">
                <Target className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 uppercase">Growth Needed</p>
                <p className={`text-3xl font-bold font-heading mt-1 ${plan.growth_needed_pct > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                  {plan.growth_needed_pct > 0 ? '+' : ''}{plan.growth_needed_pct}%
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  {fmt(plan.current_weekly_avg)}/wk <ArrowRight className="w-3 h-3 inline mx-1" /> {fmt(plan.target_weekly_revenue)}/wk
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5 text-center">
                <ShoppingCart className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 uppercase">Sessions / Week</p>
                <p className="text-3xl font-bold font-heading text-blue-500 mt-1">
                  {plan.sessions_per_week_current} <ArrowRight className="w-5 h-5 inline mx-1 text-zinc-600" /> {Math.ceil(plan.sessions_per_week_needed)}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  At {fmt(plan.avg_session_revenue)} avg/session
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5 text-center">
                <Warehouse className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 uppercase">Weekly Stock Investment</p>
                <p className="text-3xl font-bold font-heading text-purple-500 mt-1">
                  {fmt(plan.investment.weekly_stock_investment)}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  @ {plan.avg_cogs_percent}% COGS rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Projection Chart */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">{weeksHorizon}-Week Financial Projection</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                    <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => fmt(v)} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {projectionData.map((d, i) => {
                        const fills = ['#f97316', '#3b82f6', '#ef4444', '#10b981'];
                        return <Cell key={`cell-${i}`} fill={fills[i]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Projections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Revenue Projections</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400">Gross Revenue ({weeksHorizon}w)</span>
                  <span className="font-mono text-orange-500 text-lg font-bold">{fmt(plan.projections.gross_revenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400">Less GST</span>
                  <span className="font-mono text-red-400">-{fmt(plan.projections.gross_revenue - plan.projections.net_revenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400">Net Revenue</span>
                  <span className="font-mono text-blue-500 text-lg font-bold">{fmt(plan.projections.net_revenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400">Estimated COGS ({plan.avg_cogs_percent}%)</span>
                  <span className="font-mono text-red-400">-{fmt(plan.projections.total_cogs)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <span className="text-emerald-500 font-semibold">Projected Profit</span>
                  <span className="font-mono text-emerald-500 text-xl font-bold">{fmt(plan.projections.total_profit)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Investment Requirements</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400">Current Stock Value</span>
                  <span className="font-mono text-zinc-200">{fmt(plan.investment.current_stock_value)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400">Weekly Stock Needed</span>
                  <span className="font-mono text-purple-500">{fmt(plan.investment.weekly_stock_investment)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <span className="text-purple-500 font-semibold">Total Stock ({weeksHorizon}w)</span>
                  <span className="font-mono text-purple-500 text-xl font-bold">{fmt(plan.investment.total_stock_investment)}</span>
                </div>
                <div className="border-t border-zinc-800 pt-4 space-y-2">
                  <p className="text-xs text-zinc-500 uppercase font-semibold">Current Performance</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Active Weeks</span>
                    <span className="font-mono text-zinc-300">{plan.weeks_active}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total Sessions</span>
                    <span className="font-mono text-zinc-300">{plan.total_sessions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Avg Session Revenue</span>
                    <span className="font-mono text-zinc-300">{fmt(plan.avg_session_revenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ScalePlanner;
