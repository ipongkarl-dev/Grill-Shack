import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Package, Pencil, Trash2, FileText } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(v);

export const InventoryTable = ({ entries, onEdit, onDelete }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader>
      <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-orange-500" /> Purchase Log
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-zinc-400">Ingredient</TableHead>
              <TableHead className="text-zinc-400 text-right">Packs</TableHead>
              <TableHead className="text-zinc-400 text-right">Qty/Pack</TableHead>
              <TableHead className="text-zinc-400 text-right">Total Qty</TableHead>
              <TableHead className="text-zinc-400 text-right">Pack Cost</TableHead>
              <TableHead className="text-zinc-400 text-right">Cost/Unit</TableHead>
              <TableHead className="text-zinc-400">Supplier</TableHead>
              <TableHead className="text-zinc-400">Notes</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={10} className="text-center py-12 text-zinc-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No raw material purchases recorded yet</p>
                  <p className="text-xs mt-1">Record purchases to build cost history and auto-update COGS</p>
                </TableCell>
              </TableRow>
            ) : entries.map(e => (
              <TableRow key={e.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="text-zinc-300">{e.date}</TableCell>
                <TableCell className="font-medium text-zinc-200">{e.ingredient_name}</TableCell>
                <TableCell className="text-right font-mono text-zinc-300">{e.packs_in}</TableCell>
                <TableCell className="text-right font-mono text-zinc-300">{e.units_per_pack} {e.unit}</TableCell>
                <TableCell className="text-right font-mono text-emerald-500 font-semibold">{e.total_qty_added} {e.unit}</TableCell>
                <TableCell className="text-right font-mono text-orange-400">{fmt(e.pack_cost)}</TableCell>
                <TableCell className="text-right font-mono text-zinc-200">{fmt(e.cost_per_unit)}/{e.unit}</TableCell>
                <TableCell className="text-zinc-400">{e.supplier || '-'}</TableCell>
                <TableCell className="text-zinc-500 text-xs max-w-[150px] truncate">{e.notes || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(e)} className="text-zinc-400 hover:text-zinc-200"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(e.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);
