import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { BookOpen, ArrowRight, LayoutDashboard, ClipboardList, Package, BarChart3, Warehouse, DollarSign, TrendingUp, Database, Settings, Zap } from "lucide-react";

const Section = ({ icon: Icon, title, steps, color = "orange" }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-heading text-zinc-50 flex items-center">
        <Icon className={`w-5 h-5 mr-2 text-${color}-500`} /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Badge className="bg-zinc-800 text-zinc-400 text-xs min-w-[20px] justify-center mt-0.5">{i + 1}</Badge>
            <span className="text-zinc-300">{step}</span>
          </li>
        ))}
      </ol>
    </CardContent>
  </Card>
);

const ManualPage = () => (
  <div className="space-y-6" data-testid="manual-page">
    <div>
      <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">User Manual</h1>
      <p className="text-zinc-400 mt-2">Step-by-step guide to using Grill Shack Management</p>
    </div>

    {/* Getting Started */}
    <Card className="bg-zinc-900 border-zinc-800 border-orange-500/20">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="w-6 h-6 text-orange-500 mt-0.5" />
          <div>
            <p className="text-zinc-200 font-semibold">Quick Start Guide</p>
            <p className="text-sm text-zinc-400 mt-1">The typical daily workflow is: <span className="text-orange-500">Session Input</span> (record sales) <ArrowRight className="w-3 h-3 inline mx-1" /> <span className="text-emerald-500">Dashboard</span> (check performance) <ArrowRight className="w-3 h-3 inline mx-1" /> <span className="text-blue-500">Stock Planner</span> (plan next session). All costs update automatically when you record raw material purchases in the Inventory Tracker.</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section icon={LayoutDashboard} title="Dashboard" steps={[
        "View total sales, gross profit, and NET profit at a glance",
        "NET profit deducts GST and cash expenses from gross profit",
        "Check market performance pie chart to see which markets perform best",
        "Low stock alerts link directly to Inventory Tracker for restocking",
      ]} />

      <Section icon={Zap} title="Quick Mode" color="amber" steps={[
        "Use Quick Mode for fast sales entry during busy market days",
        "Select the market, then tap product buttons to add units",
        "Enter cash and EFTPOS totals at the end",
        "Hit Save to record the session instantly",
      ]} />

      <Section icon={ClipboardList} title="Session Input" color="blue" steps={[
        "Select the date and market from the dropdowns",
        "Enter units sold for each product in the grid",
        "Enter Cash, EFTPOS, Opening Float, and any Cash Expenses",
        "The Session Summary panel on the right auto-calculates COGS and profit",
        "Click Save Session — stock levels update automatically",
      ]} />

      <Section icon={Package} title="Products & COGS" color="emerald" steps={[
        "Add or edit products with price, food cost, and packaging cost",
        "COGS % is auto-calculated from (food cost + packaging) / price",
        "Use Product Calculator to define ingredient recipes for each product",
        "When you log raw material purchases in Inventory, ingredient costs flow through to product COGS automatically",
      ]} />

      <Section icon={Warehouse} title="Inventory Tracker & Stock Planner" color="red" steps={[
        "Record raw material purchases: ingredient name, packs, qty per pack, cost",
        "Cost-per-unit updates linked product ingredients automatically",
        "Stock Planner shows what to buy based on target revenue and sales mix",
        "Use Auto-Reorder to generate purchase orders for low-stock items",
      ]} />

      <Section icon={BarChart3} title="Sales Dashboard & Historical" color="purple" steps={[
        "Sales Dashboard shows monthly trends, product performance, and all sessions",
        "Use Export buttons to download data to MS Excel",
        "'Monthly by Market' download shows sales breakdown by market per month",
        "Historical Comparison shows week-over-week and month-over-month growth with clear labels",
      ]} />

      <Section icon={DollarSign} title="Cash System & Allocation" color="cyan" steps={[
        "Cash System shows session-level cash reconciliation (cash vs calculated sales)",
        "Allocation Tool splits weekly profit into Owner Pay, Growth, Emergency, and Buffer",
        "Adjust allocation percentages with sliders (must total 100%)",
        "Cashflow Tracker sets monthly sales targets and tracks actuals",
      ]} />

      <Section icon={TrendingUp} title="Margin Watch" steps={[
        "See each product's COGS %, profit per unit, and lifetime profit",
        "Action recommendations: PUSH HARD (high profit), CHECK PRICE (high COGS), PROMOTE (low volume)",
        "Click action badges to navigate to relevant pages for follow-up",
      ]} />

      <Section icon={Database} title="Data Repository & Backups" color="emerald" steps={[
        "Create snapshots to preserve current product configs and session summaries",
        "Snapshots serve as historical lookback basis for Stock Planner decisions",
        "Edit snapshot labels and notes for rectification (owner password protected)",
        "Download full JSON backup for external safekeeping (Safe Mode)",
        "Restore from backup to recover all data in case of emergency",
      ]} />

      <Section icon={Settings} title="Settings & Password" color="zinc" steps={[
        "Change your login password from the Settings page",
        "Enter current password, then new password (min 6 characters)",
        "All Excel export buttons are also accessible from Settings for convenience",
        "Staff users see a limited set of pages — owner can manage all modules",
      ]} />
    </div>

    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-5 text-center">
        <p className="text-sm text-zinc-500">Grill Shack Management v2.0 — Built for NZ market traders</p>
        <p className="text-xs text-zinc-600 mt-1">All amounts in NZD. GST rate configurable in Allocation Tool settings.</p>
      </CardContent>
    </Card>
  </div>
);

export default ManualPage;
