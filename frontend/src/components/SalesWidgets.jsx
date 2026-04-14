import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { CHART_TOOLTIP_STYLE, getRankClass, CHART_AXIS_TICK, CHART_GRID_STROKE, CHART_AXIS_STROKE, formatCurrency, getCogsBadgeClass, getStatusBadgeClass } from "../lib/chartUtils";

export const SalesTrendChart = ({ data }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Monthly Sales &amp; Profit</CardTitle></CardHeader>
    <CardContent>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
            <XAxis dataKey="month" stroke={CHART_AXIS_STROKE} tick={CHART_AXIS_TICK} />
            <YAxis stroke={CHART_AXIS_STROKE} tick={CHART_AXIS_TICK} tickFormatter={v => `$${v/1000}k`} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={v => [formatCurrency(v), '']} />
            <Legend />
            <Area type="monotone" dataKey="sales" name="Sales" stroke="#f97316" fill="url(#salesGradient)" strokeWidth={2} />
            <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" fill="url(#profitGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export const ProductPerformanceTable = ({ products }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Product Performance</CardTitle></CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Product</TableHead>
              <TableHead className="text-zinc-400 text-right">Units Sold</TableHead>
              <TableHead className="text-zinc-400 text-right">Revenue</TableHead>
              <TableHead className="text-zinc-400 text-right">COGS</TableHead>
              <TableHead className="text-zinc-400 text-right">Profit</TableHead>
              <TableHead className="text-zinc-400 text-right">COGS %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, idx) => (
              <TableRow key={product.code} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                      ${idx === 0 ? 'bg-orange-500/20 text-orange-500' : idx === 1 ? 'bg-zinc-600/20 text-zinc-400' : idx === 2 ? 'bg-amber-600/20 text-amber-600' : 'bg-zinc-800 text-zinc-500'}`}>
                      #{idx + 1}
                    </div>
                    <div><p className="font-medium text-zinc-200">{product.name}</p><p className="text-xs text-zinc-500">{product.code}</p></div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-zinc-300">{product.units_sold.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-zinc-200">{formatCurrency(product.revenue)}</TableCell>
                <TableCell className="text-right font-mono text-red-400">{formatCurrency(product.cogs)}</TableCell>
                <TableCell className="text-right font-mono text-emerald-500">{formatCurrency(product.profit)}</TableCell>
                <TableCell className="text-right"><Badge className={getCogsBadgeClass(product.cogs_percent)}>{product.cogs_percent?.toFixed(1)}%</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

export const SessionsTable = ({ sessions }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader><CardTitle className="text-lg font-heading text-zinc-50">Recent Sessions</CardTitle></CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Session ID</TableHead>
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-zinc-400">Market</TableHead>
              <TableHead className="text-zinc-400 text-right">Units</TableHead>
              <TableHead className="text-zinc-400 text-right">Sales</TableHead>
              <TableHead className="text-zinc-400 text-right">COGS</TableHead>
              <TableHead className="text-zinc-400 text-right">Profit</TableHead>
              <TableHead className="text-zinc-400 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="font-mono text-zinc-400">#{session.session_id}</TableCell>
                <TableCell className="text-zinc-300">{session.date}</TableCell>
                <TableCell className="text-zinc-200">{session.market_name}</TableCell>
                <TableCell className="text-right font-mono text-zinc-300">{session.total_units}</TableCell>
                <TableCell className="text-right font-mono text-zinc-200">{formatCurrency(session.calculated_sales)}</TableCell>
                <TableCell className="text-right font-mono text-red-400">{formatCurrency(session.total_cogs)}</TableCell>
                <TableCell className="text-right font-mono text-emerald-500">{formatCurrency(session.gross_profit)}</TableCell>
                <TableCell className="text-right"><Badge className={getStatusBadgeClass(session.status)}>{session.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);
