import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Zap, DollarSign, CreditCard, RotateCcw, Save, Power, Check, Clock, ShoppingCart, Eye, ChevronDown } from "lucide-react";

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
  const [viewingTxn, setViewingTxn] = useState(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only module-level imports (API, axios, toast) and stable state setters used
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startSession = async () => {
    if (!selectedMarket) { toast.error("Select a market first"); return; }
    const market = markets.find(m => m.id === selectedMarket);
    try {
      const res = await axios.post(`${API}/market-mode/sessions`, {
        market_id: selectedMarket,
        market_name: market?.name || "Unknown"
      });
      setActiveSession(res.data);
      setTransactions([]);
      toast.success("Market session started!");
    } catch (_e) { toast.error("Failed to start session"); }
  };

  const addUnit = (productId) => {
    if (!activeSession) { toast.error("Start a new session first"); return; }
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
    if (!activeSession) return;
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
      toast.success(`Order #${transactions.length + 1} saved — ${paymentMethod.toUpperCase()}`);
    } catch (_e) { toast.error("Failed to record transaction"); }
  };

  const resetOrder = () => setCurrentOrder({});

  const endSessionSave = async () => {
    if (!activeSession) return;
    if (transactions.length === 0 && currentUnits === 0) { toast.error("No transactions to save"); return; }
    if (!window.confirm("End this market session and save all data? This will create a formal session record and auto-backup.")) return;
    try {
      const res = await axios.post(`${API}/market-mode/sessions/${activeSession.id}/end`);
      toast.success(`Session saved! ${res.data.transactions} transactions recorded.`);
      setActiveSession(null);
      setTransactions([]);
      setCurrentOrder({});
    } catch (_e) { toast.error("Failed to end session"); }
  };

  // Totals
  const totalCash = transactions.filter(t => t.payment_method === "cash").reduce((a, t) => a + t.total, 0);
  const totalEftpos = transactions.filter(t => t.payment_method === "eftpos").reduce((a, t) => a + t.total, 0);
  const totalSales = totalCash + totalEftpos;
  const totalSessionUnits = transactions.reduce((a, t) => a + (t.items || []).reduce((b, i) => b + i.units, 0), 0);

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-4" data-testid="market-mode">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Market Mode</h1>
          <p className="text-zinc-400 mt-1">Live POS counter for market day sales</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Session Indicator Light */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${activeSession ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-zinc-700'}`} data-testid="session-indicator" />
            <span className={`text-xs font-mono ${activeSession ? 'text-emerald-500' : 'text-zinc-500'}`}>
              {activeSession ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          {!activeSession ? (
            <div className="flex items-center gap-2">
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700" data-testid="market-select">
                  <SelectValue placeholder="Select Market" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {markets.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={startSession} className="bg-emerald-600 hover:bg-emerald-700" data-testid="start-session-btn">
                <Power className="w-4 h-4 mr-2" /> Start New Session
              </Button>
            </div>
          ) : (
            <Button onClick={endSessionSave} className="bg-orange-500 hover:bg-orange-600" data-testid="save-session-btn">
              <Save className="w-4 h-4 mr-2" /> Save & End Market
            </Button>
          )}
        </div>
      </div>

      {/* Running Totals Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3">
            <p className="text-xs text-zinc-500">Units Sold</p>
            <p className="text-lg font-bold font-heading text-blue-500">{totalSessionUnits}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3">
            <p className="text-xs text-zinc-500">Total Sales</p>
            <p className="text-lg font-bold font-heading text-orange-500">{fmt(totalSales)}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3">
            <p className="text-xs text-zinc-500">Cash</p>
            <p className="text-lg font-bold font-heading text-emerald-500">{fmt(totalCash)}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3">
            <p className="text-xs text-zinc-500">EFTPOS</p>
            <p className="text-lg font-bold font-heading text-cyan-500">{fmt(totalEftpos)}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3">
            <p className="text-xs text-zinc-500">Transactions</p>
            <p className="text-lg font-bold font-heading text-purple-500">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Buttons */}
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
                    <button key={p.id} onClick={() => addUnit(p.id)} disabled={!activeSession}
                      className={`relative p-3 rounded-lg border transition-all text-left ${activeSession ? 'hover:border-orange-500/50 hover:bg-zinc-800 cursor-pointer' : 'opacity-40 cursor-not-allowed'} ${qty > 0 ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-800 bg-zinc-900'}`}
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

              {/* Order Summary */}
              <div className="border-t border-zinc-800 pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Units</span><span className="text-zinc-200">{currentUnits}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">COGS</span><span className="text-red-400">{fmt(currentCOGS)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Profit</span><span className="text-emerald-500">{fmt(currentTotal - currentCOGS)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-zinc-800">
                  <span className="text-zinc-200">Total</span>
                  <span className="text-orange-500">{fmt(currentTotal)}</span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button onClick={() => completeDone("cash")} disabled={!activeSession || currentUnits === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 h-14 text-base" data-testid="pay-cash-btn">
                  <DollarSign className="w-5 h-5 mr-2" /> CASH
                </Button>
                <Button onClick={() => completeDone("eftpos")} disabled={!activeSession || currentUnits === 0}
                  className="bg-cyan-600 hover:bg-cyan-700 h-14 text-base" data-testid="pay-eftpos-btn">
                  <CreditCard className="w-5 h-5 mr-2" /> EFTPOS
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Log */}
      {transactions.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading text-zinc-50 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-500" /> Transaction Log ({transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {[...transactions].reverse().map((txn, idx) => (
                <button key={txn.id || idx} onClick={() => { setViewingTxn(txn); setViewTxnOpen(true); }}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left" data-testid={`txn-${transactions.length - idx}`}>
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs ${txn.payment_method === 'cash' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                      {txn.payment_method === 'cash' ? <DollarSign className="w-3 h-3 mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
                      {txn.payment_method.toUpperCase()}
                    </Badge>
                    <span className="text-zinc-400 text-xs font-mono">#{transactions.length - idx}</span>
                    <span className="text-zinc-500 text-xs">{txn.timestamp?.slice(11, 19)}</span>
                    <span className="text-zinc-400 text-xs">{(txn.items || []).map(i => `${i.product_name} x${i.units}`).join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-mono text-sm font-bold">{fmt(txn.total)}</span>
                    <Eye className="w-3 h-3 text-zinc-600" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Transaction Dialog */}
      <Dialog open={viewTxnOpen} onOpenChange={setViewTxnOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-50 font-heading">Order Details</DialogTitle>
          </DialogHeader>
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
    </div>
  );
};

export default MarketMode;
