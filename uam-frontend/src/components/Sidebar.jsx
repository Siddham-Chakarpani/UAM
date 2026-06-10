import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { initials } from "../utils/helpers";
import {
  LayoutDashboard, Users, Shield, Key, ScrollText,
  BarChart3, LogOut, ChevronRight, Activity, ShieldAlert, TrendingUp
} from "lucide-react";

const NAV = [
  {
    label: "Main",
    items: [
      { to: "/dashboard",  label: "Dashboard",        icon: LayoutDashboard },
      { to: "/users",      label: "Users",            icon: Users },
      { to: "/roles",      label: "Roles",            icon: Shield },
      { to: "/permissions",label: "Permissions",      icon: Key },
    ],
  },
  {
    label: "Security",
    items: [
      { to: "/audit-logs",      label: "Audit Logs",      icon: ScrollText },
      { to: "/security-reports",label: "Security Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Governance",
    items: [
      { to: "/governance", label: "Risk & Compliance", icon: ShieldAlert, badge: "GRC" },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-50 flex flex-col
          bg-dark-950/95 border-r border-dark-800/80 backdrop-blur-xl
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-800/60">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
              <Shield size={18} className="text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-dark-950" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">UAM System</p>
            <p className="text-[10px] text-dark-500 uppercase tracking-widest font-mono">Security Console</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-dark-600 uppercase tracking-widest">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    <span>{label}</span>
                    {badge && (
                      <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/30 text-indigo-300">{badge}</span>
                    )}
                    {!badge && location.pathname === to && (
                      <ChevronRight size={14} className="ml-auto text-cyber-400 opacity-70" />
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* System Status */}
        <div className="mx-3 mb-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
          <div className="flex items-center gap-2 mb-1">
            <span className="pulse-dot green" />
            <span className="text-xs font-semibold text-emerald-400">System Operational</span>
          </div>
          <p className="text-[11px] text-dark-500">All services running normally</p>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-dark-800/60">
          <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-800/60 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user ? initials(user.firstName || user.fullName?.split(" ")[0], user.lastName || user.fullName?.split(" ")[1]) : "??"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-dark-200 truncate">
                {user?.fullName || user?.username || "User"}
              </p>
              <p className="text-[11px] text-dark-500 truncate">
                {user?.roles?.[0] || "—"}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-all"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
