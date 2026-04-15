import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { CashSessionsTable } from "../components/CashWidgets";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { DollarSign, CreditCard, Banknote, AlertCircle, CheckCircle } from "lucide-react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2
  }).format(value);
};

const CashSystem = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState({
    cash: "",
    eftpos: "",
    opening_float: "",
    cash_expenses: "",
    expense_notes: ""
  });

  const fetchSessions = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/sessions?limit=50`);
      setSessions(response.data);
    } catch (_err) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only module-level imports (API, axios, toast) and stable state setters used
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const openEdit = (session) => {
    setEditingSession(session);
    setEditForm({
      cash: session.cash?.toString() || "",
      eftpos: session.eftpos?.toString() || "",
      opening_float: session.opening_float?.toString() || "",
      cash_expenses: session.cash_expenses?.toString() || "",
      expense_notes: session.expense_notes || ""
    });
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API}/sessions/${editingSession.id}`, {
        cash: parseFloat(editForm.cash) || 0,
        eftpos: parseFloat(editForm.eftpos) || 0,
        opening_float: parseFloat(editForm.opening_float) || 0,
        cash_expenses: parseFloat(editForm.cash_expenses) || 0,
        expense_notes: editForm.expense_notes
      });
      toast.success("Session updated");
      setEditingSession(null);
      fetchSessions();
    } catch (_err) {
      toast.error("Failed to update session");
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Delete this session? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/sessions/${sessionId}`);
      toast.success("Session deleted");
      fetchSessions();
    } catch (_err) {
      toast.error("Failed to delete session");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Calculate totals
  const totals = sessions.reduce((acc, s) => ({
    cash: acc.cash + (s.cash || 0),
    eftpos: acc.eftpos + (s.eftpos || 0),
    calculated: acc.calculated + (s.calculated_sales || 0),
    collected: acc.collected + (s.total_collected || 0),
    variance: acc.variance + (s.variance || 0),
    expenses: acc.expenses + (s.cash_expenses || 0)
  }), { cash: 0, eftpos: 0, calculated: 0, collected: 0, variance: 0, expenses: 0 });

  const okCount = sessions.filter(s => s.status === 'OK').length;
  const issueCount = sessions.filter(s => s.status !== 'OK').length;

  return (
    <div className="space-y-6" data-testid="cash-system">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">
          Cash System
        </h1>
        <p className="text-zinc-400 mt-2">
          Daily cash reconciliation and payment tracking
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Banknote className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Total Cash</p>
                <p className="text-xl font-bold font-heading text-emerald-500">
                  {formatCurrency(totals.cash)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CreditCard className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Total EFTPOS</p>
                <p className="text-xl font-bold font-heading text-blue-500">
                  {formatCurrency(totals.eftpos)}
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
                <p className="text-xs text-zinc-500 uppercase">Total Collected</p>
                <p className="text-xl font-bold font-heading text-orange-500">
                  {formatCurrency(totals.collected)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totals.variance > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                <AlertCircle className={`w-5 h-5 ${totals.variance > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Total Variance</p>
                <p className={`text-xl font-bold font-heading ${totals.variance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {formatCurrency(totals.variance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-zinc-300">{okCount} sessions OK</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span className="text-zinc-300">{issueCount} sessions with issues</span>
        </div>
      </div>

      {/* Sessions Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-zinc-50">Session Cash Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CashSessionsTable sessions={sessions} onEdit={openEdit} onDelete={handleDeleteSession} />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-50 font-heading">
              Edit Session #{editingSession?.session_id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Cash</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.cash}
                  onChange={(e) => setEditForm(f => ({...f, cash: e.target.value}))}
                  className="bg-zinc-800 border-zinc-700"
                  data-testid="edit-cash-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">EFTPOS</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.eftpos}
                  onChange={(e) => setEditForm(f => ({...f, eftpos: e.target.value}))}
                  className="bg-zinc-800 border-zinc-700"
                  data-testid="edit-eftpos-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Opening Float</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.opening_float}
                  onChange={(e) => setEditForm(f => ({...f, opening_float: e.target.value}))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Cash Expenses</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.cash_expenses}
                  onChange={(e) => setEditForm(f => ({...f, cash_expenses: e.target.value}))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Expense Notes</Label>
              <Input
                value={editForm.expense_notes}
                onChange={(e) => setEditForm(f => ({...f, expense_notes: e.target.value}))}
                className="bg-zinc-800 border-zinc-700"
                placeholder="e.g., Ice, supplies"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditingSession(null)}
                className="flex-1 border-zinc-700 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                data-testid="save-edit-btn"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashSystem;
