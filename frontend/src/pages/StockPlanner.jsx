import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Warehouse, AlertTriangle, CheckCircle, Calculator, RefreshCw } from "lucide-react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2
  }).format(value);
};

const StockPlanner = () => {
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState("");
  const [targetRevenue, setTargetRevenue] = useState("1000");
  const [stockPlan, setStockPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await axios.get(`${API}/markets`);
        setMarkets(response.data);
      } catch (error) {
        console.error("Error fetching markets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  const calculateStockPlan = async () => {
    setCalculating(true);
    try {
      const params = new URLSearchParams({
        target_revenue: targetRevenue
      });
      if (selectedMarket) {
        params.append("market_id", selectedMarket);
      }
      
      const response = await axios.get(`${API}/stock-planner?${params}`);
      setStockPlan(response.data);
    } catch (error) {
      console.error("Error calculating stock plan:", error);
      toast.error("Failed to calculate stock plan");
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    calculateStockPlan();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  const toBuyItems = stockPlan?.stock_plan?.filter(item => item.status === 'Buy/Prep') || [];
  const coveredItems = stockPlan?.stock_plan?.filter(item => item.status === 'Covered') || [];
  const lowStockItems = stockPlan?.stock_plan?.filter(item => item.stock_alert === 'LOW') || [];
  const totalEstimatedCogs = stockPlan?.stock_plan?.reduce((acc, item) => acc + item.estimated_cogs, 0) || 0;

  return (
    <div className="space-y-6" data-testid="stock-planner">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">
          Stock Planner
        </h1>
        <p className="text-zinc-400 mt-2">
          Plan stock requirements based on target revenue and historical sales mix
        </p>
      </div>

      {/* Controls */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-400">Target Market (Optional)</Label>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="market-filter">
                  <SelectValue placeholder="All Markets" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="">All Markets</SelectItem>
                  {markets.map(market => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-400">Target Revenue (NZD)</Label>
              <Input
                type="number"
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
                placeholder="1000"
                data-testid="target-revenue-input"
              />
            </div>
            
            <Button
              onClick={calculateStockPlan}
              disabled={calculating}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="calculate-btn"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {calculating ? "Calculating..." : "Calculate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Warehouse className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Target Revenue</p>
                <p className="text-xl font-bold font-heading text-orange-500">
                  {formatCurrency(parseFloat(targetRevenue) || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">To Buy/Prep</p>
                <p className="text-xl font-bold font-heading text-red-500">
                  {toBuyItems.length} items
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Covered</p>
                <p className="text-xl font-bold font-heading text-emerald-500">
                  {coveredItems.length} items
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <RefreshCw className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Est. COGS</p>
                <p className="text-xl font-bold font-heading text-zinc-50">
                  {formatCurrency(totalEstimatedCogs)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Plan Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
            <Warehouse className="w-5 h-5 mr-2 text-orange-500" />
            Stock Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Product</TableHead>
                  <TableHead className="text-zinc-400 text-right">Sales Mix %</TableHead>
                  <TableHead className="text-zinc-400 text-right">Est. Orders</TableHead>
                  <TableHead className="text-zinc-400 text-right">Current Stock</TableHead>
                  <TableHead className="text-zinc-400 text-right">Gap</TableHead>
                  <TableHead className="text-zinc-400 text-right">Est. COGS</TableHead>
                  <TableHead className="text-zinc-400 text-center">Stock Alert</TableHead>
                  <TableHead className="text-zinc-400 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockPlan?.stock_plan?.map((item) => (
                  <TableRow 
                    key={item.product_id} 
                    className="border-zinc-800 hover:bg-zinc-800/50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-zinc-200">{item.product_name}</p>
                        <p className="text-xs text-zinc-500">{item.code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {item.sales_mix_percent.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-200">
                      {item.estimated_orders}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {item.current_stock}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={item.gap_to_buy > 0 ? 'text-red-500' : 'text-emerald-500'}>
                        {item.gap_to_buy > 0 ? `+${item.gap_to_buy}` : item.gap_to_buy}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {formatCurrency(item.estimated_cogs)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.stock_alert === 'LOW' ? (
                        <Badge className="bg-amber-500/10 text-amber-500">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          LOW
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-500">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={
                          item.status === 'Covered' 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Shopping List */}
      {toBuyItems.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Items to Buy/Prep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {toBuyItems.map((item) => (
                <div 
                  key={item.product_id}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-red-500/20"
                >
                  <div>
                    <p className="font-medium text-zinc-200">{item.product_name}</p>
                    <p className="text-sm text-zinc-500">Current: {item.current_stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-500">+{item.gap_to_buy}</p>
                    <p className="text-xs text-zinc-500">units needed</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StockPlanner;
