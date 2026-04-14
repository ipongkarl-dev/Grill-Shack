import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

const MarketsPage = () => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/markets`);
      setMarkets(res.data);
    } catch (_e) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  const openNew = () => { setEditing(null); setName(""); setDialogOpen(true); };
  const openEdit = (m) => { setEditing(m); setName(m.name); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Market name is required"); return; }
    try {
      if (editing) {
        await axios.put(`${API}/markets/${editing.id}`, { name: name.trim(), preset_mix: editing.preset_mix || {} });
        toast.success("Market updated");
      } else {
        await axios.post(`${API}/markets`, { name: name.trim() });
        toast.success("Market added");
      }
      setDialogOpen(false);
      fetchMarkets();
    } catch (e) { toast.error("Failed to save market"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this market?")) return;
    try {
      await axios.delete(`${API}/markets/${id}`);
      toast.success("Market deleted");
      fetchMarkets();
    } catch (e) { toast.error("Failed to delete"); }
  };

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6" data-testid="markets-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Markets</h1>
          <p className="text-zinc-400 mt-2">Manage your market locations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600" data-testid="add-market-btn">
              <Plus className="w-4 h-4 mr-2" /> Add Market
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-zinc-50 font-heading">{editing ? "Edit Market" : "Add Market"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Market Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="e.g. Ponsonby Market" data-testid="market-name-input" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                <Button onClick={handleSave} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="save-market-btn">{editing ? "Update" : "Add"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Market</TableHead>
                <TableHead className="text-zinc-400 text-center">Preset Mix</TableHead>
                <TableHead className="text-zinc-400 text-center">Status</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {markets.map(m => (
                <TableRow key={m.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="font-medium text-zinc-200">{m.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {m.preset_mix && Object.keys(m.preset_mix).length > 0 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500">Configured</Badge>
                    ) : (
                      <Badge className="bg-zinc-800 text-zinc-500">Empty</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={m.is_active !== false ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}>
                      {m.is_active !== false ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(m)} className="text-zinc-400 hover:text-zinc-200" data-testid={`edit-market-${m.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)} className="text-zinc-400 hover:text-red-500" data-testid={`delete-market-${m.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Markets</p>
          <p className="text-3xl font-bold font-heading text-orange-500 mt-1">{markets.length}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketsPage;
