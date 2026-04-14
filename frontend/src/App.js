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
  Beaker
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_kitchen-analytics-4/artifacts/rahsf0cf_Vector%20No%20Background.png";

// Sidebar Navigation
const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/quick", icon: Zap, label: "Quick Mode" },
    { path: "/session", icon: ClipboardList, label: "Session Input" },
    { path: "/products", icon: Package, label: "Products / COGS" },
    { path: "/calculator", icon: Beaker, label: "Product Calculator" },
    { path: "/sales", icon: BarChart3, label: "Sales Dashboard" },
    { path: "/stock", icon: Warehouse, label: "Stock Planner" },
    { path: "/inventory", icon: Boxes, label: "Inventory Tracker" },
    { path: "/cash", icon: DollarSign, label: "Cash System" },
    { path: "/allocation", icon: Calculator, label: "Allocation Tool" },
    { path: "/cashflow", icon: PiggyBank, label: "Cashflow Tracker" },
    { path: "/margin", icon: TrendingUp, label: "Margin Watch" },
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 text-center">
            Grill Shack Management v1.0
          </div>
        </div>
      </aside>
    </>
  );
};

// Main Layout
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
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
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Check if data exists
        const response = await axios.get(`${API}/products`);
        if (response.data.length === 0) {
          // Seed initial data
          await axios.post(`${API}/seed`);
          setSeeded(true);
          toast.success("Initial data loaded from Excel!");
        }
      } catch (error) {
        console.error("Error initializing app:", error);
        toast.error("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Flame className="w-16 h-16 text-orange-500 mx-auto animate-pulse" />
          <p className="mt-4 text-zinc-400 font-medium">Loading Grill Shack...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'hsl(0 0% 9%)',
            border: '1px solid hsl(0 0% 14.9%)',
            color: 'hsl(0 0% 98%)',
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quick" element={<QuickMode />} />
          <Route path="/session" element={<SessionInput />} />
          <Route path="/products" element={<Products />} />
          <Route path="/calculator" element={<ProductCalculator />} />
          <Route path="/sales" element={<SalesDashboard />} />
          <Route path="/stock" element={<StockPlanner />} />
          <Route path="/inventory" element={<InventoryTracker />} />
          <Route path="/cash" element={<CashSystem />} />
          <Route path="/allocation" element={<AllocationTool />} />
          <Route path="/cashflow" element={<CashflowTracker />} />
          <Route path="/margin" element={<MarginWatch />} />
          <Route path="/markets" element={<MarketsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
