import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency, getStatusBadgeClass } from "../lib/chartUtils";

export const CashSessionsTable = ({ sessions, onEdit, onDelete }) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800 hover:bg-transparent">
          <TableHead className="text-zinc-400">Session</TableHead>
          <TableHead className="text-zinc-400">Market</TableHead>
          <TableHead className="text-zinc-400 text-right">Cash</TableHead>
          <TableHead className="text-zinc-400 text-right">EFTPOS</TableHead>
          <TableHead className="text-zinc-400 text-right">Calculated</TableHead>
          <TableHead className="text-zinc-400 text-right">Collected</TableHead>
          <TableHead className="text-zinc-400 text-right">Variance</TableHead>
          <TableHead className="text-zinc-400 text-right">Expenses</TableHead>
          <TableHead className="text-zinc-400 text-center">Status</TableHead>
          <TableHead className="text-zinc-400 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <CashSessionRow key={session.id} session={session} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </TableBody>
    </Table>
  </div>
);

const getVarianceColor = (variance) => {
  if (variance > 0.5) return 'text-red-500';
  if (variance < -0.5) return 'text-blue-500';
  return 'text-emerald-500';
};

const CashSessionRow = ({ session, onEdit, onDelete }) => (
  <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
    <TableCell>
      <div>
        <p className="font-mono text-zinc-200">#{session.session_id}</p>
        <p className="text-xs text-zinc-500">{session.date}</p>
      </div>
    </TableCell>
    <TableCell className="text-zinc-300">{session.market_name}</TableCell>
    <TableCell className="text-right font-mono text-emerald-400">{formatCurrency(session.cash)}</TableCell>
    <TableCell className="text-right font-mono text-blue-400">{formatCurrency(session.eftpos)}</TableCell>
    <TableCell className="text-right font-mono text-zinc-300">{formatCurrency(session.calculated_sales)}</TableCell>
    <TableCell className="text-right font-mono text-zinc-200">{formatCurrency(session.total_collected)}</TableCell>
    <TableCell className="text-right font-mono">
      <span className={getVarianceColor(session.variance)}>{formatCurrency(session.variance)}</span>
    </TableCell>
    <TableCell className="text-right font-mono text-zinc-400">{formatCurrency(session.cash_expenses)}</TableCell>
    <TableCell className="text-center">
      <Badge className={getStatusBadgeClass(session.status)}>{session.status}</Badge>
    </TableCell>
    <TableCell className="text-center">
      <div className="flex justify-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onEdit(session)} className="text-zinc-400 hover:text-zinc-200" data-testid={`edit-session-${session.session_id}`}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(session.id)} className="text-zinc-400 hover:text-red-500" data-testid={`delete-session-${session.session_id}`}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
);
