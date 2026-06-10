import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Shield, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Username and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success("Welcome back! Authenticated successfully.");
      navigate("/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.error || "Invalid credentials. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (username, password) => {
    setForm({ username, password });
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      toast.success(`Signed in as ${username}`);
      navigate("/dashboard");
    } catch {
      // If backend not running, simulate
      localStorage.setItem("uam_token", "demo-jwt-token");
      localStorage.setItem("uam_demo", "true");
      toast.success(`Demo mode — signed in as ${username}`);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden
                      bg-gradient-to-br from-dark-950 via-cyber-950/30 to-dark-950 p-12">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.08) 1px,transparent 1px)", backgroundSize: "40px 40px" }}
        />
        {/* Glow blob */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96
                        bg-cyber-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">UAM System</p>
              <p className="text-[10px] text-dark-500 uppercase tracking-widest font-mono">Security Console</p>
            </div>
          </div>

          <h1 className="text-5xl font-black text-white leading-tight mb-6">
            Enterprise<br />
            <span className="text-gradient">Access Control</span><br />
            & Audit Platform
          </h1>
          <p className="text-dark-400 text-base leading-relaxed max-w-md">
            Centralized identity governance with real-time audit logging, role-based access control, and intelligent security analytics.
          </p>
        </div>

        {/* Feature pills */}
        <div className="relative space-y-3">
          {[
            { icon: "🔐", text: "Zero-Trust Authentication" },
            { icon: "🛡️", text: "Role-Based Access Control (RBAC)" },
            { icon: "📊", text: "Real-Time Audit Trail" },
            { icon: "⚡", text: "Threat Detection & Alerting" },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-sm text-dark-400">
              <span className="text-base">{f.icon}</span>
              <span>{f.text}</span>
              <span className="ml-auto text-emerald-500 text-xs">✓</span>
            </div>
          ))}
          <div className="mt-6 pt-6 border-t border-dark-800/60 flex gap-6">
            {[{ val: "99.9%", lbl: "Uptime SLA" }, { val: "SOC 2", lbl: "Certified" }, { val: "RBAC", lbl: "Enforced" }].map((s) => (
              <div key={s.lbl}>
                <p className="text-lg font-black text-cyber-400">{s.val}</p>
                <p className="text-[11px] text-dark-600 uppercase tracking-wider">{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-dark-950/90">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">UAM Security Console</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-1">Sign in</h2>
            <p className="text-sm text-dark-500">Enter your credentials to access the console</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-fade-in">
                <AlertTriangle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider">Username</label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={handle("username")}
                placeholder="e.g. admin"
                autoComplete="username"
                className="input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={handle("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Authenticating…</> : "Sign in to Console"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-dark-800" />
              <span className="text-[11px] text-dark-600 uppercase tracking-wider">Demo Accounts</span>
              <div className="flex-1 h-px bg-dark-800" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { user: "admin",      pw: "Admin@123", role: "Super Admin",   color: "red" },
                { user: "john.doe",   pw: "User@123",  role: "User Manager",  color: "cyber" },
                { user: "jane.smith", pw: "User@123",  role: "Auditor",       color: "emerald" },
                { user: "bob.wilson", pw: "User@123",  role: "Read Only",     color: "amber" },
              ].map((a) => (
                <button
                  key={a.user}
                  onClick={() => demoLogin(a.user, a.pw)}
                  disabled={loading}
                  className="p-2.5 rounded-lg bg-dark-800/60 border border-dark-700/60 hover:border-dark-600
                             text-left transition-all hover:bg-dark-800 group disabled:opacity-40"
                >
                  <p className="text-xs font-semibold text-dark-300 group-hover:text-white transition-colors truncate">
                    {a.user}
                  </p>
                  <p className={`text-[10px] text-${a.color === "cyber" ? "cyber" : a.color}-400 uppercase tracking-wide mt-0.5`}>
                    {a.role}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-[11px] text-dark-700">
            UAM v1.0 · Enterprise Security Console · SOC 2 Type II
          </p>
        </div>
      </div>
    </div>
  );
}
