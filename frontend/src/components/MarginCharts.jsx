import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { getCogsChartColor, getProfitChartColor, BAR_RADIUS_HORIZONTAL } from "../lib/chartUtils";

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(value);

const TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: '8px'
};

export const ProfitChart = ({ chartData }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader>
      <CardTitle className="text-lg font-heading text-zinc-50">Lifetime Profit by Product</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} width={40} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [formatCurrency(value), 'Profit']} />
            <Bar dataKey="profit" radius={BAR_RADIUS_HORIZONTAL}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getProfitChartColor(entry.profit)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export const CogsChart = ({ marginData }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader>
      <CardTitle className="text-lg font-heading text-zinc-50">COGS % by Product</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...marginData].sort((a, b) => b.cogs_percent - a.cogs_percent)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={(v) => `${v}%`} domain={[0, 50]} />
            <YAxis type="category" dataKey="code" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} width={40} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value.toFixed(1)}%`, 'COGS']} />
            <Bar dataKey="cogs_percent" radius={BAR_RADIUS_HORIZONTAL}>
              {marginData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCogsChartColor(entry.cogs_percent)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);
