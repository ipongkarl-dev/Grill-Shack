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
import { ShoppingCart, Package, Truck, Clock, CheckCircle, XCircle, Send, FileText, Trash2 } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(v);

const STATUS_STYLES = {
  pending: { bg: "bg-amber-500/10 text-amber-500", icon: Clock },
  ordered: { bg: "bg-blue-500/10 text-blue-500", icon: Send },
  received: { bg: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle },
  cancelled: { bg: "bg-red-500/10 text-red-500", icon: XCircle },
};

const ReorderPage = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [poNotes, setPoNotes] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [sugRes, ordRes] = await Promise.all([
        axios.get(`${API}/reorder/suggestions`),
        axios.get(`${API}/reorder/purchase-orders`)
      ]);
      setSuggestions(sugRes.data);
      setOrders(ordRes.data);
    } catch (_e) { toast.error('Failed to load reorder data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreatePO = () => {
    setSelectedItems(suggestions.map(s => ({ ...s, selected: true })));
    setPoNotes("");
    setCreateDialogOpen(true);
  };

  const toggleItem = (idx) => {
    setSelectedItems(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  };

  const updateQty = (idx, qty) => {
    setSelectedItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, qty_needed: Math.max(0, parseInt(qty) || 0), estimated_cost: Math.max(0, parseInt(qty) || 0) * item.unit_cost } : item
    ));
  };

  const createPO = async () => {
    const items = selectedItems.filter(s => s.selected && s.qty_needed > 0);
    if (items.length === 0) { toast.error("Select at least one item"); return; }

    const supplierName = items[0]?.linked_supplier?.name || "General Order";
    const supplierId = items[0]?.linked_supplier?.id || "general";

    try {
      await axios.post(`${API}/reorder/purchase-orders`, {
        supplier_id: supplierId,
        supplier_name: supplierName,
        items: items.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          qty_needed: i.qty_needed,
          unit_cost: i.unit_cost,
          estimated_cost: round2(i.qty_needed * i.unit_cost),
        })),
        notes: poNotes,
      });
      toast.success("Purchase order created!");
      setCreateDialogOpen(false);
      fetchData();
    } catch (_e) { toast.error("Failed to create PO"); }
  };

  const updateStatus = async (poId, newStatus) => {
    try {
      await axios.put(`${API}/reorder/purchase-orders/${poId}/status?new_status=${newStatus}`);
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch (_e) { toast.error("Failed to update status"); }
  };

  const deletePO = async (poId) => {
    if (!window.confirm("Delete this purchase order?")) return;
    try {
      await axios.delete(`${API}/reorder/purchase-orders/${poId}`);
      toast.success("Deleted");
      fetchData();
    } catch (_e) { toast.error("Failed to delete"); }
  };

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  const totalSuggested = suggestions.reduce((a, s) => a + s.estimated_cost, 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const orderedCount = orders.filter(o => o.status === "ordered").length;

  return (
    <div className="space-y-6" data-testid="reorder-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Auto-Reorder</h1>
          <p className="text-zinc-400 mt-2">Review low-stock alerts and generate purchase orders</p>
        </div>
        {suggestions.length > 0 && (
          <Button onClick={openCreatePO} className="bg-orange-500 hover:bg-orange-600" data-testid="create-po-btn">
            <ShoppingCart className="w-4 h-4 mr-2" /> Generate Purchase Order
          </Button>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10"><Package className="w-5 h-5 text-red-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Low Stock Items</p>
                <p className="text-xl font-bold font-heading text-red-500">{suggestions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><ShoppingCart className="w-5 h-5 text-orange-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Est. Reorder Cost</p>
                <p className="text-xl font-bold font-heading text-orange-500">{fmt(totalSuggested)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10"><Clock className="w-5 h-5 text-amber-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Pending POs</p>
                <p className="text-xl font-bold font-heading text-amber-500">{pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Send className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Ordered</p>
                <p className="text-xl font-bold font-heading text-blue-500">{orderedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reorder Suggestions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
            <Package className="w-5 h-5 mr-2 text-red-500" /> Reorder Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Product</TableHead>
                  <TableHead className="text-zinc-400 text-right">Current Stock</TableHead>
                  <TableHead className="text-zinc-400 text-right">Reorder Point</TableHead>
                  <TableHead className="text-zinc-400 text-right">Qty Needed</TableHead>
                  <TableHead className="text-zinc-400 text-right">Unit Cost</TableHead>
                  <TableHead className="text-zinc-400 text-right">Est. Cost</TableHead>
                  <TableHead className="text-zinc-400">Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-emerald-500" />
                      <p className="text-emerald-500">All stock levels are above reorder points</p>
                    </TableCell>
                  </TableRow>
                ) : suggestions.map(s => (
                  <TableRow key={s.product_id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-zinc-200">{s.product_name}</p>
                        <p className="text-xs text-zinc-500">{s.code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-500 font-semibold">{s.current_stock}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">{s.reorder_point}</TableCell>
                    <TableCell className="text-right font-mono text-orange-500 font-semibold">{s.qty_needed}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{fmt(s.unit_cost)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-200">{fmt(s.estimated_cost)}</TableCell>
                    <TableCell>
                      {s.linked_supplier ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500">
                          <Truck className="w-3 h-3 mr-1" /> {s.linked_supplier.name}
                        </Badge>
                      ) : (
                        <span className="text-zinc-600 text-xs">No supplier linked</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-500" /> Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">PO #</TableHead>
                  <TableHead className="text-zinc-400">Supplier</TableHead>
                  <TableHead className="text-zinc-400 text-right">Items</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total</TableHead>
                  <TableHead className="text-zinc-400 text-center">Status</TableHead>
                  <TableHead className="text-zinc-400">Created</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No purchase orders yet</p>
                    </TableCell>
                  </TableRow>
                ) : orders.map(o => {
                  const style = STATUS_STYLES[o.status] || STATUS_STYLES.pending;
                  const StatusIcon = style.icon;
                  return (
                    <TableRow key={o.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="font-mono text-zinc-200">{o.po_number}</TableCell>
                      <TableCell className="text-zinc-300">{o.supplier_name}</TableCell>
                      <TableCell className="text-right font-mono text-zinc-300">{o.items?.length || 0}</TableCell>
                      <TableCell className="text-right font-mono text-orange-500">{fmt(o.total_estimated)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={style.bg}>
                          <StatusIcon className="w-3 h-3 mr-1" /> {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs">{o.created_at?.slice(0, 10)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {o.status === "pending" && (
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, "ordered")}
                              className="text-blue-400 hover:text-blue-300 text-xs" data-testid={`mark-ordered-${o.po_number}`}>
                              Mark Ordered
                            </Button>
                          )}
                          {o.status === "ordered" && (
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, "received")}
                              className="text-emerald-400 hover:text-emerald-300 text-xs" data-testid={`mark-received-${o.po_number}`}>
                              Received
                            </Button>
                          )}
                          {(o.status === "pending" || o.status === "cancelled") && (
                            <Button size="sm" variant="ghost" onClick={() => deletePO(o.id)}
                              className="text-zinc-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
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

      {/* Create PO Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-50 font-heading">Generate Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedItems.map((item, idx) => (
              <div key={item.product_id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${item.selected ? 'bg-zinc-800/50 border-orange-500/30' : 'bg-zinc-800/20 border-zinc-800 opacity-50'}`}>
                <input type="checkbox" checked={item.selected} onChange={() => toggleItem(idx)} className="accent-orange-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{item.product_name}</p>
                  <p className="text-xs text-zinc-500">Unit: {fmt(item.unit_cost)}</p>
                </div>
                <Input type="number" min="0" value={item.qty_needed} onChange={e => updateQty(idx, e.target.value)} className="w-20 bg-zinc-800 border-zinc-700 text-center text-sm" disabled={!item.selected} />
                <span className="text-xs text-zinc-400 w-16 text-right">{fmt(item.qty_needed * item.unit_cost)}</span>
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-xs text-zinc-500">Notes</label>
              <Input value={poNotes} onChange={e => setPoNotes(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="e.g., Urgent - needed for Saturday market" />
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <span className="text-zinc-400">Total Estimated</span>
              <span className="font-mono font-bold text-orange-500 text-lg">
                {fmt(selectedItems.filter(i => i.selected).reduce((a, i) => a + i.qty_needed * i.unit_cost, 0))}
              </span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="flex-1 border-zinc-700 hover:bg-zinc-800">Cancel</Button>
              <Button onClick={createPO} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="confirm-po-btn">
                <Send className="w-4 h-4 mr-2" /> Create PO
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function round2(v) { return Math.round(v * 100) / 100; }

export default ReorderPage;
