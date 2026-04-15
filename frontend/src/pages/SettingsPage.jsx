import { useState } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Lock, KeyRound, Download } from "lucide-react";

const SettingsPage = ({ user }) => {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) { toast.error("All fields are required"); return; }
    if (newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { toast.error("New passwords don't match"); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: currentPw,
        new_password: newPw
      });
      toast.success("Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to change password");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl" data-testid="settings-page">
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Settings</h1>
        <p className="text-zinc-400 mt-2">Account security and preferences</p>
      </div>

      {/* Account Info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-lg font-heading text-zinc-50 flex items-center"><KeyRound className="w-5 h-5 mr-2 text-orange-500" /> Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-zinc-800 rounded-lg">
            <span className="text-zinc-400 text-sm">Email</span>
            <span className="text-zinc-200 font-mono text-sm">{user?.email || '-'}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-zinc-800 rounded-lg">
            <span className="text-zinc-400 text-sm">Role</span>
            <span className="text-orange-500 font-mono text-sm capitalize">{user?.role || '-'}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-zinc-800 rounded-lg">
            <span className="text-zinc-400 text-sm">Name</span>
            <span className="text-zinc-200 font-mono text-sm">{user?.name || '-'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-lg font-heading text-zinc-50 flex items-center"><Lock className="w-5 h-5 mr-2 text-orange-500" /> Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Current Password</Label>
            <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Enter current password" data-testid="current-pw-input" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">New Password</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Min 6 characters" data-testid="new-pw-input" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Confirm New Password</Label>
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Re-enter new password" data-testid="confirm-pw-input" />
          </div>
          <Button onClick={handleChangePassword} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600" data-testid="change-pw-btn">
            {saving ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Data Management</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800" onClick={() => window.open(`${API}/export/sessions-excel`, '_blank')}>
              <Download className="w-4 h-4 mr-1" /> Sessions
            </Button>
            <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800" onClick={() => window.open(`${API}/export/products-excel`, '_blank')}>
              <Download className="w-4 h-4 mr-1" /> Products
            </Button>
            <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800" onClick={() => window.open(`${API}/export/inventory-excel`, '_blank')}>
              <Download className="w-4 h-4 mr-1" /> Inventory
            </Button>
            <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800" onClick={() => window.open(`${API}/export/cashflow-excel`, '_blank')}>
              <Download className="w-4 h-4 mr-1" /> Cashflow
            </Button>
            <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800" onClick={() => window.open(`${API}/export/sales-by-month-market`, '_blank')}>
              <Download className="w-4 h-4 mr-1" /> Sales by Market
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
