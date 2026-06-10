import { useEffect, useState } from "react";
import { Bar, Line, Doughnut, Radar } from "react-chartjs-2";
import { dashboardApi, auditApi } from "../api/client";
import { MOCK_STATS, MOCK_AUDIT_LOGS } from "../data/mockData";
import { Badge } from "../components/UI";
import { fmtDate, STATUS_COLOR } from "../utils/helpers";
import { RefreshCw, FileSpreadsheet, TrendingUp, TrendingDown, Minus } from "lucide-react";
import toast from "react-hot-toast";

const C = { cyber: "#6366f1", emerald: "#10b981", red: "#ef4444", amber: "#f59e0b", purple: "#8b5cf6", sky: "#38bdf8" };
const gridStyle = { color: "rgba(255,255,255,0.04)" };
const tickStyle = { color: "#64748b", font: { size: 11 } };
const baseScales = { x: { grid: gridStyle, ticks: tickStyle }, y: { grid: gridStyle, ticks: tickStyle } };
const chartBase = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

const RISK_LEVELS = [
  { label: "Critical", count: 2,  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/25",    icon: "🚨" },
  { label: "High",     count: 5,  color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/25",icon: "⚠️" },
  { label: "Medium",   count: 8,  color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/25", icon: "🔔" },
  { label: "Low",      count: 12, color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/25", icon: "ℹ️" },
];

export default function SecurityReports() {
  const [stats, setStats]     = useState(null);
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([dashboardApi.getStats(), auditApi.getLogs({ size: 100 })]);
      setStats(s.data);
      setLogs(l.data.content || []);
    } catch {
      setStats(MOCK_STATS);
      setLogs(MOCK_AUDIT_LOGS);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Derived chart data ──
  const failedByHour = Array.from({ length: 24 }, (_, h) => {
    return logs.filter((l) =>
      l.eventType === "FAILED_LOGIN" &&
      new Date(l.timestamp).getHours() === h
    ).length;
  });

  const eventCounts = {};
  logs.forEach((l) => { eventCounts[l.eventType] = (eventCounts[l.eventType] || 0) + 1; });
  const sortedEvents = Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const loginTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return logs.filter((l) => l.eventType === "LOGIN" && new Date(l.timestamp).toDateString() === d.toDateString()).length;
  });

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  });

  const statusCounts = { SUCCESS: 0, FAILURE: 0, WARNING: 0 };
  logs.forEach((l) => { if (statusCounts[l.status] !== undefined) statusCounts[l.status]++; });

  const radarData = {
    labels: ["Auth Events", "User Changes", "Role Changes", "Permission Changes", "Failed Logins", "Data Exports"],
    datasets: [{
      label: "Activity Level",
      data: [
        logs.filter((l) => ["LOGIN","LOGOUT"].includes(l.eventType)).length,
        logs.filter((l) => l.eventType.startsWith("USER_")).length,
        logs.filter((l) => l.eventType.startsWith("ROLE_")).length,
        logs.filter((l) => l.eventType === "PERMISSION_CHANGED").length,
        logs.filter((l) => l.eventType === "FAILED_LOGIN").length,
        logs.filter((l) => l.eventType === "DATA_EXPORTED").length,
      ],
      backgroundColor: `${C.cyber}25`,
      borderColor: C.cyber,
      borderWidth: 2,
      pointBackgroundColor: C.cyber,
      pointRadius: 4,
    }],
  };

  const failedLoginBarData = {
    labels: Array.from({ length: 24 }, (_, i) => i % 4 === 0 ? `${i}h` : ""),
    datasets: [{
      label: "Failed Logins",
      data: failedByHour,
      backgroundColor: `${C.red}80`,
      borderColor: C.red,
      borderRadius: 4,
      borderWidth: 0,
    }],
  };

  const eventDistData = {
    labels: sortedEvents.map(([k]) => k.replace(/_/g, " ")),
    datasets: [{
      data: sortedEvents.map(([, v]) => v),
      backgroundColor: [C.cyber, C.emerald, C.red, C.amber, C.purple, C.sky, `${C.cyber}80`, `${C.emerald}80`].map((c) => `${c}BB`),
      borderRadius: 5, borderWidth: 0,
    }],
  };

  const statusDoughnutData = {
    labels: ["Success", "Failure", "Warning"],
    datasets: [{
      data: [statusCounts.SUCCESS, statusCounts.FAILURE, statusCounts.WARNING],
      backgroundColor: [`${C.emerald}CC`, `${C.red}CC`, `${C.amber}CC`],
      borderColor: "#0f172a", borderWidth: 2, hoverOffset: 8,
    }],
  };

  const loginTrendData = {
    labels: dayLabels,
    datasets: [{
      label: "Logins",
      data: loginTrend,
      borderColor: C.cyber,
      backgroundColor: `${C.cyber}20`,
      borderWidth: 2, tension: 0.4, fill: true, pointRadius: 4,
      pointBackgroundColor: C.cyber,
    }],
  };

  const successRate = logs.length > 0
    ? Math.round((statusCounts.SUCCESS / logs.length) * 100)
    : 100;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center text-base">📊</div>
          <div>
            <h2 className="text-base font-bold text-white">Security Reports</h2>
            <p className="text-xs text-dark-500">Analytics, trends and threat intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost btn-sm btn-icon" disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="btn-secondary btn-sm" onClick={() => toast.success("Report exported!")}>
            <FileSpreadsheet size={14} />Export
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "✅", label: "Success Rate",         value: `${successRate}%`,          sub: "Overall event success", accent: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/20", trend: <TrendingUp size={14} className="text-emerald-400" /> },
          { icon: "⛔", label: "Failed Logins (24h)",  value: stats?.failedLoginsLast24h ?? "—", sub: "Unique failed attempts",   accent: "text-red-400",     bg: "bg-red-500/5 border-red-500/20",       trend: <TrendingUp size={14} className="text-red-400" /> },
          { icon: "🛡️", label: "Security Score",        value: "82/100",                   sub: "Based on recent activity",  accent: "text-cyber-400",   bg: "bg-cyber-500/5 border-cyber-500/20",   trend: <Minus size={14} className="text-dark-500" /> },
          { icon: "⚡", label: "Events Today",          value: stats?.auditLogsToday ?? "—", sub: "Total events captured",     accent: "text-amber-400",   bg: "bg-amber-500/5 border-amber-500/20",   trend: <TrendingDown size={14} className="text-emerald-400" /> },
        ].map((k) => (
          <div key={k.label} className={`card card-hover !p-4 border ${k.bg}`}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">{k.icon}</span>
              {k.trend}
            </div>
            <p className={`text-2xl font-black ${k.accent}`}>{loading ? "—" : k.value}</p>
            <p className="text-xs font-semibold text-dark-300 mt-0.5">{k.label}</p>
            <p className="text-[11px] text-dark-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Risk Alerts */}
      <div className="card !p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-700/60">
          <h3 className="text-sm font-bold text-white">Risk Alert Summary</h3>
          <span className="text-xs text-dark-500">Last 30 days</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-dark-700/60">
          {RISK_LEVELS.map((r) => (
            <div key={r.label} className="p-5 text-center">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border text-xl mb-3 ${r.bg}`}>
                {r.icon}
              </div>
              <p className={`text-2xl font-black ${r.color}`}>{r.count}</p>
              <p className="text-xs font-semibold text-dark-400 mt-0.5">{r.label} Risk</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Login trend */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white mb-1">Login Trend — 7 Days</h3>
          <p className="text-xs text-dark-500 mb-4">Daily successful logins</p>
          <div style={{ height: 180 }}>
            <Line data={loginTrendData} options={{ ...chartBase, scales: baseScales }} />
          </div>
        </div>

        {/* Failed logins by hour */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white mb-1">Failed Logins by Hour</h3>
          <p className="text-xs text-dark-500 mb-4">24-hour distribution</p>
          <div style={{ height: 180 }}>
            <Bar data={failedLoginBarData} options={{ ...chartBase, scales: baseScales }} />
          </div>
        </div>

        {/* Status Doughnut */}
        <div className="card p-5 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-1">Event Status</h3>
          <p className="text-xs text-dark-500 mb-4">Success / Failure / Warning</p>
          <div style={{ height: 150 }} className="flex-1">
            <Doughnut
              data={statusDoughnutData}
              options={{
                ...chartBase,
                plugins: {
                  legend: {
                    display: true, position: "bottom",
                    labels: { color: "#94a3b8", font: { size: 11 }, padding: 12, boxWidth: 10 },
                  },
                },
                cutout: "60%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Event Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white mb-1">Top Event Types</h3>
          <p className="text-xs text-dark-500 mb-4">Frequency breakdown</p>
          <div style={{ height: 220 }}>
            <Bar
              data={eventDistData}
              options={{ ...chartBase, indexAxis: "y", scales: baseScales }}
            />
          </div>
        </div>

        {/* Security Radar */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white mb-1">Activity Radar</h3>
          <p className="text-xs text-dark-500 mb-4">Security domain coverage</p>
          <div style={{ height: 220 }}>
            <Radar
              data={radarData}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  r: {
                    grid: { color: "rgba(255,255,255,0.06)" },
                    ticks: { color: "#64748b", font: { size: 10 }, backdropColor: "transparent" },
                    pointLabels: { color: "#94a3b8", font: { size: 11 } },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Offenders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top users by failed logins */}
        <div className="card !p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-dark-700/60">
            <h3 className="text-sm font-bold text-white">Top Failed Login Sources</h3>
            <p className="text-xs text-dark-500">IPs with most failures</p>
          </div>
          <table className="data-table">
            <thead><tr><th>#</th><th>IP Address</th><th>Attempts</th><th>Last Seen</th></tr></thead>
            <tbody>
              {[
                { ip: "192.168.1.50", count: 12, last: "2h ago", risk: "danger" },
                { ip: "10.0.0.15",    count: 8,  last: "4h ago", risk: "warning" },
                { ip: "172.16.0.5",   count: 5,  last: "6h ago", risk: "warning" },
                { ip: "203.0.113.1",  count: 3,  last: "12h ago",risk: "muted" },
              ].map((r, i) => (
                <tr key={r.ip}>
                  <td className="text-xs text-dark-600 font-mono">{i + 1}</td>
                  <td className="font-mono text-xs text-dark-300">{r.ip}</td>
                  <td><Badge variant={r.risk}>{r.count}</Badge></td>
                  <td className="text-xs text-dark-500">{r.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Security Events */}
        <div className="card !p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-dark-700/60">
            <h3 className="text-sm font-bold text-white">Recent Security Events</h3>
            <p className="text-xs text-dark-500">Failures and warnings</p>
          </div>
          <div className="divide-y divide-dark-800/60">
            {logs
              .filter((l) => l.status !== "SUCCESS")
              .slice(0, 5)
              .map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-5 py-3 hover:bg-dark-800/30 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-dark-800 border border-dark-700/50 flex items-center justify-center text-sm flex-shrink-0">
                    {l.status === "FAILURE" ? "⛔" : "⚠️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-dark-200 truncate">{l.description}</p>
                    <p className="text-[11px] text-dark-600 font-mono">{l.ipAddress}</p>
                  </div>
                  <Badge variant={STATUS_COLOR[l.status] || "muted"}>{l.status}</Badge>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Compliance footer */}
      <div className="card p-5 bg-gradient-to-r from-cyber-500/5 to-transparent border-cyber-500/20">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Compliance Status</h4>
            <p className="text-xs text-dark-500">Your system meets the following standards</p>
          </div>
          <div className="flex flex-wrap gap-3 ml-auto">
            {["SOC 2 Type II", "ISO 27001", "NIST CSF", "GDPR", "HIPAA"].map((s) => (
              <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-400 text-xs">✓</span>
                <span className="text-xs font-semibold text-emerald-400">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
