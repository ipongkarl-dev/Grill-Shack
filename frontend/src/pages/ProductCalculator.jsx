import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { getCogsBadgeClass, getCogsColor } from "../lib/chartUtils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Calculator, Plus, Trash2, Save, Beaker, ArrowRight } from "lucide-react";

const formatCurrency = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(v);

const ProductCalculator = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productDetail, setProductDetail] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data);
    } catch (_e) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only module-level imports (API, axios, toast) and stable state setters used
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const loadIngredients = async (productId) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id === productId);
    setProductDetail(product);
    try {
      const res = await axios.get(`${API}/products/${productId}/ingredients`);
      setIngredients(res.data.ingredients || []);
    } catch (e) {
      setIngredients([]);
    }
  };

  const addRow = () => {
    setIngredients([...ingredients, { name: "", qty_per_order: 0, unit: "g", cost_per_unit: 0, total_cost: 0 }]);
  };

  const removeRow = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculate total_cost
    const qty = parseFloat(updated[index].qty_per_order) || 0;
    const cost = parseFloat(updated[index].cost_per_unit) || 0;
    updated[index].total_cost = qty * cost;
    setIngredients(updated);
  };

  const totalFoodCost = ingredients.reduce((acc, i) => acc + (i.total_cost || 0), 0);

  const saveIngredients = async () => {
    if (!selectedProduct) { toast.error("Select a product first"); return; }
    setSaving(true);
    try {
      await axios.put(`${API}/products/${selectedProduct}/ingredients`, { ingredients });
      toast.success("Ingredients saved & COGS updated!");
      fetchProducts(); // Refresh product list to reflect new food_cost
    } catch (e) { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  const previewPackaging = productDetail?.packaging_cost || 0;
  const previewTotal = totalFoodCost + previewPackaging;
  const previewPrice = productDetail?.price || 0;
  const previewCogs = previewPrice > 0 ? (previewTotal / previewPrice * 100) : 0;
  const previewProfit = previewPrice - previewTotal;

  return (
    <div className="space-y-6" data-testid="product-calculator">
      <div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Product Calculator</h1>
        <p className="text-zinc-400 mt-2">Break down ingredients per product to auto-calculate COGS</p>
      </div>

      {/* Product Selector */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-400">Select Product</Label>
              <Select value={selectedProduct} onValueChange={loadIngredients}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="calc-product-select">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.code}) - {formatCurrency(p.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProduct && (
              <div className="flex gap-3">
                <Button onClick={addRow} variant="outline" className="border-zinc-700 hover:bg-zinc-800" data-testid="add-ingredient-btn">
                  <Plus className="w-4 h-4 mr-1" /> Add Ingredient
                </Button>
                <Button onClick={saveIngredients} disabled={saving} className="bg-orange-500 hover:bg-orange-600" data-testid="save-ingredients-btn">
                  <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save & Update COGS"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedProduct && (
        <>
          {/* Ingredients Table */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
                <Beaker className="w-5 h-5 mr-2 text-orange-500" />
                Ingredients for {productDetail?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ingredients.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Beaker className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No ingredients added yet. Click "Add Ingredient" to start.</p>
                  <p className="text-xs mt-1">Current food cost uses the flat value: {formatCurrency(productDetail?.food_cost || 0)}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-2 text-xs text-zinc-500 uppercase tracking-wider px-1">
                    <div className="col-span-3">Ingredient</div>
                    <div className="col-span-2 text-right">Qty/Order</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-2 text-right">$/Unit</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-2"></div>
                  </div>
                  {ingredients.map((ing, idx) => (
                    <div key={ing.name || `ing-${idx}`} className="grid grid-cols-12 gap-2 items-center bg-zinc-800/50 rounded-lg p-2">
                      <div className="col-span-3">
                        <Input
                          value={ing.name}
                          onChange={e => updateRow(idx, 'name', e.target.value)}
                          className="bg-zinc-800 border-zinc-700 h-9 text-sm"
                          placeholder="e.g. Beef Patty"
                          data-testid={`ing-name-${idx}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.001"
                          value={ing.qty_per_order}
                          onChange={e => updateRow(idx, 'qty_per_order', e.target.value)}
                          className="bg-zinc-800 border-zinc-700 h-9 text-sm text-right"
                          data-testid={`ing-qty-${idx}`}
                        />
                      </div>
                      <div className="col-span-1">
                        <Select value={ing.unit} onValueChange={v => updateRow(idx, 'unit', v)}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="pcs">pcs</SelectItem>
                            <SelectItem value="each">each</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.0001"
                          value={ing.cost_per_unit}
                          onChange={e => updateRow(idx, 'cost_per_unit', e.target.value)}
                          className="bg-zinc-800 border-zinc-700 h-9 text-sm text-right"
                          data-testid={`ing-cost-${idx}`}
                        />
                      </div>
                      <div className="col-span-2 text-right font-mono text-orange-500 text-sm font-semibold">
                        {formatCurrency(ing.total_cost || 0)}
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => removeRow(idx)} className="text-zinc-500 hover:text-red-500 h-9">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* COGS Preview */}
          <Card className="bg-zinc-900 border-zinc-800 border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-orange-500" />
                COGS Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500 uppercase">Selling Price</p>
                  <p className="text-lg font-bold text-zinc-50 mt-1">{formatCurrency(previewPrice)}</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center flex flex-col items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-zinc-600" />
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500 uppercase">Food Cost</p>
                  <p className="text-lg font-bold text-red-400 mt-1">{formatCurrency(ingredients.length > 0 ? totalFoodCost : productDetail?.food_cost || 0)}</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500 uppercase">Packaging</p>
                  <p className="text-lg font-bold text-red-400 mt-1">{formatCurrency(previewPackaging)}</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500 uppercase">COGS %</p>
                  <p className={`text-lg font-bold mt-1 ${getCogsColor(previewCogs)}`}>
                    {previewCogs.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500 uppercase">Profit</p>
                  <p className="text-lg font-bold text-emerald-500 mt-1">{formatCurrency(previewProfit)}</p>
                </div>
              </div>
              {ingredients.length > 0 && (
                <p className="text-xs text-zinc-500 mt-3 text-center">
                  Saving will auto-update the product's food cost to {formatCurrency(totalFoodCost)} and recalculate COGS across all dashboards.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* All Products Overview */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-zinc-50">All Products COGS Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Product</TableHead>
                  <TableHead className="text-zinc-400 text-right">Price</TableHead>
                  <TableHead className="text-zinc-400 text-right">Food Cost</TableHead>
                  <TableHead className="text-zinc-400 text-right">Packaging</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total Cost</TableHead>
                  <TableHead className="text-zinc-400 text-right">COGS %</TableHead>
                  <TableHead className="text-zinc-400 text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(p => (
                  <TableRow
                    key={p.id}
                    className={`border-zinc-800 cursor-pointer transition-colors ${selectedProduct === p.id ? 'bg-orange-500/5' : 'hover:bg-zinc-800/50'}`}
                    onClick={() => loadIngredients(p.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-200">{p.name}</span>
                        <span className="text-xs text-zinc-500">({p.code})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-200">{formatCurrency(p.price)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">{formatCurrency(p.food_cost)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">{formatCurrency(p.packaging_cost)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">{formatCurrency(p.total_cost)}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={getCogsBadgeClass(p.cogs_percent)}>
                        {p.cogs_percent?.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-500">{formatCurrency(p.profit_per_order)}</TableCell>
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

export default ProductCalculator;
