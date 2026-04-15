import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Database, Plus, Pencil, Trash2, Download, Upload, Eye, Camera, Shield } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(v);

const DataRepository = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState(null);
  const [form, setForm] = useState({ label: "", notes: "" });

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/snapshots`);
      setSnapshots(res.data);
    } catch (_e) { toast.error("Failed to load snapshots"); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only module-level imports (API, axios, toast) and stable state setters used
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createSnapshot = async () => {
    if (!form.label.trim()) { toast.error("Label is required"); return; }
    try {
      await axios.post(`${API}/snapshots`, { label: form.label, notes: form.notes });
      toast.success("Snapshot created — data preserved");
      setCreateOpen(false);
      setForm({ label: "", notes: "" });
      fetchData();
    } catch (_e) { toast.error("Failed to create snapshot"); }
  };

  const openEdit = (s) => {
    setEditingSnapshot(s);
    setForm({ label: s.label, notes: s.notes || "" });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    try {
      await axios.put(`${API}/snapshots/${editingSnapshot.id}`, { label: form.label, notes: form.notes });
      toast.success("Snapshot updated");
      setEditOpen(false);
      fetchData();
    } catch (_e) { toast.error("Failed to update"); }
  };

  const deleteSnapshot = async (id) => {
    if (!window.confirm("Delete this snapshot?")) return;
    try {
      await axios.delete(`${API}/snapshots/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch (_e) { toast.error("Failed to delete"); }
  };

  const downloadBackup = () => {
    window.open(`${API}/backup/export`, '_blank');
  };

  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("This will REPLACE all current data with the backup. Continue?")) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await axios.post(`${API}/backup/restore`, data);
      toast.success("Backup restored successfully!");
      fetchData();
    } catch (_e) { toast.error("Failed to restore backup"); }
    e.target.value = "";
  };

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6" data-testid="data-repository">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Data Repository</h1>
          <p className="text-zinc-400 mt-2">Snapshots, backups, and data versioning for safe mode recovery</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={downloadBackup} data-testid="download-backup-btn">
            <Download className="w-4 h-4 mr-1" /> Download Backup
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 pointer-events-none" asChild>
              <span><Upload className="w-4 h-4 mr-1" /> Restore Backup</span>
            </Button>
            <input type="file" accept=".json" className="hidden" onChange={handleRestore} data-testid="restore-backup-input" />
          </label>
          <Button size="sm" onClick={() => { setForm({ label: "", notes: "" }); setCreateOpen(true); }} className="bg-orange-500 hover:bg-orange-600" data-testid="create-snapshot-btn">
            <Camera className="w-4 h-4 mr-1" /> New Snapshot
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-zinc-900 border-zinc-800 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-200 font-semibold">Safe Mode Data Protection</p>
              <p className="text-xs text-zinc-500 mt-1">Snapshots preserve your product configurations and session summaries at a point in time. Use these as a lookback basis for Stock Planner decisions. Download full backup JSON to encode your data for external safe-keeping.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Snapshots Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
            <Database className="w-5 h-5 mr-2 text-orange-500" /> Data Snapshots
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Label</TableHead>
                  <TableHead className="text-zinc-400">Date</TableHead>
                  <TableHead className="text-zinc-400 text-right">Products</TableHead>
                  <TableHead className="text-zinc-400 text-right">Sessions</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total Sales</TableHead>
                  <TableHead className="text-zinc-400">Notes</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                      <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No snapshots yet — create one to preserve current state</p>
                    </TableCell>
                  </TableRow>
                ) : snapshots.map(s => (
                  <TableRow key={s.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium text-zinc-200">{s.label}</TableCell>
                    <TableCell className="text-zinc-400 text-xs">{s.created_at?.slice(0, 16).replace('T', ' ')}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{s.products?.length || 0}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{s.session_summary?.count || 0}</TableCell>
                    <TableCell className="text-right font-mono text-orange-500">{fmt(s.session_summary?.total_sales || 0)}</TableCell>
                    <TableCell className="text-zinc-500 text-xs max-w-[150px] truncate">{s.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)} className="text-zinc-400 hover:text-zinc-200">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteSnapshot(s.id)} className="text-zinc-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader><DialogTitle className="text-zinc-50 font-heading">Create Data Snapshot</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-zinc-400 text-sm">Label *</label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="e.g. End of March 2026" data-testid="snapshot-label-input" />
            </div>
            <div className="space-y-2">
              <label className="text-zinc-400 text-sm">Notes</label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="e.g. Before price adjustments" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1 border-zinc-700 hover:bg-zinc-800">Cancel</Button>
              <Button onClick={createSnapshot} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="save-snapshot-btn">Create Snapshot</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader><DialogTitle className="text-zinc-50 font-heading">Edit Snapshot</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-zinc-400 text-sm">Label</label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <label className="text-zinc-400 text-sm">Notes</label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 border-zinc-700 hover:bg-zinc-800">Cancel</Button>
              <Button onClick={saveEdit} className="flex-1 bg-orange-500 hover:bg-orange-600">Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataRepository;
