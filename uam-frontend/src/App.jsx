import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import AuditLogs from "./pages/AuditLogs";
import SecurityReports from "./pages/SecurityReports";
import Governance from "./pages/Governance";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center mx-auto animate-pulse-slow">
            <span className="text-2xl">🛡️</span>
          </div>
          <p className="text-dark-400 text-sm">Authenticating…</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/users"           element={<Users />} />
        <Route path="/roles"           element={<Roles />} />
        <Route path="/permissions"     element={<Permissions />} />
        <Route path="/audit-logs"       element={<AuditLogs />} />
        <Route path="/security-reports" element={<SecurityReports />} />
        <Route path="/governance"        element={<Governance />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1e293b",
              color: "#e2e8f0",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "10px",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
            },
            success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
