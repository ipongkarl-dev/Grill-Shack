import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { format } from "date-fns";
import { InventoryTable } from "../components/InventoryTable";
import { CalendarIcon, Plus, Package, Truck, FileText, ArrowRight, Pencil, Trash2, Download } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(v);

const UNITS = ["kg", "g", "L", "ml", "pcs", "each", "pack", "dozen", "bottle", "bag"];

const InventoryTracker = () => {
  const [entries, setEntries] = useState([]);
  const [knownIngredients, setKnownIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form, setForm] = useState({
    ingredient_name: "", date: new Date(), packs_in: "", units_per_pack: "",
    unit: "kg", pack_cost: "", supplier: "", notes: ""
  });

  const fetchData = useCallback(async () => {
    try {
      const [eRes, iRes] = await Promise.all([
        axios.get(`${API}/inventory`),
        axios.get(`${API}/inventory/ingredients`)
      ]);
      setEntries(eRes.data);
      setKnownIngredients(iRes.data);
    } catch (_e) {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only module-level imports (API, axios, toast) and stable state setters used
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.ingredient_name.trim()) { toast.error("Ingredient name is required"); return; }
    if (!form.packs_in || parseInt(form.packs_in) <= 0) { toast.error("Enter number of packs"); return; }
    try {
      const payload = {
        ingredient_name: form.ingredient_name.trim(),
        date: format(form.date, "yyyy-MM-dd"),
        packs_in: parseInt(form.packs_in) || 0,
        units_per_pack: parseFloat(form.units_per_pack) || 1,
        unit: form.unit,
        pack_cost: parseFloat(form.pack_cost) || 0,
        supplier: form.supplier,
        notes: form.notes
      };
      if (editingEntry) {
        await axios.put(`${API}/inventory/${editingEntry.id}`, payload);
        toast.success("Entry updated!");
      } else {
        await axios.post(`${API}/inventory`, payload);
        toast.success("Raw material purchase recorded! Linked product COGS updated.");
      }
      closeDialog();
      fetchData();
    } catch (_e) { toast.error("Failed to save entry"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this inventory entry?")) return;
    try {
      await axios.delete(`${API}/inventory/${id}`);
      toast.success("Entry deleted");
      fetchData();
    } catch (_e) { toast.error("Failed to delete"); }
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setForm({
      ingredient_name: entry.ingredient_name,
      date: new Date(entry.date + "T00:00:00"),
      packs_in: entry.packs_in?.toString() || "",
      units_per_pack: entry.units_per_pack?.toString() || "",
      unit: entry.unit || "kg",
      pack_cost: entry.pack_cost?.toString() || "",
      supplier: entry.supplier || "",
      notes: entry.notes || ""
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingEntry(null);
    setForm({ ingredient_name: "", date: new Date(), packs_in: "", units_per_pack: "", unit: "kg", pack_cost: "", supplier: "", notes: "" });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingEntry(null);
    setForm({ ingredient_name: "", date: new Date(), packs_in: "", units_per_pack: "", unit: "kg", pack_cost: "", supplier: "", notes: "" });
  };

  // Derived values for preview
  const previewPacks = parseInt(form.packs_in) || 0;
  const previewUnitsPerPack = parseFloat(form.units_per_pack) || 1;
  const previewPackCost = parseFloat(form.pack_cost) || 0;
  const previewTotalQty = previewPacks * previewUnitsPerPack;
  const previewTotalCost = previewPacks * previewPackCost;
  const previewCostPerUnit = previewUnitsPerPack > 0 ? (previewPackCost / previewUnitsPerPack) : 0;

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6" data-testid="inventory-tracker">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Raw Material Inventory</h1>
          <p className="text-zinc-400 mt-2">Track raw material purchases — costs auto-flow to Product Calculator and COGS</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800" onClick={() => window.open(`${API}/export/inventory-excel`, '_blank')} data-testid="export-inventory-btn">
            <Download className="w-4 h-4 mr-1" /> Export Excel
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else openNew(); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600" data-testid="add-inventory-btn">
              <Plus className="w-4 h-4 mr-2" /> Record Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-50 font-heading">{editingEntry ? "Edit Purchase Entry" : "Record Raw Material Purchase"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Ingredient Name *</Label>
                <Input
                  value={form.ingredient_name}
                  onChange={e => setForm(f => ({ ...f, ingredient_name: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="e.g. Beef Mince, Burger Buns, BBQ Sauce"
                  list="ingredient-suggestions"
                  data-testid="inv-ingredient-input"
                />
                <datalist id="ingredient-suggestions">
                  {knownIngredients.map(i => <option key={i.name} value={i.name} />)}
                </datalist>
                <p className="text-xs text-zinc-600">Must match ingredient names in Product Calculator for auto-linking</p>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Purchase Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-zinc-800 border-zinc-700">
                      <CalendarIcon className="w-4 h-4 mr-2" /> {format(form.date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                    <Calendar mode="single" selected={form.date} onSelect={d => d && setForm(f => ({ ...f, date: d }))} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Packs Bought</Label>
                  <Input type="number" min="1" value={form.packs_in} onChange={e => setForm(f => ({ ...f, packs_in: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="1" data-testid="inv-packs-input" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Qty per Pack</Label>
                  <Input type="number" step="0.01" min="0.01" value={form.units_per_pack} onChange={e => setForm(f => ({ ...f, units_per_pack: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="1" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Unit</Label>
                  <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Cost per Pack (NZD)</Label>
                  <Input type="number" step="0.01" value={form.pack_cost} onChange={e => setForm(f => ({ ...f, pack_cost: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="25.00" data-testid="inv-cost-input" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Supplier</Label>
                  <Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="Supplier name" data-testid="inv-supplier-input" />
                </div>
              </div>

              {/* Cost Breakdown Preview */}
              <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Cost Breakdown</p>
                <div className="grid grid-cols-3 gap-3 text-sm text-center">
                  <div>
                    <p className="text-zinc-500">Total Qty</p>
                    <p className="font-mono text-zinc-200 text-lg">{previewTotalQty.toFixed(2)} {form.unit}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Total Cost</p>
                    <p className="font-mono text-orange-500 text-lg">{fmt(previewTotalCost)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Cost per {form.unit}</p>
                    <p className="font-mono text-emerald-500 text-lg">{fmt(previewCostPerUnit)}</p>
                  </div>
                </div>
                <p className="text-xs text-orange-500/80 text-center mt-2">
                  This cost-per-unit will auto-update linked product ingredients
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="e.g. Weekly restock from Gilmours" />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={closeDialog} className="flex-1 border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                <Button onClick={handleSubmit} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="save-inventory-btn">{editingEntry ? "Update Entry" : "Record Purchase"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* How COGS Flows */}
      <Card className="bg-zinc-900 border-zinc-800 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3 text-sm flex-wrap">
            <Badge className="bg-orange-500/10 text-orange-500">Raw Material Purchase</Badge>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
            <Badge className="bg-blue-500/10 text-blue-500">Ingredient Cost Updates</Badge>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
            <Badge className="bg-emerald-500/10 text-emerald-500">Product COGS Recalculates</Badge>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
            <Badge className="bg-purple-500/10 text-purple-500">Session Margins Update</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Known Ingredients Summary */}
      {knownIngredients.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {knownIngredients.map(i => (
            <Card key={i.name} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-zinc-500 truncate">{i.name}</p>
                <p className="text-lg font-bold font-heading text-zinc-200 mt-1">{fmt(i.latest_cost)}/{i.unit}</p>
                <p className="text-xs text-zinc-600">{i.latest_supplier || 'No supplier'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Purchase History Table */}
      <InventoryTable entries={entries} onEdit={openEdit} onDelete={handleDelete} />
    </div>
  );
};

export default InventoryTracker;
