import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { getPctBadgeClass, BAR_RADIUS } from "../lib/chartUtils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Plus, Target, TrendingUp, PiggyBank, Shield } from "lucide-react";

const formatCurrency = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(v);

const CashflowTracker = () => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ month: "", sales_target: "", growth_saved: "", emergency_saved: "", notes: "" });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/cashflow`);
      setTargets(res.data);
    } catch (_e) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.month) { toast.error("Month is required (YYYY-MM)"); return; }
    try {
      await axios.post(`${API}/cashflow`, {
        month: form.month,
        sales_target: parseFloat(form.sales_target) || 0,
        growth_saved: parseFloat(form.growth_saved) || 0,
        emergency_saved: parseFloat(form.emergency_saved) || 0,
        notes: form.notes
      });
      toast.success("Target saved");
      setDialogOpen(false);
      setForm({ month: "", sales_target: "", growth_saved: "", emergency_saved: "", notes: "" });
      fetchData();
    } catch (e) { toast.error("Failed to save"); }
  };

  const handleDelete = async (month) => {
    if (!window.confirm("Delete this target?")) return;
    try {
      await axios.delete(`${API}/cashflow/${month}`);
      toast.success("Deleted");
      fetchData();
    } catch (_e) { toast.error("Failed to delete"); }
  };

  const openEdit = (target) => {
    setForm({
      month: target.month,
      sales_target: target.sales_target?.toString() || "",
      growth_saved: target.growth_saved?.toString() || "",
      emergency_saved: target.emergency_saved?.toString() || "",
      notes: target.notes || ""
    });
    setDialogOpen(true);
  };

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  // Summary calculations
  const totalTarget = targets.reduce((a, t) => a + (t.sales_target || 0), 0);
  const totalActual = targets.reduce((a, t) => a + (t.actual_sales || 0), 0);
  const totalGrowth = targets.reduce((a, t) => a + (t.growth_saved || 0), 0);
  const totalEmergency = targets.reduce((a, t) => a + (t.emergency_saved || 0), 0);

  // Chart data
  const chartData = targets.map(t => ({
    month: t.month,
    target: t.sales_target || 0,
    actual: t.actual_sales || 0,
  }));

  // Suggest next month
  const today = new Date();
  const nextMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="space-y-6" data-testid="cashflow-tracker">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Cashflow Tracker</h1>
          <p className="text-zinc-400 mt-2">Monthly targets, actuals, and savings goals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-target-btn">
              <Plus className="w-4 h-4 mr-2" /> Add Month Target
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-zinc-50 font-heading">Set Monthly Target</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Month (YYYY-MM) *</Label>
                <Input value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder={nextMonth} data-testid="cf-month-input" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Sales Target (NZD)</Label>
                <Input type="number" step="0.01" value={form.sales_target} onChange={e => setForm(f => ({ ...f, sales_target: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="5000" data-testid="cf-target-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Growth Saved</Label>
                  <Input type="number" step="0.01" value={form.growth_saved} onChange={e => setForm(f => ({ ...f, growth_saved: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Emergency Saved</Label>
                  <Input type="number" step="0.01" value={form.emergency_saved} onChange={e => setForm(f => ({ ...f, emergency_saved: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="e.g., Holiday rush expected" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                <Button onClick={handleSave} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="save-target-btn">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><Target className="w-5 h-5 text-orange-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Total Target</p>
                <p className="text-xl font-bold font-heading text-orange-500">{formatCurrency(totalTarget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Actual Sales</p>
                <p className="text-xl font-bold font-heading text-emerald-500">{formatCurrency(totalActual)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><PiggyBank className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Growth Fund</p>
                <p className="text-xl font-bold font-heading text-blue-500">{formatCurrency(totalGrowth)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10"><Shield className="w-5 h-5 text-purple-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Emergency Fund</p>
                <p className="text-xl font-bold font-heading text-purple-500">{formatCurrency(totalEmergency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target vs Actual Chart */}
      {chartData.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Target vs Actual Sales</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={v => formatCurrency(v)} />
                  <Bar dataKey="target" name="Target" fill="#f97316" opacity={0.4} radius={BAR_RADIUS} />
                  <Bar dataKey="actual" name="Actual" fill="#10b981" radius={BAR_RADIUS} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Monthly Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Month</TableHead>
                  <TableHead className="text-zinc-400 text-right">Target</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actual</TableHead>
                  <TableHead className="text-zinc-400 text-right">Variance</TableHead>
                  <TableHead className="text-zinc-400 text-center">Status</TableHead>
                  <TableHead className="text-zinc-400 text-right">Growth Saved</TableHead>
                  <TableHead className="text-zinc-400 text-right">Emergency</TableHead>
                  <TableHead className="text-zinc-400">Notes</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={9} className="text-center py-12 text-zinc-500">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No monthly targets set yet</p>
                    </TableCell>
                  </TableRow>
                ) : targets.map(t => {
                  const variance = (t.actual_sales || 0) - (t.sales_target || 0);
                  const pct = t.sales_target > 0 ? ((t.actual_sales || 0) / t.sales_target * 100) : 0;
                  return (
                    <TableRow key={t.month || t.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="font-mono text-zinc-200">{t.month}</TableCell>
                      <TableCell className="text-right font-mono text-orange-500">{formatCurrency(t.sales_target)}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-500">{formatCurrency(t.actual_sales || 0)}</TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={variance >= 0 ? 'text-emerald-500' : 'text-red-500'}>{formatCurrency(variance)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getPctBadgeClass(pct)}>
                          {pct.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-400">{formatCurrency(t.growth_saved || 0)}</TableCell>
                      <TableCell className="text-right font-mono text-purple-400">{formatCurrency(t.emergency_saved || 0)}</TableCell>
                      <TableCell className="text-zinc-500 text-xs max-w-[150px] truncate">{t.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(t)} className="text-zinc-400 hover:text-zinc-200" data-testid={`edit-cf-${t.month}`}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(t.month)} className="text-zinc-400 hover:text-red-500">Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashflowTracker;
