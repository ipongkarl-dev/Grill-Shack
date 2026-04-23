import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Clock, Send, CheckCircle, XCircle, FileText, Trash2, Printer, Pencil } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(v);

const STATUS_STYLES = {
  pending: { bg: "bg-amber-500/10 text-amber-500", icon: Clock },
  ordered: { bg: "bg-blue-500/10 text-blue-500", icon: Send },
  received: { bg: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle },
  cancelled: { bg: "bg-red-500/10 text-red-500", icon: XCircle },
};

export const POTable = ({ orders, onPrint, onEdit, onUpdateStatus, onDelete }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader>
      <CardTitle className="text-lg font-heading text-zinc-50 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-orange-500" /> Purchase Orders
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">PO #</TableHead>
              <TableHead className="text-zinc-400">Supplier</TableHead>
              <TableHead className="text-zinc-400 text-right">Items</TableHead>
              <TableHead className="text-zinc-400 text-right">Total</TableHead>
              <TableHead className="text-zinc-400 text-center">Status</TableHead>
              <TableHead className="text-zinc-400">Created</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No purchase orders yet</p>
                </TableCell>
              </TableRow>
            ) : orders.map(o => {
              const style = STATUS_STYLES[o.status] || STATUS_STYLES.pending;
              const StatusIcon = style.icon;
              return (
                <TableRow key={o.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="font-mono text-zinc-200">{o.po_number}</TableCell>
                  <TableCell className="text-zinc-300">{o.supplier_name}</TableCell>
                  <TableCell className="text-right font-mono text-zinc-300">{o.items?.length || 0}</TableCell>
                  <TableCell className="text-right font-mono text-orange-500">{fmt(o.total_estimated)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={style.bg}><StatusIcon className="w-3 h-3 mr-1" /> {o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-xs">
                    <div>{o.created_at?.slice(0, 10)}</div>
                    <div className="text-zinc-600">{o.created_at?.slice(11, 16)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onPrint(o)} className="text-zinc-400 hover:text-zinc-200" data-testid={`print-po-${o.po_number}`}>
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      {o.status === "pending" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => onEdit(o)} className="text-zinc-400 hover:text-zinc-200">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onUpdateStatus(o.id, "ordered")}
                            className="text-blue-400 hover:text-blue-300 text-xs" data-testid={`mark-ordered-${o.po_number}`}>
                            Ordered
                          </Button>
                        </>
                      )}
                      {o.status === "ordered" && (
                        <Button size="sm" variant="ghost" onClick={() => onUpdateStatus(o.id, "received")}
                          className="text-emerald-400 hover:text-emerald-300 text-xs" data-testid={`mark-received-${o.po_number}`}>
                          Received
                        </Button>
                      )}
                      {(o.status === "pending" || o.status === "cancelled") && (
                        <Button size="sm" variant="ghost" onClick={() => onDelete(o.id)} className="text-zinc-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);
