import { useEffect, useState } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { dashboardApi } from "../api/client";
import { MOCK_STATS, MOCK_AUDIT_LOGS } from "../data/mockData";
import { StatCard, Badge } from "../components/UI";
import { fmtRelative, EVENT_COLORS, STATUS_COLOR, EVENT_ICONS } from "../utils/helpers";
import { RefreshCw, Shield, Users, AlertTriangle, Activity, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

const COLORS = {
  cyber:   "#6366f1",
  emerald: "#10b981",
  red:     "#ef4444",
  amber:   "#f59e0b",
  purple:  "#8b5cf6",
};

export default function Dashboard() {
  const [stats, setStats]         = useState(null);
  const [activity, setActivity]   = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentActivity(),
      ]);
      setStats(s.data);
      setActivity(a.data);
    } catch {
      setStats(MOCK_STATS);
      setActivity(MOCK_AUDIT_LOGS.slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Chart data ──
  const activityBarData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Logins",
        data: [12, 19, 8, 15, 22, 6, 9],
        backgroundColor: `${COLORS.cyber}80`,
        borderColor: COLORS.cyber,
        borderWidth: 1.5,
        borderRadius: 5,
      },
      {
        label: "Failed",
        data: [3, 5, 2, 4, 1, 0, 2],
        backgroundColor: `${COLORS.red}80`,
        borderColor: COLORS.red,
        borderWidth: 1.5,
        borderRadius: 5,
      },
    ],
  };

  const securityLineData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: "Security Events",
        data: [2,1,0,1,2,3,5,8,12,15,10,8,14,18,12,9,11,13,10,7,5,4,3,2],
        borderColor: COLORS.cyber,
        backgroundColor: `${COLORS.cyber}15`,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Failed Logins",
        data: [0,0,1,0,0,1,2,3,2,1,0,2,3,2,1,0,1,2,1,0,0,0,1,0],
        borderColor: COLORS.red,
        backgroundColor: `${COLORS.red}10`,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const rolesDoughnutData = {
    labels: ["Super Admin", "User Manager", "Auditor", "Read Only"],
    datasets: [{
      data: [1, 2, 2, 3],
      backgroundColor: [`${COLORS.red}CC`, `${COLORS.cyber}CC`, `${COLORS.emerald}CC`, `${COLORS.amber}CC`],
      borderColor: ["#0f172a"],
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const eventTypeBarData = {
    labels: ["LOGIN", "FAILED", "USER_CREATED", "ROLE", "PERMISSION", "EXPORT"],
    datasets: [{
      data: [45, 12, 8, 15, 6, 4],
      backgroundColor: [
        `${COLORS.emerald}80`,`${COLORS.red}80`,`${COLORS.cyber}80`,
        `${COLORS.purple}80`,`${COLORS.amber}80`,`${COLORS.cyber}60`,
      ],
      borderRadius: 5,
      borderWidth: 0,
    }],
  };

  const chartStyle = {
    scales: {
      x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b", font: { size: 11 } } },
      y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b", font: { size: 11 } } },
    },
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Security Overview</h2>
          <p className="text-sm text-dark-500">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={load}
          className="btn-secondary btn-sm gap-1.5"
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard icon="👥" label="Total Users"        value={stats?.totalUsers}         accent="cyber"   loading={loading} />
        <StatCard icon="✅" label="Active Users"       value={stats?.activeUsers}        accent="emerald" loading={loading} />
        <StatCard icon="⛔" label="Failed Logins 24h"  value={stats?.failedLoginsLast24h} accent="red"     loading={loading} trend={12} />
        <StatCard icon="🚨" label="Security Events 24h"value={stats?.securityEventsLast24h} accent="amber" loading={loading} />
        <StatCard icon="📋" label="Audit Logs Today"   value={stats?.auditLogsToday}     accent="purple"  loading={loading} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Auth Activity Bar */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Authentication Activity</h3>
              <p className="text-xs text-dark-500">Last 7 days — logins vs failures</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-dark-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.cyber }} />Logins</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.red }} />Failed</span>
            </div>
          </div>
          <div style={{ height: 200 }}>
            <Bar data={activityBarData} options={{ ...CHART_DEFAULTS, ...chartStyle }} />
          </div>
        </div>

        {/* Role Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white mb-1">Role Distribution</h3>
          <p className="text-xs text-dark-500 mb-4">Users by assigned role</p>
          <div style={{ height: 160 }} className="flex items-center justify-center">
            <Doughnut
              data={rolesDoughnutData}
              options={{
                ...CHART_DEFAULTS,
                plugins: {
                  legend: {
                    display: true,
                    position: "bottom",
                    labels: { color: "#94a3b8", font: { size: 11 }, padding: 10, boxWidth: 10 },
                  },
                },
                cutout: "65%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 24h Security Timeline */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Security Events — 24h Timeline</h3>
              <p className="text-xs text-dark-500">Hourly event distribution</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-dark-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded" style={{ background: COLORS.cyber }} />Events</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded" style={{ background: COLORS.red }} />Failed</span>
            </div>
          </div>
          <div style={{ height: 180 }}>
            <Line data={securityLineData} options={{ ...CHART_DEFAULTS, ...chartStyle }} />
          </div>
        </div>

        {/* Event Types */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white mb-1">Event Breakdown</h3>
          <p className="text-xs text-dark-500 mb-4">By event type</p>
          <div style={{ height: 180 }}>
            <Bar
              data={eventTypeBarData}
              options={{
                ...CHART_DEFAULTS,
                indexAxis: "y",
                ...chartStyle,
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-dark-700/60">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Activity</h3>
            <p className="text-xs text-dark-500">Latest system events</p>
          </div>
          <a href="/audit-logs" className="text-xs text-cyber-400 hover:text-cyber-300 font-medium transition-colors">
            View all →
          </a>
        </div>
        <div className="divide-y divide-dark-800/60">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="skeleton w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3.5 rounded w-2/3" />
                    <div className="skeleton h-3 rounded w-1/3" />
                  </div>
                </div>
              ))
            : activity.map((log) => (
                <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-dark-800/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-dark-800/80 border border-dark-700/50 flex items-center justify-center text-sm flex-shrink-0">
                    {EVENT_ICONS[log.eventType] || "📝"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-200 font-medium truncate">{log.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-dark-500">{log.username}</span>
                      <span className="text-dark-700">·</span>
                      <span className="text-xs text-dark-600 font-mono">{log.ipAddress}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant={STATUS_COLOR[log.status] || "muted"}>{log.status}</Badge>
                    <span className="text-[11px] text-dark-600">{fmtRelative(log.timestamp)}</span>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Threat Summary Banner */}
      <div className="card p-5 bg-gradient-to-r from-amber-500/5 via-dark-900/80 to-dark-900/80 border-amber-500/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-400 mb-1">Security Advisory</h4>
            <p className="text-xs text-dark-400">
              <strong className="text-dark-300">{stats?.failedLoginsLast24h ?? 0} failed login attempts</strong> detected in the last 24 hours.
              {" "}Review the audit logs and consider enabling account lockout policies for affected accounts.
            </p>
          </div>
          <a href="/audit-logs" className="btn-secondary btn-sm flex-shrink-0">
            Investigate
          </a>
        </div>
      </div>
    </div>
  );
}
