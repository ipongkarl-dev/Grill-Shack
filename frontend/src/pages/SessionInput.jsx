import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, Plus, Save, Trash2 } from "lucide-react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2
  }).format(value);
};

const SessionInput = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [date, setDate] = useState(new Date());
  const [selectedMarket, setSelectedMarket] = useState("");
  const [cash, setCash] = useState("");
  const [eftpos, setEftpos] = useState("");
  const [openingFloat, setOpeningFloat] = useState("");
  const [cashExpenses, setCashExpenses] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [sales, setSales] = useState({});
  
  // Calculated values
  const [calculations, setCalculations] = useState({
    totalUnits: 0,
    calculatedSales: 0,
    totalCollected: 0,
    variance: 0,
    status: "OK",
    foodCogs: 0,
    packaging: 0,
    totalCogs: 0,
    grossProfit: 0,
    cogsPercent: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, marketsRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/markets`)
        ]);
        setProducts(productsRes.data);
        setMarkets(marketsRes.data);
        
        // Initialize sales object
        const initialSales = {};
        productsRes.data.forEach(p => {
          initialSales[p.id] = 0;
        });
        setSales(initialSales);
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Recalculate whenever sales or payments change
  useEffect(() => {
    let totalUnits = 0;
    let calculatedSales = 0;
    let foodCogs = 0;
    let packaging = 0;

    products.forEach(product => {
      const units = sales[product.id] || 0;
      totalUnits += units;
      calculatedSales += units * product.price;
      foodCogs += units * product.food_cost;
      packaging += units * product.packaging_cost;
    });

    const totalCogs = foodCogs + packaging;
    const grossProfit = calculatedSales - totalCogs;
    const cogsPercent = calculatedSales > 0 ? (totalCogs / calculatedSales) * 100 : 0;
    
    const cashVal = parseFloat(cash) || 0;
    const eftposVal = parseFloat(eftpos) || 0;
    const totalCollected = cashVal + eftposVal;
    const variance = calculatedSales - totalCollected;
    
    let status = "OK";
    if (totalCollected === 0 && calculatedSales > 0) {
      status = "Missing Payment";
    } else if (variance > 0.5) {
      status = "Under-collected";
    } else if (variance < -0.5) {
      status = "Over-collected";
    }

    setCalculations({
      totalUnits,
      calculatedSales,
      totalCollected,
      variance,
      status,
      foodCogs,
      packaging,
      totalCogs,
      grossProfit,
      cogsPercent
    });
  }, [sales, cash, eftpos, products]);
  const handleSaleChange = (productId, value) => {
    const numValue = parseInt(value) || 0;
    setSales(prev => ({
      ...prev,
      [productId]: Math.max(0, numValue)
    }));
  };

  const handleSubmit = async () => {
    if (!selectedMarket) {
      toast.error("Please select a market");
      return;
    }
    
    if (calculations.totalUnits === 0) {
      toast.error("Please enter at least one sale");
      return;
    }

    setSaving(true);
    try {
      const market = markets.find(m => m.id === selectedMarket);
      const salesList = Object.entries(sales)
        .filter(([_, units]) => units > 0)
        .map(([productId, units]) => ({
          product_id: productId,
          units_sold: units
        }));

      await axios.post(`${API}/sessions`, {
        date: format(date, "yyyy-MM-dd"),
        market_id: selectedMarket,
        market_name: market?.name || "",
        cash: parseFloat(cash) || 0,
        eftpos: parseFloat(eftpos) || 0,
        opening_float: parseFloat(openingFloat) || 0,
        cash_expenses: parseFloat(cashExpenses) || 0,
        expense_notes: expenseNotes,
        notes: notes,
        sales: salesList,
        created_by_id: user?.id || "",
        created_by_name: user?.name || "",
        created_by_role: user?.role || ""
      });

      toast.success("Session saved successfully!");
      
      // Reset form
      const resetSales = {};
      products.forEach(p => { resetSales[p.id] = 0; });
      setSales(resetSales);
      setCash("");
      setEftpos("");
      setOpeningFloat("");
      setCashExpenses("");
      setExpenseNotes("");
      setNotes("");
      
    } catch (error) {
      toast.error("Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OK": return "bg-emerald-500/10 text-emerald-500";
      case "Over-collected": return "bg-blue-500/10 text-blue-500";
      case "Under-collected": return "bg-amber-500/10 text-amber-500";
      default: return "bg-red-500/10 text-red-500";
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

  return (
    <div className="space-y-6" data-testid="session-input-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">
          Session Input
        </h1>
        <p className="text-zinc-400 mt-2">
          Record daily market session sales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Details */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50">
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date and Market */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                      data-testid="date-picker-btn"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Market</Label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger 
                    className="bg-zinc-800 border-zinc-700"
                    data-testid="market-select"
                  >
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {markets.map(market => (
                      <SelectItem key={market.id} value={market.id}>
                        {market.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Cash</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="0.00"
                  data-testid="cash-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">EFTPOS</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={eftpos}
                  onChange={(e) => setEftpos(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="0.00"
                  data-testid="eftpos-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Opening Float</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="0.00"
                  data-testid="float-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Cash Expenses</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cashExpenses}
                  onChange={(e) => setCashExpenses(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="0.00"
                  data-testid="expenses-input"
                />
              </div>
            </div>

            {/* Product Sales */}
            <div>
              <Label className="text-zinc-400 mb-3 block">Product Sales (Units)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {products.map(product => (
                  <div key={product.id} className="space-y-1">
                    <label className="text-xs text-zinc-500">{product.name}</label>
                    <Input
                      type="number"
                      min="0"
                      value={sales[product.id] || ""}
                      onChange={(e) => handleSaleChange(product.id, e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-center"
                      placeholder="0"
                      data-testid={`product-${product.code}-input`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Expense Notes</Label>
                <Input
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="e.g., Ice purchase"
                  data-testid="expense-notes-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Session Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="e.g., Busy day, ran out of ribs"
                  data-testid="session-notes-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="submit-session-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Session"}
            </Button>
          </CardContent>
        </Card>

        {/* Calculations Summary */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50">
              Session Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Badge */}
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Status</span>
              <Badge className={getStatusColor(calculations.status)}>
                {calculations.status}
              </Badge>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Units</span>
                <span className="font-mono text-zinc-200">{calculations.totalUnits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Calculated Sales</span>
                <span className="font-mono text-orange-500 font-semibold">
                  {formatCurrency(calculations.calculatedSales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Collected</span>
                <span className="font-mono text-zinc-200">
                  {formatCurrency(calculations.totalCollected)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Variance</span>
                <span className={`font-mono ${calculations.variance > 0 ? 'text-amber-500' : calculations.variance < 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                  {formatCurrency(calculations.variance)}
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Food COGS</span>
                <span className="font-mono text-zinc-200">
                  {formatCurrency(calculations.foodCogs)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Packaging</span>
                <span className="font-mono text-zinc-200">
                  {formatCurrency(calculations.packaging)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total COGS</span>
                <span className="font-mono text-red-400">
                  {formatCurrency(calculations.totalCogs)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">COGS %</span>
                <span className="font-mono text-zinc-200">
                  {calculations.cogsPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <div className="flex justify-between">
                <span className="text-zinc-400 font-medium">Gross Profit</span>
                <span className="font-mono text-emerald-500 font-bold text-lg">
                  {formatCurrency(calculations.grossProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SessionInput;
