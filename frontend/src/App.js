import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  BarChart3, 
  Calculator, 
  Warehouse, 
  DollarSign,
  TrendingUp,
  Flame,
  Menu,
  X,
  Zap,
  MapPin,
  Boxes,
  PiggyBank,
  Beaker,
  GitCompare,
  CalendarRange,
  Receipt,
  Rocket,
  ClipboardCheck,
  Bell,
  Truck,
  History,
  LogOut,
  User,
  UsersRound
} from "lucide-react";

// Pages
import Dashboard from "./pages/Dashboard";
import SessionInput from "./pages/SessionInput";
import Products from "./pages/Products";
import SalesDashboard from "./pages/SalesDashboard";
import StockPlanner from "./pages/StockPlanner";
import CashSystem from "./pages/CashSystem";
import AllocationTool from "./pages/AllocationTool";
import MarginWatch from "./pages/MarginWatch";
import QuickMode from "./pages/QuickMode";
import MarketsPage from "./pages/MarketsPage";
import InventoryTracker from "./pages/InventoryTracker";
import CashflowTracker from "./pages/CashflowTracker";
import ProductCalculator from "./pages/ProductCalculator";
import MarketComparison from "./pages/MarketComparison";
import WeeklyControl from "./pages/WeeklyControl";
import RefillTrends from "./pages/RefillTrends";
import ScalePlanner from "./pages/ScalePlanner";
import PrepChecklist from "./pages/PrepChecklist";
import AlertsPage from "./pages/AlertsPage";
import LoginPage from "./pages/LoginPage";
import SupplierDirectory from "./pages/SupplierDirectory";
import HistoricalComparison from "./pages/HistoricalComparison";
import StaffPerformance from "./pages/StaffPerformance";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_kitchen-analytics-4/artifacts/rahsf0cf_Vector%20No%20Background.png";

// Sidebar Navigation
const Sidebar = ({ isOpen, setIsOpen, user, onLogout }) => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/quick", icon: Zap, label: "Quick Mode" },
    { path: "/session", icon: ClipboardList, label: "Session Input" },
    { path: "/products", icon: Package, label: "Products / COGS" },
    { path: "/calculator", icon: Beaker, label: "Product Calculator" },
    { path: "/sales", icon: BarChart3, label: "Sales Dashboard" },
    { path: "/weekly", icon: CalendarRange, label: "Weekly Control" },
    { path: "/compare", icon: GitCompare, label: "Market Comparison" },
    { path: "/stock", icon: Warehouse, label: "Stock Planner" },
    { path: "/inventory", icon: Boxes, label: "Inventory Tracker" },
    { path: "/refill", icon: Receipt, label: "Refill Trends" },
    { path: "/cash", icon: DollarSign, label: "Cash System" },
    { path: "/allocation", icon: Calculator, label: "Allocation Tool" },
    { path: "/cashflow", icon: PiggyBank, label: "Cashflow Tracker" },
    { path: "/scale", icon: Rocket, label: "Scale Planner" },
    { path: "/prep", icon: ClipboardCheck, label: "Prep Checklist" },
    { path: "/alerts", icon: Bell, label: "Alerts" },
    { path: "/margin", icon: TrendingUp, label: "Margin Watch" },
    { path: "/historical", icon: History, label: "Historical" },
    { path: "/staff", icon: UsersRound, label: "Staff Performance" },
    { path: "/suppliers", icon: Truck, label: "Suppliers" },
    { path: "/markets", icon: MapPin, label: "Markets" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 z-50
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-20 flex items-center justify-center px-4 border-b border-zinc-800">
          <img src={LOGO_URL} alt="Grill Shack" className="h-16 w-auto object-contain" />
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-130px)]">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive 
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }
              `}
              data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        {/* Footer */}
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
          <div className="text-xs text-zinc-600 text-center">
            Grill Shack v2.0
          </div>
        </div>
      </aside>
    </>
  );
};

// Main Layout
const Layout = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} user={user} onLogout={onLogout} />
      
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 z-30 flex items-center px-4">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-zinc-800 rounded-lg"
          data-testid="mobile-menu-btn"
        >
          <Menu className="w-6 h-6 text-zinc-400" />
        </button>
        <div className="flex items-center ml-4">
          <img src={LOGO_URL} alt="Grill Shack" className="h-10 w-auto object-contain" />
        </div>
      </header>
      
      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const meRes = await axios.get(`${API}/auth/me`, { withCredentials: true }).catch(() => null);
        if (meRes?.data?.id) setUser(meRes.data);
        const response = await axios.get(`${API}/products`);
        if (response.data.length === 0) {
          await axios.post(`${API}/seed`);
          toast.success("Initial data loaded from Excel!");
        }
      } catch (_err) {
        toast.error("Failed to initialize app");
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.token) axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  const handleLogout = async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); } catch (err) { console.error('Logout error:', err); }
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success("Logged out");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Flame className="w-16 h-16 text-orange-500 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ style: { background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 14.9%)', color: 'hsl(0 0% 98%)' } }} />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 14.9%)', color: 'hsl(0 0% 98%)' } }} />
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quick" element={<QuickMode user={user} />} />
          <Route path="/session" element={<SessionInput user={user} />} />
          <Route path="/products" element={<Products />} />
          <Route path="/calculator" element={<ProductCalculator />} />
          <Route path="/sales" element={<SalesDashboard />} />
          <Route path="/weekly" element={<WeeklyControl />} />
          <Route path="/compare" element={<MarketComparison />} />
          <Route path="/stock" element={<StockPlanner />} />
          <Route path="/inventory" element={<InventoryTracker />} />
          <Route path="/refill" element={<RefillTrends />} />
          <Route path="/cash" element={<CashSystem />} />
          <Route path="/allocation" element={<AllocationTool />} />
          <Route path="/cashflow" element={<CashflowTracker />} />
          <Route path="/scale" element={<ScalePlanner />} />
          <Route path="/prep" element={<PrepChecklist />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/margin" element={<MarginWatch />} />
          <Route path="/historical" element={<HistoricalComparison />} />
          <Route path="/staff" element={<StaffPerformance />} />
          <Route path="/suppliers" element={<SupplierDirectory />} />
          <Route path="/markets" element={<MarketsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
