import { useState, useEffect } from "react";
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
import { CalendarIcon, Plus, Package, Truck, FileText } from "lucide-react";

const formatCurrency = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(v);

const InventoryTracker = () => {
  const [products, setProducts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    product_id: "", date: new Date(), packs_in: "", pieces_per_pack: "1",
    cost_per_unit: "", supplier: "", notes: ""
  });

  const fetchData = async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/inventory`)
      ]);
      setProducts(pRes.data);
      setEntries(eRes.data);
    } catch (_e) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.product_id) { toast.error("Select a product"); return; }
    const product = products.find(p => p.id === form.product_id);
    try {
      await axios.post(`${API}/inventory`, {
        product_id: form.product_id,
        product_name: product?.name || "",
        date: format(form.date, "yyyy-MM-dd"),
        packs_in: parseInt(form.packs_in) || 0,
        pieces_per_pack: parseInt(form.pieces_per_pack) || 1,
        cost_per_unit: parseFloat(form.cost_per_unit) || 0,
        supplier: form.supplier,
        notes: form.notes
      });
      toast.success("Stock entry recorded");
      setDialogOpen(false);
      setForm({ product_id: "", date: new Date(), packs_in: "", pieces_per_pack: "1", cost_per_unit: "", supplier: "", notes: "" });
      fetchData();
    } catch (e) { toast.error("Failed to save"); }
  };

  const totalAdded = (parseInt(form.packs_in) || 0) * (parseInt(form.pieces_per_pack) || 1);

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6" data-testid="inventory-tracker">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Inventory Tracker</h1>
          <p className="text-zinc-400 mt-2">Track stock movements, suppliers, and costs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-inventory-btn">
              <Plus className="w-4 h-4 mr-2" /> Record Stock In
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-50 font-heading">Record Stock In</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Product *</Label>
                <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="inv-product-select">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-zinc-800 border-zinc-700">
                      <CalendarIcon className="w-4 h-4 mr-2" /> {format(form.date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800"><Calendar mode="single" selected={form.date} onSelect={d => d && setForm(f => ({ ...f, date: d }))} /></PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Packs In</Label>
                  <Input type="number" min="0" value={form.packs_in} onChange={e => setForm(f => ({ ...f, packs_in: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="0" data-testid="inv-packs-input" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Pieces/Pack</Label>
                  <Input type="number" min="1" value={form.pieces_per_pack} onChange={e => setForm(f => ({ ...f, pieces_per_pack: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="1" />
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500">Total Units Added</p>
                <p className="text-2xl font-bold text-orange-500">{totalAdded}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Cost per Unit ($)</Label>
                  <Input type="number" step="0.01" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Supplier</Label>
                  <Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="Supplier name" data-testid="inv-supplier-input" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="e.g. Weekly restock" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                <Button onClick={handleSubmit} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="save-inventory-btn">Save Entry</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Stock Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {products.map(p => (
          <Card key={p.id} className={`bg-zinc-900 border-zinc-800 ${p.current_stock <= p.reorder_point ? 'border-amber-500/40' : ''}`}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-zinc-500 truncate">{p.name}</p>
              <p className={`text-2xl font-bold font-heading mt-1 ${p.current_stock <= p.reorder_point ? 'text-amber-500' : 'text-zinc-200'}`}>
                {p.current_stock}
              </p>
              <p className="text-xs text-zinc-600">Reorder: {p.reorder_point}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* History Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-500" /> Stock Movement Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Date</TableHead>
                  <TableHead className="text-zinc-400">Product</TableHead>
                  <TableHead className="text-zinc-400 text-right">Packs</TableHead>
                  <TableHead className="text-zinc-400 text-right">pcs/Pack</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total Added</TableHead>
                  <TableHead className="text-zinc-400 text-right">Cost/Unit</TableHead>
                  <TableHead className="text-zinc-400">Supplier</TableHead>
                  <TableHead className="text-zinc-400">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="text-center py-12 text-zinc-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No inventory movements recorded yet</p>
                    </TableCell>
                  </TableRow>
                ) : entries.map(e => (
                  <TableRow key={e.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-zinc-300">{e.date}</TableCell>
                    <TableCell className="font-medium text-zinc-200">{e.product_name}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{e.packs_in}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{e.pieces_per_pack}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-500 font-semibold">+{e.total_added}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">{formatCurrency(e.cost_per_unit)}</TableCell>
                    <TableCell className="text-zinc-400">{e.supplier || '-'}</TableCell>
                    <TableCell className="text-zinc-500 text-xs max-w-[200px] truncate">{e.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryTracker;
