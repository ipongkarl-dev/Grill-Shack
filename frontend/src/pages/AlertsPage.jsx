import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Bell, AlertTriangle, AlertCircle, Info, Package, DollarSign, TrendingUp, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [res, dRes] = await Promise.all([
        axios.get(`${API}/alerts`),
        axios.get(`${API}/alerts/dismissed`)
      ]);
      setAlerts(res.data);
      setDismissed(dRes.data);
    } catch (_e) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only module-level imports (API, axios, toast) and stable state setters used
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  if (loading) return <div className="h-96 bg-zinc-900 rounded-xl animate-pulse" />;

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));
  const criticalAlerts = visibleAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = visibleAlerts.filter(a => a.severity === 'warning');
  const infoAlerts = visibleAlerts.filter(a => a.severity === 'info');

  const dismissAlert = async (id) => {
    if (!window.confirm("Dismiss this alert?")) return;
    try {
      await axios.post(`${API}/alerts/${id}/dismiss`);
      setDismissed(prev => [...prev, id]);
      toast.success("Alert dismissed");
    } catch (_e) { toast.error("Failed to dismiss"); }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'stock': return <Package className="w-5 h-5" />;
      case 'cash': return <DollarSign className="w-5 h-5" />;
      case 'cogs': return <TrendingUp className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical': return { card: 'border-red-500/40 bg-red-500/5', icon: 'text-red-500', badge: 'bg-red-500/10 text-red-500' };
      case 'warning': return { card: 'border-amber-500/40 bg-amber-500/5', icon: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-500' };
      default: return { card: 'border-blue-500/40 bg-blue-500/5', icon: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-500' };
    }
  };

  return (
    <div className="space-y-6" data-testid="alerts-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-zinc-50">Alerts & Notifications</h1>
          <p className="text-zinc-400 mt-2">Stock, cash, and COGS alerts across your business</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAlerts} className="border-zinc-700 hover:bg-zinc-800" data-testid="refresh-alerts-btn">
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <p className="text-xs text-zinc-500 uppercase">Critical</p>
            <p className="text-2xl font-bold font-heading text-red-500">{criticalAlerts.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 border-amber-500/30">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <p className="text-xs text-zinc-500 uppercase">Warnings</p>
            <p className="text-2xl font-bold font-heading text-amber-500">{warningAlerts.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Info className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-zinc-500 uppercase">Info</p>
            <p className="text-2xl font-bold font-heading text-blue-500">{infoAlerts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      {visibleAlerts.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center text-zinc-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">All clear! No active alerts.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleAlerts.map(alert => {
            const style = getSeverityStyle(alert.severity);
            const linkTo = alert.type === 'stock' ? '/inventory' : alert.type === 'cash' ? '/cash' : '/products';
            return (
              <div key={alert.id} className={`bg-zinc-900 border ${style.card} rounded-lg transition-all duration-200 hover:-translate-y-0.5`}>
                <Link to={linkTo} data-testid={`alert-link-${alert.id}`}>
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${style.badge}`}>
                        {getIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-zinc-200">{alert.title}</p>
                          <Badge className={style.badge}>{alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}</Badge>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">{alert.message}</p>
                        <p className="text-xs text-orange-500 mt-1">Click to {alert.type === 'stock' ? 'restock' : alert.type === 'cash' ? 'reconcile' : 'adjust pricing'}</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="flex justify-end px-4 pb-2">
                  <Button size="sm" variant="ghost" onClick={() => dismissAlert(alert.id)} className="text-zinc-500 hover:text-red-500 text-xs" data-testid={`dismiss-alert-${alert.id}`}>
                    <Trash2 className="w-3 h-3 mr-1" /> Dismiss
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
