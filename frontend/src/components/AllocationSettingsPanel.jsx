import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Percent, Save, Wallet, TrendingUp, Shield, PiggyBank } from "lucide-react";

export const AllocationSettingsPanel = ({ settings, onPercentChange, onSave, saving, totalPercent }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader>
      <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
        <Percent className="w-5 h-5 mr-2 text-orange-500" /> Allocation Settings
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-zinc-400">GST Rate</Label>
          <span className="text-zinc-300 font-mono">{settings.gst_rate}%</span>
        </div>
        <Slider value={[settings.gst_rate]} onValueChange={([v]) => onPercentChange('gst_rate', v)} max={20} min={0} step={0.5} className="w-full" />
      </div>

      <div className="border-t border-zinc-800 pt-4 space-y-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Profit Distribution (Must total 100%)</p>
        <SliderRow icon={Wallet} label="Owner Pay" value={settings.owner_pay_percent} onChange={(v) => onPercentChange('owner_pay_percent', v)} color="text-orange-500" />
        <SliderRow icon={TrendingUp} label="Growth / Savings" value={settings.growth_percent} onChange={(v) => onPercentChange('growth_percent', v)} color="text-emerald-500" />
        <SliderRow icon={Shield} label="Emergency / Tax" value={settings.emergency_percent} onChange={(v) => onPercentChange('emergency_percent', v)} color="text-blue-500" />
        <SliderRow icon={PiggyBank} label="Business Buffer" value={settings.buffer_percent} onChange={(v) => onPercentChange('buffer_percent', v)} color="text-purple-500" />

        <div className={`p-3 rounded-lg ${totalPercent === 100 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <div className="flex justify-between">
            <span className={totalPercent === 100 ? 'text-emerald-500' : 'text-red-500'}>Total</span>
            <span className={`font-mono font-bold ${totalPercent === 100 ? 'text-emerald-500' : 'text-red-500'}`}>{totalPercent}%</span>
          </div>
        </div>
      </div>

      <Button onClick={onSave} disabled={saving || totalPercent !== 100} className="w-full bg-orange-500 hover:bg-orange-600" data-testid="save-settings-btn">
        <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Settings"}
      </Button>
    </CardContent>
  </Card>
);

const SliderRow = ({ icon: Icon, label, value, onChange, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <Label className="text-zinc-400 flex items-center"><Icon className={`w-4 h-4 mr-2 ${color}`} />{label}</Label>
      <span className={`${color} font-mono font-bold`}>{value}%</span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} max={100} min={0} step={5} className="w-full" />
  </div>
);
