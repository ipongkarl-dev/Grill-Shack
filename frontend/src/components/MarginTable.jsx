import { Link } from "react-router-dom";
import { getCogsBadgeClass, getActionLink } from "../lib/chartUtils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { AlertTriangle, Zap, Eye } from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(value);

const getActionColor = (action) => {
  switch (action) {
    case 'PUSH HARD': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'CHECK PRICE': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'PROMOTE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
};

const getActionIcon = (action) => {
  switch (action) {
    case 'PUSH HARD': return <Zap className="w-3 h-3" />;
    case 'CHECK PRICE': return <AlertTriangle className="w-3 h-3" />;
    case 'PROMOTE': return <Eye className="w-3 h-3" />;
    default: return null;
  }
};

export const MarginTable = ({ marginData }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader>
      <CardTitle className="text-lg font-heading text-zinc-50">Menu Intelligence</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Product</TableHead>
              <TableHead className="text-zinc-400 text-right">Price</TableHead>
              <TableHead className="text-zinc-400 text-right">Unit Cost</TableHead>
              <TableHead className="text-zinc-400 text-right">COGS %</TableHead>
              <TableHead className="text-zinc-400 text-right">Profit/Unit</TableHead>
              <TableHead className="text-zinc-400 text-right">Lifetime Units</TableHead>
              <TableHead className="text-zinc-400 text-right">Lifetime Revenue</TableHead>
              <TableHead className="text-zinc-400 text-right">Lifetime Profit</TableHead>
              <TableHead className="text-zinc-400 text-center">Stock</TableHead>
              <TableHead className="text-zinc-400 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marginData.map((product) => (
              <TableRow key={product.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell>
                  <div>
                    <p className="font-medium text-zinc-200">{product.name}</p>
                    <p className="text-xs text-zinc-500">{product.code}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-zinc-200">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-right font-mono text-zinc-400">{formatCurrency(product.unit_cost)}</TableCell>
                <TableCell className="text-right">
                  <Badge className={getCogsBadgeClass(product.cogs_percent)}>{product.cogs_percent.toFixed(1)}%</Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-emerald-500">{formatCurrency(product.profit_per_order)}</TableCell>
                <TableCell className="text-right font-mono text-zinc-300">{product.lifetime_units.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-zinc-200">{formatCurrency(product.lifetime_revenue)}</TableCell>
                <TableCell className="text-right font-mono text-emerald-500">{formatCurrency(product.lifetime_profit)}</TableCell>
                <TableCell className="text-center font-mono text-zinc-300">
                  {product.current_stock <= 10 ? (
                    <Link to="/inventory" className="text-amber-500 hover:text-amber-400 underline underline-offset-2">{product.current_stock}</Link>
                  ) : product.current_stock}
                </TableCell>
                <TableCell className="text-center">
                  <Link to={getActionLink(product.action)} data-testid={`action-${product.code}`}>
                    <Badge className={`border cursor-pointer hover:opacity-80 transition-opacity ${getActionColor(product.action)}`}>
                      {getActionIcon(product.action)}
                      <span className="ml-1">{product.action}</span>
                    </Badge>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);
