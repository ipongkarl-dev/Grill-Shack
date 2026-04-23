import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Menu, Bell } from "lucide-react";
import { Sidebar } from "./components/AppSidebar";

// Pages
import Dashboard from "./pages/Dashboard";
import SessionInput from "./pages/SessionInput";
import Products from "./pages/Products";
import SalesDashboard from "./pages/SalesDashboard";
import StockPlanner from "./pages/StockPlanner";
import CashSystem from "./pages/CashSystem";
import AllocationTool from "./pages/AllocationTool";
import MarginWatch from "./pages/MarginWatch";
import MarketMode from "./pages/MarketMode";
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
import ReorderPage from "./pages/ReorderPage";
import DataRepository from "./pages/DataRepository";
import SettingsPage from "./pages/SettingsPage";
import ManualPage from "./pages/ManualPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_kitchen-analytics-4/artifacts/rahsf0cf_Vector%20No%20Background.png";

// Alert Bell
const AlertBell = () => {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    axios.get(`${API}/alerts`).then(r => setCount(r.data.length)).catch(() => {});
  }, []);
  return (
    <button onClick={() => navigate('/alerts')} className="relative p-2 hover:bg-zinc-800 rounded-lg" data-testid="alert-bell">
      <Bell className="w-5 h-5 text-zinc-400" />
      {count > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{count}</span>}
    </button>
  );
};

// Layout
const Layout = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} user={user} onLogout={onLogout} />
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 z-30 flex items-center justify-between px-4">
        <div className="flex items-center">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-zinc-800 rounded-lg" data-testid="mobile-menu-btn">
            <Menu className="w-6 h-6 text-zinc-400" />
          </button>
          <img src={LOGO_URL} alt="Grill Shack" className="h-10 w-auto object-contain ml-3" />
        </div>
        {user && <AlertBell />}
      </header>
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        {user && (
          <div className="hidden lg:flex items-center justify-end p-3 border-b border-zinc-800/50">
            <AlertBell />
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

// Owner route guard
const OwnerRoute = ({ user, children }) => {
  if (user?.role !== 'owner') return <Navigate to="/" replace />;
  return children;
};

// App
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/auth/me`, { withCredentials: true })
      .then(r => { setUser(r.data); })
      .catch(() => { setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  const handleLogout = async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); } catch (err) { console.error('Logout error:', err); }
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <BrowserRouter>
      <LoginPage onLogin={handleLogin} />
      <Toaster theme="dark" position="top-right" />
    </BrowserRouter>
  );

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quick" element={<MarketMode user={user} />} />
          <Route path="/session" element={<SessionInput user={user} />} />
          <Route path="/products" element={<OwnerRoute user={user}><Products /></OwnerRoute>} />
          <Route path="/calculator" element={<OwnerRoute user={user}><ProductCalculator /></OwnerRoute>} />
          <Route path="/sales" element={<SalesDashboard />} />
          <Route path="/weekly" element={<WeeklyControl />} />
          <Route path="/compare" element={<MarketComparison />} />
          <Route path="/stock" element={<StockPlanner />} />
          <Route path="/inventory" element={<InventoryTracker />} />
          <Route path="/refill" element={<RefillTrends />} />
          <Route path="/cash" element={<CashSystem />} />
          <Route path="/allocation" element={<OwnerRoute user={user}><AllocationTool /></OwnerRoute>} />
          <Route path="/cashflow" element={<OwnerRoute user={user}><CashflowTracker /></OwnerRoute>} />
          <Route path="/scale" element={<OwnerRoute user={user}><ScalePlanner /></OwnerRoute>} />
          <Route path="/prep" element={<PrepChecklist />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/margin" element={<OwnerRoute user={user}><MarginWatch /></OwnerRoute>} />
          <Route path="/historical" element={<HistoricalComparison />} />
          <Route path="/staff" element={<OwnerRoute user={user}><StaffPerformance /></OwnerRoute>} />
          <Route path="/suppliers" element={<OwnerRoute user={user}><SupplierDirectory /></OwnerRoute>} />
          <Route path="/reorder" element={<OwnerRoute user={user}><ReorderPage /></OwnerRoute>} />
          <Route path="/markets" element={<OwnerRoute user={user}><MarketsPage /></OwnerRoute>} />
          <Route path="/data" element={<OwnerRoute user={user}><DataRepository /></OwnerRoute>} />
          <Route path="/settings" element={<SettingsPage user={user} />} />
          <Route path="/manual" element={<ManualPage />} />
        </Routes>
      </Layout>
      <Toaster theme="dark" position="top-right" />
    </BrowserRouter>
  );
}

export default App;
