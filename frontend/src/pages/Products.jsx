import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Plus, Pencil, Trash2, Package, AlertTriangle } from "lucide-react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2
  }).format(value);
};

const ProductDialog = ({ product, onSave, onClose, open }) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    unit: "pcs",
    price: "",
    food_cost: "",
    packaging_cost: "",
    opening_stock: "",
    reorder_point: "10"
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        code: product.code || "",
        unit: product.unit || "pcs",
        price: product.price?.toString() || "",
        food_cost: product.food_cost?.toString() || "",
        packaging_cost: product.packaging_cost?.toString() || "",
        opening_stock: product.opening_stock?.toString() || "",
        reorder_point: product.reorder_point?.toString() || "10"
      });
    } else {
      setFormData({
        name: "",
        code: "",
        unit: "pcs",
        price: "",
        food_cost: "",
        packaging_cost: "",
        opening_stock: "",
        reorder_point: "10"
      });
    }
  }, [product, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.price) {
      toast.error("Please fill in required fields");
      return;
    }

    onSave({
      ...formData,
      price: parseFloat(formData.price) || 0,
      food_cost: parseFloat(formData.food_cost) || 0,
      packaging_cost: parseFloat(formData.packaging_cost) || 0,
      opening_stock: parseInt(formData.opening_stock) || 0,
      reorder_point: parseInt(formData.reorder_point) || 10
    });
  };

  // Calculate preview
  const price = parseFloat(formData.price) || 0;
  const foodCost = parseFloat(formData.food_cost) || 0;
  const packagingCost = parseFloat(formData.packaging_cost) || 0;
  const totalCost = foodCost + packagingCost;
  const cogsPercent = price > 0 ? (totalCost / price * 100) : 0;
  const profit = price - totalCost;

  return (
    <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
      <DialogHeader>
        <DialogTitle className="text-zinc-50 font-heading">
          {product ? "Edit Product" : "Add Product"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(p => ({...p, name: e.target.value}))}
              className="bg-zinc-800 border-zinc-700"
              placeholder="BBQ Ribs"
              data-testid="product-name-input"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Code *</Label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(p => ({...p, code: e.target.value.toUpperCase()}))}
              className="bg-zinc-800 border-zinc-700"
              placeholder="BR"
              maxLength={3}
              data-testid="product-code-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Selling Price (NZD) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(p => ({...p, price: e.target.value}))}
              className="bg-zinc-800 border-zinc-700"
              placeholder="20.50"
              data-testid="product-price-input"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Unit</Label>
            <Input
              value={formData.unit}
              onChange={(e) => setFormData(p => ({...p, unit: e.target.value}))}
              className="bg-zinc-800 border-zinc-700"
              placeholder="pcs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Food Cost</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.food_cost}
              onChange={(e) => setFormData(p => ({...p, food_cost: e.target.value}))}
              className="bg-zinc-800 border-zinc-700"
              placeholder="5.26"
              data-testid="product-food-cost-input"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Packaging Cost</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.packaging_cost}
              onChange={(e) => setFormData(p => ({...p, packaging_cost: e.target.value}))}
              className="bg-zinc-800 border-zinc-700"
              placeholder="0.50"
              data-testid="product-packaging-cost-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Opening Stock</Label>
            <Input
              type="number"
              value={formData.opening_stock}
              onChange={(e) => setFormData(p => ({...p, opening_stock: e.target.value}))}
              className="bg-zinc-800 border-zinc-700"
              placeholder="50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Reorder Point</Label>
            <Input
              type="number"
              value={formData.reorder_point}
              onChange={(e) => setFormData(p => ({...p, reorder_point: e.target.value}))}
              className="bg-zinc-800 border-zinc-700"
              placeholder="10"
            />
          </div>
        </div>

        {/* COGS Preview */}
        <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">COGS Preview</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">Total Cost</p>
              <p className="font-mono text-zinc-200">{formatCurrency(totalCost)}</p>
            </div>
            <div>
              <p className="text-zinc-500">COGS %</p>
              <p className={`font-mono ${cogsPercent > 35 ? 'text-red-500' : 'text-emerald-500'}`}>
                {cogsPercent.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Profit</p>
              <p className="font-mono text-emerald-500">{formatCurrency(profit)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-zinc-700 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            data-testid="save-product-btn"
          >
            {product ? "Update" : "Add"} Product
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (_err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only module-level imports (API, axios, toast) and stable state setters used
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = async (data) => {
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, data);
        toast.success("Product updated");
      } else {
        await axios.post(`${API}/products`, data);
        toast.success("Product added");
      }
      setDialogOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (_err) {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch (_err) {
      toast.error("Failed to delete product");
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingProduct(null);
    setDialogOpen(true);
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
    <div className="space-y-6" data-testid="products-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">
            Products & COGS
          </h1>
          <p className="text-zinc-400 mt-2">
            Manage menu items, pricing, and cost calculations
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={openNew}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="add-product-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <ProductDialog 
            product={editingProduct}
            onSave={handleSave}
            onClose={() => {
              setDialogOpen(false);
              setEditingProduct(null);
            }}
            open={dialogOpen}
          />
        </Dialog>
      </div>

      {/* Products Table */}
      <Card className="bg-zinc-900 border-zinc-800">
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
                  <TableHead className="text-zinc-400 text-right">Stock</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className="border-zinc-800 hover:bg-zinc-800/50"
                    data-testid={`product-row-${product.code}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <Package className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-200">{product.name}</p>
                          <p className="text-xs text-zinc-500">{product.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-200">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">
                      {formatCurrency(product.food_cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">
                      {formatCurrency(product.packaging_cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {formatCurrency(product.total_cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        className={
                          product.cogs_percent > 35 
                            ? "bg-red-500/10 text-red-500" 
                            : product.cogs_percent > 25
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }
                      >
                        {product.cogs_percent?.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-500">
                      {formatCurrency(product.profit_per_order)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {product.current_stock <= product.reorder_point && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className={`font-mono ${
                          product.current_stock <= product.reorder_point 
                            ? 'text-amber-500' 
                            : 'text-zinc-300'
                        }`}>
                          {product.current_stock}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(product)}
                          className="text-zinc-400 hover:text-zinc-200"
                          data-testid={`edit-product-${product.code}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(product.id)}
                          className="text-zinc-400 hover:text-red-500"
                          data-testid={`delete-product-${product.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-bold font-heading text-zinc-50 mt-1">{products.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Avg COGS %</p>
            <p className="text-2xl font-bold font-heading text-orange-500 mt-1">
              {(products.reduce((acc, p) => acc + (p.cogs_percent || 0), 0) / products.length).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Low Stock Items</p>
            <p className="text-2xl font-bold font-heading text-amber-500 mt-1">
              {products.filter(p => p.current_stock <= p.reorder_point).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Products;
