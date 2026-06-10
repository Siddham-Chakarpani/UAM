import { useState } from "react";
import { Menu, Bell, Search, Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title, desc, onMenuClick }) {
  const { logout } = useAuth();
  const [dark, setDark] = useState(true);

  const toggleTheme = () => {
    setDark(!dark);
    // UAM is always dark-themed — this is just a UI stub
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3.5 bg-dark-950/80 border-b border-dark-800/60 backdrop-blur-xl">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-white truncate">{title}</h1>
        {desc && <p className="text-xs text-dark-500 hidden sm:block">{desc}</p>}
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search size={14} className="absolute left-3 text-dark-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Quick search…"
          className="w-52 pl-8 pr-3 py-1.5 text-sm rounded-lg bg-dark-800/80 border border-dark-700/60
                     text-dark-300 placeholder:text-dark-600 focus:outline-none focus:border-cyber-500
                     focus:ring-1 focus:ring-cyber-500/30 transition-all"
        />
        <kbd className="absolute right-2 text-[10px] font-mono text-dark-600 bg-dark-700/60 px-1 py-0.5 rounded">
          ⌘K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-dark-700/60 mx-1" />

        {/* Sign out */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                     text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
