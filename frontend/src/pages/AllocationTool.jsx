import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { 
  Calculator, 
  PiggyBank, 
  TrendingUp, 
  Shield, 
  Wallet,
  DollarSign,
  Percent,
  Save
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2
  }).format(value);
};

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6'];

const AllocationTool = () => {
  const [settings, setSettings] = useState({
    owner_pay_percent: 30,
    growth_percent: 20,
    emergency_percent: 10,
    buffer_percent: 40,
    gst_rate: 15
  });
  const [weekSales, setWeekSales] = useState("");
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API}/allocation/settings`);
        setSettings(response.data);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const calculateAllocation = async () => {
    if (!weekSales || parseFloat(weekSales) <= 0) {
      toast.error("Please enter weekly sales amount");
      return;
    }

    setCalculating(true);
    try {
      const response = await axios.get(`${API}/allocation/calculate?week_sales=${weekSales}`);
      setAllocation(response.data);
    } catch (error) {
      console.error("Error calculating allocation:", error);
      toast.error("Failed to calculate allocation");
    } finally {
      setCalculating(false);
    }
  };

  const saveSettings = async () => {
    // Validate percentages sum to 100
    const total = settings.owner_pay_percent + settings.growth_percent + 
                  settings.emergency_percent + settings.buffer_percent;
    if (Math.abs(total - 100) > 0.1) {
      toast.error(`Allocation percentages must sum to 100% (currently ${total}%)`);
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API}/allocation/settings`, settings);
      toast.success("Settings saved");
      if (weekSales) {
        calculateAllocation();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePercentChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  const totalPercent = settings.owner_pay_percent + settings.growth_percent + 
                       settings.emergency_percent + settings.buffer_percent;

  const pieData = allocation ? [
    { name: 'Owner Pay', value: allocation.allocations.owner_pay, percent: settings.owner_pay_percent },
    { name: 'Growth/Savings', value: allocation.allocations.growth, percent: settings.growth_percent },
    { name: 'Emergency/Tax', value: allocation.allocations.emergency, percent: settings.emergency_percent },
    { name: 'Business Buffer', value: allocation.allocations.buffer, percent: settings.buffer_percent },
  ] : [];

  return (
    <div className="space-y-6" data-testid="allocation-tool">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">
          Profit Allocation Tool
        </h1>
        <p className="text-zinc-400 mt-2">
          Distribute weekly profits across business categories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
              <Percent className="w-5 h-5 mr-2 text-orange-500" />
              Allocation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GST Rate */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-zinc-400">GST Rate</Label>
                <span className="text-zinc-300 font-mono">{settings.gst_rate}%</span>
              </div>
              <Slider
                value={[settings.gst_rate]}
                onValueChange={([v]) => handlePercentChange('gst_rate', v)}
                max={20}
                min={0}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Profit Distribution (Must total 100%)
              </p>

              {/* Owner Pay */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-zinc-400 flex items-center">
                    <Wallet className="w-4 h-4 mr-2 text-orange-500" />
                    Owner Pay
                  </Label>
                  <span className="text-orange-500 font-mono font-bold">{settings.owner_pay_percent}%</span>
                </div>
                <Slider
                  value={[settings.owner_pay_percent]}
                  onValueChange={([v]) => handlePercentChange('owner_pay_percent', v)}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Growth */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-zinc-400 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" />
                    Growth / Savings
                  </Label>
                  <span className="text-emerald-500 font-mono font-bold">{settings.growth_percent}%</span>
                </div>
                <Slider
                  value={[settings.growth_percent]}
                  onValueChange={([v]) => handlePercentChange('growth_percent', v)}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Emergency */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-zinc-400 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-500" />
                    Emergency / Tax
                  </Label>
                  <span className="text-blue-500 font-mono font-bold">{settings.emergency_percent}%</span>
                </div>
                <Slider
                  value={[settings.emergency_percent]}
                  onValueChange={([v]) => handlePercentChange('emergency_percent', v)}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Buffer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-zinc-400 flex items-center">
                    <PiggyBank className="w-4 h-4 mr-2 text-purple-500" />
                    Business Buffer
                  </Label>
                  <span className="text-purple-500 font-mono font-bold">{settings.buffer_percent}%</span>
                </div>
                <Slider
                  value={[settings.buffer_percent]}
                  onValueChange={([v]) => handlePercentChange('buffer_percent', v)}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Total */}
              <div className={`p-3 rounded-lg ${totalPercent === 100 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <div className="flex justify-between">
                  <span className={totalPercent === 100 ? 'text-emerald-500' : 'text-red-500'}>Total</span>
                  <span className={`font-mono font-bold ${totalPercent === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {totalPercent}%
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={saveSettings}
              disabled={saving || totalPercent !== 100}
              className="w-full bg-orange-500 hover:bg-orange-600"
              data-testid="save-settings-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Calculator Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-orange-500" />
              Weekly Allocation Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sales Input */}
            <div className="space-y-2">
              <Label className="text-zinc-400">Weekly Sales (GST Inclusive)</Label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  step="0.01"
                  value={weekSales}
                  onChange={(e) => setWeekSales(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 flex-1"
                  placeholder="e.g., 2500.00"
                  data-testid="week-sales-input"
                />
                <Button
                  onClick={calculateAllocation}
                  disabled={calculating}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="calculate-btn"
                >
                  {calculating ? "..." : "Calculate"}
                </Button>
              </div>
            </div>

            {allocation && (
              <>
                {/* Breakdown */}
                <div className="space-y-3 border-t border-zinc-800 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Gross Sales</span>
                    <span className="font-mono text-zinc-200">{formatCurrency(allocation.week_sales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">GST ({settings.gst_rate}%)</span>
                    <span className="font-mono text-red-400">-{formatCurrency(allocation.gst_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Net Sales</span>
                    <span className="font-mono text-zinc-200">{formatCurrency(allocation.net_sales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Est. COGS</span>
                    <span className="font-mono text-red-400">-{formatCurrency(allocation.estimated_cogs)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-zinc-800 pt-2">
                    <span className="text-zinc-200">Gross Profit</span>
                    <span className="font-mono text-emerald-500">{formatCurrency(allocation.gross_profit)}</span>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={45}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
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
                </div>

                {/* Allocation Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-orange-500" />
                      <span className="text-xs text-orange-500 uppercase">Owner Pay</span>
                    </div>
                    <p className="text-xl font-bold font-heading text-orange-500">
                      {formatCurrency(allocation.allocations.owner_pay)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-emerald-500 uppercase">Growth</span>
                    </div>
                    <p className="text-xl font-bold font-heading text-emerald-500">
                      {formatCurrency(allocation.allocations.growth)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-blue-500 uppercase">Emergency</span>
                    </div>
                    <p className="text-xl font-bold font-heading text-blue-500">
                      {formatCurrency(allocation.allocations.emergency)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <PiggyBank className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-purple-500 uppercase">Buffer</span>
                    </div>
                    <p className="text-xl font-bold font-heading text-purple-500">
                      {formatCurrency(allocation.allocations.buffer)}
                    </p>
                  </div>
                </div>

                {/* Transfer Instructions */}
                <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                    Transfer Instructions
                  </p>
                  <div className="text-sm space-y-1">
                    <p className="text-zinc-300">
                      <span className="text-zinc-500">GST Account:</span> {formatCurrency(allocation.gst_amount)}
                    </p>
                    <p className="text-zinc-300">
                      <span className="text-zinc-500">Personal Account:</span> {formatCurrency(allocation.allocations.owner_pay)}
                    </p>
                    <p className="text-zinc-300">
                      <span className="text-zinc-500">Savings Account:</span> {formatCurrency(allocation.allocations.growth)}
                    </p>
                    <p className="text-zinc-300">
                      <span className="text-zinc-500">Emergency Fund:</span> {formatCurrency(allocation.allocations.emergency)}
                    </p>
                    <p className="text-zinc-300">
                      <span className="text-zinc-500">Leave in Business:</span> {formatCurrency(allocation.allocations.buffer)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllocationTool;
