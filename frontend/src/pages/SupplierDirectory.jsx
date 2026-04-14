import { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Truck, Phone, Mail, MapPin } from "lucide-react";

const SupplierDirectory = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "", products: [], notes: "" });

  const fetchData = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        axios.get(`${API}/suppliers`),
        axios.get(`${API}/products`)
      ]);
      setSuppliers(sRes.data);
      setProducts(pRes.data);
    } catch (_e) { /* logged server-side */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", contact_person: "", phone: "", email: "", address: "", products: [], notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, contact_person: s.contact_person || "", phone: s.phone || "", email: s.email || "", address: s.address || "", products: s.products || [], notes: s.notes || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Supplier name required"); return; }
    try {
      if (editing) {
        await axios.put(`${API}/suppliers/${editing.id}`, form);
        toast.success("Supplier updated");
      } else {
        await axios.post(`${API}/suppliers`, form);
        toast.success("Supplier added");
      }
      setDialogOpen(false);
      fetchData();
    } catch (e) { toast.error("Failed to save"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this supplier?")) return;
    try { await axios.delete(`${API}/suppliers/${id}`); toast.success("Deleted"); fetchData(); }
    catch (e) { toast.error("Failed to delete"); }
  };

  const toggleProduct = (code) => {
    setForm(f => ({
      ...f,
      products: f.products.includes(code) ? f.products.filter(p => p !== code) : [...f.products, code]
    }));
  };

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6" data-testid="supplier-directory">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Supplier Directory</h1>
          <p className="text-zinc-400 mt-2">Manage suppliers, contacts, and product associations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600" data-testid="add-supplier-btn">
              <Plus className="w-4 h-4 mr-2" /> Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-50 font-heading">{editing ? "Edit" : "Add"} Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-zinc-400">Company Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="NZ Meats Ltd" data-testid="supplier-name-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Contact Person</Label>
                  <Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="+64 21 123 4567" data-testid="supplier-phone-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Email</Label>
                  <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="orders@supplier.co.nz" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Address</Label>
                  <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="Auckland" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Products Supplied</Label>
                <div className="flex flex-wrap gap-2">
                  {products.map(p => (
                    <Badge
                      key={p.code}
                      className={`cursor-pointer transition-colors ${form.products.includes(p.code) ? 'bg-orange-500/20 text-orange-500 border-orange-500/40' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                      onClick={() => toggleProduct(p.code)}
                    >
                      {p.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="Delivery schedule, minimum orders..." />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                <Button onClick={handleSave} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="save-supplier-btn">{editing ? "Update" : "Add"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Supplier Cards */}
      {suppliers.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center text-zinc-500">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No suppliers added yet</p>
            <p className="text-sm mt-1">Add your suppliers to track contacts and product associations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <Card key={s.id} className="bg-zinc-900 border-zinc-800 card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-zinc-50">{s.name}</p>
                      {s.contact_person && <p className="text-xs text-zinc-500">{s.contact_person}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(s)} className="text-zinc-400 hover:text-zinc-200 h-8 w-8 p-0">
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} className="text-zinc-400 hover:text-red-500 h-8 w-8 p-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {s.phone && <div className="flex items-center gap-2 text-zinc-400"><Phone className="w-3 h-3" /><span>{s.phone}</span></div>}
                  {s.email && <div className="flex items-center gap-2 text-zinc-400"><Mail className="w-3 h-3" /><span>{s.email}</span></div>}
                  {s.address && <div className="flex items-center gap-2 text-zinc-400"><MapPin className="w-3 h-3" /><span>{s.address}</span></div>}
                </div>

                {s.products?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-2">Products</p>
                    <div className="flex flex-wrap gap-1">
                      {s.products.map(code => (
                        <Badge key={code} className="bg-zinc-800 text-zinc-300 text-xs">{code}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {s.notes && <p className="text-xs text-zinc-500 mt-3 italic">{s.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierDirectory;
