import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { DollarSign, CreditCard, Clock, Eye, Trash2, Pencil, Download } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(v);

export const TransactionLogEditable = ({ transactions, activeSession, onView, onEdit, onDelete, onExport }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base font-heading text-zinc-50 flex items-center">
          <Clock className="w-4 h-4 mr-2 text-orange-500" /> Transaction Log ({transactions.length})
        </CardTitle>
        <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 h-8"
          onClick={onExport} data-testid="export-log-btn">
          <Download className="w-3 h-3 mr-1" /> Excel
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-1 max-h-[350px] overflow-y-auto">
        {[...transactions].reverse().map((txn, idx) => (
          <div key={txn.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group">
            <button onClick={() => onView(txn)} className="flex items-center gap-3 text-left flex-1 min-w-0" data-testid={`txn-${transactions.length - idx}`}>
              <Badge className={`text-xs flex-shrink-0 ${txn.payment_method === 'cash' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                {txn.payment_method === 'cash' ? <DollarSign className="w-3 h-3 mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
                {txn.payment_method.toUpperCase()}
              </Badge>
              <span className="text-zinc-400 text-xs font-mono">#{transactions.length - idx}</span>
              <span className="text-zinc-500 text-xs">{txn.timestamp?.slice(11, 19)}</span>
              <span className="text-zinc-400 text-xs truncate">{(txn.items || []).map(i => `${i.product_name} x${i.units}`).join(', ')}</span>
            </button>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-orange-500 font-mono text-sm font-bold mr-2">{fmt(txn.total)}</span>
              {activeSession && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(txn)} className="text-zinc-600 hover:text-zinc-200 opacity-0 group-hover:opacity-100 h-7 w-7 p-0">
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(txn.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 h-7 w-7 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const EditTransactionDialog = ({ open, onOpenChange, editingTxn, setEditingTxn, onSave }) => {
  if (!editingTxn) return null;

  const updateItem = (idx, field, value) => {
    setEditingTxn(prev => {
      const items = [...prev.editItems];
      items[idx] = { ...items[idx], [field]: field === 'units' ? Math.max(0, parseInt(value) || 0) : value };
      return { ...prev, editItems: items };
    });
  };

  const removeItem = (idx) => {
    setEditingTxn(prev => ({ ...prev, editItems: prev.editItems.filter((_, i) => i !== idx) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader><DialogTitle className="text-zinc-50 font-heading">Edit Transaction</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">Payment Method</label>
            <Select value={editingTxn.editPayment} onValueChange={v => setEditingTxn(prev => ({ ...prev, editPayment: v }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="eftpos">EFTPOS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">Items</label>
            {editingTxn.editItems.map((item, idx) => (
              <div key={item.product_id || idx} className="flex items-center gap-2 p-2 rounded bg-zinc-800/50">
                <span className="text-zinc-200 text-sm flex-1 truncate">{item.product_name}</span>
                <Input type="number" min="0" value={item.units} onChange={e => updateItem(idx, 'units', e.target.value)}
                  className="w-16 bg-zinc-800 border-zinc-700 text-center text-sm h-8" />
                <span className="text-orange-500 font-mono text-xs w-16 text-right">{fmt(item.units * item.unit_price)}</span>
                <Button size="sm" variant="ghost" onClick={() => removeItem(idx)} className="text-zinc-500 hover:text-red-500 h-7 w-7 p-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold py-2 border-t border-zinc-800">
            <span className="text-zinc-300">New Total</span>
            <span className="text-orange-500">{fmt(editingTxn.editItems.reduce((s, i) => s + i.units * i.unit_price, 0))}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-zinc-700">Cancel</Button>
            <Button onClick={onSave} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="save-edit-txn-btn">Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
