import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Zap, ClipboardList, Package, Beaker, BarChart3,
  CalendarRange, GitCompare, Warehouse, Boxes, Receipt, DollarSign,
  Calculator, PiggyBank, Rocket, ClipboardCheck, Bell, TrendingUp,
  History, UsersRound, Truck, MapPin, ShoppingCart, Database, Settings,
  BookOpen, Menu, LogOut, User, X
} from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_kitchen-analytics-4/artifacts/rahsf0cf_Vector%20No%20Background.png";
const OWNER_ONLY = "owner";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/quick", icon: Zap, label: "Market Mode" },
  { path: "/session", icon: ClipboardList, label: "Session Input" },
  { path: "/products", icon: Package, label: "Products / COGS", role: OWNER_ONLY },
  { path: "/calculator", icon: Beaker, label: "Product Calculator", role: OWNER_ONLY },
  { path: "/sales", icon: BarChart3, label: "Sales Dashboard" },
  { path: "/weekly", icon: CalendarRange, label: "Weekly Control" },
  { path: "/compare", icon: GitCompare, label: "Market Comparison" },
  { path: "/stock", icon: Warehouse, label: "Stock Planner" },
  { path: "/inventory", icon: Boxes, label: "Inventory Tracker" },
  { path: "/refill", icon: Receipt, label: "Refill Trends" },
  { path: "/cash", icon: DollarSign, label: "Cash System" },
  { path: "/allocation", icon: Calculator, label: "Allocation Tool", role: OWNER_ONLY },
  { path: "/cashflow", icon: PiggyBank, label: "Cashflow Tracker", role: OWNER_ONLY },
  { path: "/scale", icon: Rocket, label: "Scale Planner", role: OWNER_ONLY },
  { path: "/prep", icon: ClipboardCheck, label: "Prep Checklist" },
  { path: "/alerts", icon: Bell, label: "Alerts" },
  { path: "/margin", icon: TrendingUp, label: "Margin Watch", role: OWNER_ONLY },
  { path: "/historical", icon: History, label: "Historical" },
  { path: "/staff", icon: UsersRound, label: "Staff Performance", role: OWNER_ONLY },
  { path: "/suppliers", icon: Truck, label: "Suppliers", role: OWNER_ONLY },
  { path: "/reorder", icon: ShoppingCart, label: "Auto-Reorder", role: OWNER_ONLY },
  { path: "/markets", icon: MapPin, label: "Markets", role: OWNER_ONLY },
  { path: "/data", icon: Database, label: "Data Repository", role: OWNER_ONLY },
  { path: "/settings", icon: Settings, label: "Settings" },
  { path: "/manual", icon: BookOpen, label: "Manual" },
];

export const Sidebar = ({ isOpen, setIsOpen, user, onLogout }) => {
  const location = useLocation();
  const filteredNavItems = NAV_ITEMS.filter(item => !item.role || user?.role === item.role);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Grill Shack" className="h-12 w-auto object-contain" />
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 hover:bg-zinc-800 rounded-lg">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-130px)]">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-zinc-800">
          {user && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{user.name || user.email}</p>
                  <p className="text-xs text-zinc-600 capitalize">{user.role}</p>
                </div>
              </div>
              <button onClick={onLogout} className="p-1.5 hover:bg-zinc-800 rounded-lg" data-testid="logout-btn">
                <LogOut className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          )}
          <p className="text-xs text-zinc-700 text-center">Grill Shack v3.0</p>
        </div>
      </aside>
    </>
  );
};
