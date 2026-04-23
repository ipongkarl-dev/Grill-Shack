import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { DollarSign, CreditCard, RotateCcw, Save, Power, Clock, Eye, Trash2, Pencil, Download, Pause, Play } from "lucide-react";
import { OrderSummary } from "../components/MarketModeWidgets";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(v);

const MarketMode = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [currentOrder, setCurrentOrder] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTxnOpen, setViewTxnOpen] = useState(false);
  const [editTxnOpen, setEditTxnOpen] = useState(false);
  const [viewingTxn, setViewingTxn] = useState(null);
  const [editingTxn, setEditingTxn] = useState(null);
  const [idleMode, setIdleMode] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pRes, mRes, sRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/markets`),
        axios.get(`${API}/market-mode/sessions/active`)
      ]);
      setProducts(pRes.data);
      setMarkets(mRes.data);
      if (sRes.data) {
        setActiveSession(sRes.data);
        setTransactions(sRes.data.transactions || []);
        setSelectedMarket(sRes.data.market_id);
      }
    } catch (_e) { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable module imports + setters
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startSession = async () => {
    if (!selectedMarket) { toast.error("Select a market first"); return; }
    const market = markets.find(m => m.id === selectedMarket);
    try {
      const res = await axios.post(`${API}/market-mode/sessions`, {
        market_id: selectedMarket, market_name: market?.name || "Unknown"
      });
      setActiveSession(res.data);
      setTransactions([]);
      setIdleMode(false);
      toast.success("Market session started!");
    } catch (_e) { toast.error("Failed to start session"); }
  };

  // Products always clickable (training mode if no session)
  const addUnit = (productId) => {
    setCurrentOrder(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeUnit = (productId) => {
    setCurrentOrder(prev => {
      const next = { ...prev };
      if (next[productId] > 1) next[productId] -= 1;
      else delete next[productId];
      return next;
    });
  };

  const currentTotal = Object.entries(currentOrder).reduce((sum, [pid, qty]) => {
    const p = products.find(pr => pr.id === pid);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const currentCOGS = Object.entries(currentOrder).reduce((sum, [pid, qty]) => {
    const p = products.find(pr => pr.id === pid);
    return sum + (p ? (p.food_cost + p.packaging_cost) * qty : 0);
  }, 0);

  const currentUnits = Object.values(currentOrder).reduce((a, b) => a + b, 0);

  const completeDone = async (paymentMethod) => {
    if (currentUnits === 0) { toast.error("Add items first"); return; }
    if (!activeSession) { toast.error("Start a session to record transactions"); return; }
    if (idleMode) { toast.error("Unpause to record transactions"); return; }
    const items = Object.entries(currentOrder).map(([pid, qty]) => {
      const p = products.find(pr => pr.id === pid);
      return { product_id: pid, product_name: p?.name || pid, units: qty, unit_price: p?.price || 0 };
    });
    try {
      const res = await axios.post(`${API}/market-mode/sessions/${activeSession.id}/transaction`, {
        items, total: currentTotal, payment_method: paymentMethod
      });
      setTransactions(prev => [...prev, res.data]);
      setCurrentOrder({});
      toast.success(`Order #${transactions.length + 1} — ${paymentMethod.toUpperCase()}`);
    } catch (_e) { toast.error("Failed to record transaction"); }
  };

  const resetOrder = () => setCurrentOrder({});

  const deleteTxn = async (txnId) => {
    if (!activeSession) return;
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await axios.delete(`${API}/market-mode/sessions/${activeSession.id}/transaction/${txnId}`);
      setTransactions(prev => prev.filter(t => t.id !== txnId));
      toast.success("Transaction deleted");
    } catch (_e) { toast.error("Failed to delete"); }
  };

  const openEditTxn = (txn) => {
    setEditingTxn({ ...txn, editItems: [...(txn.items || [])], editPayment: txn.payment_method });
    setEditTxnOpen(true);
  };

  const updateEditItem = (idx, field, value) => {
    setEditingTxn(prev => {
      const items = [...prev.editItems];
      items[idx] = { ...items[idx], [field]: field === 'units' ? Math.max(0, parseInt(value) || 0) : value };
      return { ...prev, editItems: items };
    });
  };

  const removeEditItem = (idx) => {
    setEditingTxn(prev => ({ ...prev, editItems: prev.editItems.filter((_, i) => i !== idx) }));
  };

  const saveEditTxn = async () => {
    if (!activeSession || !editingTxn) return;
    const items = editingTxn.editItems.filter(i => i.units > 0);
    const total = items.reduce((s, i) => s + i.units * i.unit_price, 0);
    try {
      await axios.put(`${API}/market-mode/sessions/${activeSession.id}/transaction/${editingTxn.id}`, {
        items, total, payment_method: editingTxn.editPayment
      });
      setTransactions(prev => prev.map(t => t.id === editingTxn.id ? { ...t, items, total, payment_method: editingTxn.editPayment } : t));
      setEditTxnOpen(false);
      toast.success("Transaction updated");
    } catch (_e) { toast.error("Failed to update"); }
  };

  const endSessionSave = async () => {
    if (!activeSession) return;
    if (transactions.length === 0) { toast.error("No transactions to save"); return; }
    if (!window.confirm("End this market session and save all data? This creates a formal session + auto-backup.")) return;
    try {
      const res = await axios.post(`${API}/market-mode/sessions/${activeSession.id}/end`);
      toast.success(`Session saved! ${res.data.transactions} transactions.`);
      setActiveSession(null);
      setTransactions([]);
      setCurrentOrder({});
      setIdleMode(false);
    } catch (_e) { toast.error("Failed to end session"); }
  };

  // Totals
  const totalCash = transactions.filter(t => t.payment_method === "cash").reduce((a, t) => a + t.total, 0);
  const totalEftpos = transactions.filter(t => t.payment_method === "eftpos").reduce((a, t) => a + t.total, 0);
  const totalSales = totalCash + totalEftpos;
  const totalSessionUnits = transactions.reduce((a, t) => a + (t.items || []).reduce((b, i) => b + i.units, 0), 0);

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  const isTrainingMode = !activeSession;

  return (
    <div className="space-y-4" data-testid="market-mode">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Market Mode</h1>
          <p className="text-zinc-400 mt-1">
            {isTrainingMode ? "Training mode — tap products to practice" : (idleMode ? "PAUSED — unpause to continue" : "Live POS counter")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Session Indicator */}
          <div className="flex items-center gap-2 mr-2">
            <div className={`w-3 h-3 rounded-full ${activeSession ? (idleMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50') : 'bg-zinc-700'}`} data-testid="session-indicator" />
            <span className={`text-xs font-mono ${activeSession ? (idleMode ? 'text-amber-500' : 'text-emerald-500') : 'text-zinc-500'}`}>
              {activeSession ? (idleMode ? 'PAUSED' : 'LIVE') : 'TRAINING'}
            </span>
          </div>

          {!activeSession ? (
            <>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700" data-testid="market-select">
                  <SelectValue placeholder="Select Market" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {markets.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={startSession} className="bg-emerald-600 hover:bg-emerald-700" data-testid="start-session-btn">
                <Power className="w-4 h-4 mr-2" /> Start Session
              </Button>
            </>
          ) : (
            <>
              {/* Idle/Pause toggle */}
              <Button onClick={() => setIdleMode(!idleMode)} variant="outline"
                className={`border-zinc-700 ${idleMode ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-400 hover:bg-amber-500/10'}`}
                data-testid="idle-toggle-btn">
                {idleMode ? <><Play className="w-4 h-4 mr-1" /> Resume</> : <><Pause className="w-4 h-4 mr-1" /> Pause</>}
              </Button>
              {/* Export transactions */}
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                onClick={() => window.open(`${API}/export/market-transactions-excel`, '_blank')} data-testid="export-txns-btn">
                <Download className="w-4 h-4" />
              </Button>
              {/* End session */}
              <Button onClick={endSessionSave} className="bg-orange-500 hover:bg-orange-600" disabled={idleMode} data-testid="save-session-btn">
                <Save className="w-4 h-4 mr-2" /> Save & End
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Training Mode Banner */}
      {isTrainingMode && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-sm text-blue-400">Training Mode — products are clickable for practice. Start a session to record real transactions.</p>
        </div>
      )}

      {/* Idle Mode Banner */}
      {idleMode && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-sm text-amber-400">Session PAUSED — "Save & End" is locked. Press Resume to continue recording.</p>
        </div>
      )}

      {/* Running Totals */}
      {activeSession && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Units Sold", value: totalSessionUnits, color: "blue" },
            { label: "Total Sales", value: fmt(totalSales), color: "orange" },
            { label: "Cash", value: fmt(totalCash), color: "emerald" },
            { label: "EFTPOS", value: fmt(totalEftpos), color: "cyan" },
            { label: "Transactions", value: transactions.length, color: "purple" },
          ].map(k => (
            <Card key={k.label} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3">
                <p className="text-xs text-zinc-500">{k.label}</p>
                <p className={`text-lg font-bold font-heading text-${k.color}-500`}>{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Buttons — always enabled */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading text-zinc-50">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {products.map(p => {
                  const qty = currentOrder[p.id] || 0;
                  return (
                    <button key={p.id} onClick={() => addUnit(p.id)}
                      className={`relative p-3 rounded-lg border transition-all text-left hover:border-orange-500/50 hover:bg-zinc-800 cursor-pointer ${qty > 0 ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-800 bg-zinc-900'}`}
                      data-testid={`product-btn-${p.code}`}>
                      <p className="font-medium text-zinc-200 text-sm truncate">{p.name}</p>
                      <p className="text-orange-500 font-mono text-sm mt-1">{fmt(p.price)}</p>
                      {qty > 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">{qty}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Order & Payment */}
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading text-zinc-50">Current Order</CardTitle>
                <Button size="sm" variant="ghost" onClick={resetOrder} className="text-zinc-400 hover:text-zinc-200 h-8" data-testid="reset-order-btn">
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentUnits === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">Tap products to add items</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {Object.entries(currentOrder).map(([pid, qty]) => {
                    const p = products.find(pr => pr.id === pid);
                    if (!p) return null;
                    return (
                      <div key={pid} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeUnit(pid)} className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 hover:text-red-400 flex items-center justify-center text-xs">-</button>
                          <span className="text-zinc-200 text-sm">{p.name}</span>
                          <button onClick={() => addUnit(pid)} className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 hover:text-emerald-400 flex items-center justify-center text-xs">+</button>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-400 text-xs mr-2">x{qty}</span>
                          <span className="text-orange-500 font-mono text-sm">{fmt(p.price * qty)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <OrderSummary currentUnits={currentUnits} currentCOGS={currentCOGS} currentTotal={currentTotal} />

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button onClick={() => completeDone("cash")} disabled={currentUnits === 0 || idleMode}
                  className="bg-emerald-600 hover:bg-emerald-700 h-14 text-base" data-testid="pay-cash-btn">
                  <DollarSign className="w-5 h-5 mr-2" /> CASH
                </Button>
                <Button onClick={() => completeDone("eftpos")} disabled={currentUnits === 0 || idleMode}
                  className="bg-cyan-600 hover:bg-cyan-700 h-14 text-base" data-testid="pay-eftpos-btn">
                  <CreditCard className="w-5 h-5 mr-2" /> EFTPOS
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Log — editable */}
      {transactions.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading text-zinc-50 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-500" /> Transaction Log ({transactions.length})
              </CardTitle>
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 h-8"
                onClick={() => window.open(`${API}/export/market-transactions-excel`, '_blank')} data-testid="export-log-btn">
                <Download className="w-3 h-3 mr-1" /> Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[350px] overflow-y-auto">
              {[...transactions].reverse().map((txn, idx) => (
                <div key={txn.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group">
                  <button onClick={() => { setViewingTxn(txn); setViewTxnOpen(true); }} className="flex items-center gap-3 text-left flex-1 min-w-0" data-testid={`txn-${transactions.length - idx}`}>
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
                        <Button size="sm" variant="ghost" onClick={() => openEditTxn(txn)} className="text-zinc-600 hover:text-zinc-200 opacity-0 group-hover:opacity-100 h-7 w-7 p-0">
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteTxn(txn.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 h-7 w-7 p-0">
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
      )}

      {/* View Transaction Dialog */}
      <Dialog open={viewTxnOpen} onOpenChange={setViewTxnOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader><DialogTitle className="text-zinc-50 font-heading">Order Details</DialogTitle></DialogHeader>
          {viewingTxn && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Time</span>
                <span className="text-zinc-200 font-mono">{viewingTxn.timestamp?.slice(0, 19).replace('T', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Payment</span>
                <Badge className={viewingTxn.payment_method === 'cash' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-500'}>
                  {viewingTxn.payment_method.toUpperCase()}
                </Badge>
              </div>
              <div className="border-t border-zinc-800 pt-3 space-y-2">
                {(viewingTxn.items || []).map((item, i) => (
                  <div key={item.product_id || i} className="flex justify-between text-sm">
                    <span className="text-zinc-300">{item.product_name} x{item.units}</span>
                    <span className="text-orange-500 font-mono">{fmt(item.unit_price * item.units)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold pt-3 border-t border-zinc-800">
                <span className="text-zinc-200">Total</span>
                <span className="text-orange-500">{fmt(viewingTxn.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={editTxnOpen} onOpenChange={setEditTxnOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader><DialogTitle className="text-zinc-50 font-heading">Edit Transaction</DialogTitle></DialogHeader>
          {editingTxn && (
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
                    <Input type="number" min="0" value={item.units} onChange={e => updateEditItem(idx, 'units', e.target.value)}
                      className="w-16 bg-zinc-800 border-zinc-700 text-center text-sm h-8" />
                    <span className="text-orange-500 font-mono text-xs w-16 text-right">{fmt(item.units * item.unit_price)}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeEditItem(idx)} className="text-zinc-500 hover:text-red-500 h-7 w-7 p-0">
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
                <Button variant="outline" onClick={() => setEditTxnOpen(false)} className="flex-1 border-zinc-700">Cancel</Button>
                <Button onClick={saveEditTxn} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="save-edit-txn-btn">Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketMode;
