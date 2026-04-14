import { Input } from "./ui/input";
import { Label } from "./ui/label";

export const ProductSalesGrid = ({ products, sales, onSaleChange }) => (
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
            onChange={(e) => onSaleChange(product.id, e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-center"
            placeholder="0"
            data-testid={`product-${product.code}-input`}
          />
        </div>
      ))}
    </div>
  </div>
);
