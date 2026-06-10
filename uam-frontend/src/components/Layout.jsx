import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const PAGE_TITLES = {
  "/dashboard":       { title: "Security Dashboard",   desc: "Overview of your access management system" },
  "/users":           { title: "User Management",      desc: "Manage user accounts, roles and access" },
  "/roles":           { title: "Role Management",      desc: "Define roles and assign permissions" },
  "/permissions":     { title: "Permissions",          desc: "Manage system permissions and access controls" },
  "/audit-logs":      { title: "Audit Logs",           desc: "Complete trail of all system activities" },
  "/security-reports":{ title: "Security Reports",     desc: "Analytics, trends and threat insights" },
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const meta = PAGE_TITLES[location.pathname] || { title: "UAM", desc: "" };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Topbar
          title={meta.title}
          desc={meta.desc}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
