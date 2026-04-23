import { useState } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Flame, LogIn, UserPlus } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_kitchen-analytics-4/artifacts/rahsf0cf_Vector%20No%20Background.png";

const LoginPage = ({ onLogin }) => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("staff");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email: loginEmail, password: loginPassword }, { withCredentials: true });
      toast.success(`Welcome back, ${data.name}!`);
      onLogin(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) { toast.error("Fill all fields"); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/register`, { email: regEmail, password: regPassword, name: regName, role: regRole }, { withCredentials: true });
      toast.success(`Welcome, ${data.name}!`);
      onLogin(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <img src={LOGO_URL} alt="Grill Shack" className="h-24 w-auto mx-auto" />
          <CardTitle className="text-xl font-heading text-zinc-50">Management Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="w-full bg-zinc-800">
              <TabsTrigger value="login" className="flex-1" data-testid="login-tab">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="flex-1" data-testid="register-tab">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Email</Label>
                  <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="owner@grillshack.nz" data-testid="login-email" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Password</Label>
                  <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Password" data-testid="login-password" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600" data-testid="login-submit">
                  <LogIn className="w-4 h-4 mr-2" /> {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Name</Label>
                  <Input value={regName} onChange={e => setRegName(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Your name" data-testid="register-name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Email</Label>
                  <Input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="staff@grillshack.nz" data-testid="register-email" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Password</Label>
                  <Input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Min 6 characters" data-testid="register-password" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Role</Label>
                  <Select value={regRole} onValueChange={setRegRole}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="register-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="staff">User</SelectItem>
                      <SelectItem value="owner">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600" data-testid="register-submit">
                  <UserPlus className="w-4 h-4 mr-2" /> {loading ? "Creating..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
