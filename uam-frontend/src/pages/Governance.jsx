import { useState, useEffect, useCallback } from "react";
import { governanceApi } from "../api/governance";
import toast from "react-hot-toast";
import { Doughnut, Bar } from "react-chartjs-2";


// ── Utility helpers ────────────────────────────────────────────────────────
const riskColor = (level) => ({
  CRITICAL: "text-red-400",
  HIGH:     "text-orange-400",
  MEDIUM:   "text-yellow-400",
  LOW:      "text-emerald-400",
}[level] || "text-slate-400");

const riskBg = (level) => ({
  CRITICAL: "bg-red-500/15 border-red-500/30",
  HIGH:     "bg-orange-500/15 border-orange-500/30",
  MEDIUM:   "bg-yellow-500/15 border-yellow-500/30",
  LOW:      "bg-emerald-500/15 border-emerald-500/30",
}[level] || "bg-slate-500/15 border-slate-500/30");

const sodSevBg = (sev) => ({
  CRITICAL: "bg-red-500/20 text-red-300 border border-red-500/40",
  HIGH:     "bg-orange-500/20 text-orange-300 border border-orange-500/40",
  MEDIUM:   "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
  LOW:      "bg-sky-500/20 text-sky-300 border border-sky-500/40",
}[sev] || "bg-slate-500/20 text-slate-300");

const complianceBg = (s) => ({
  COMPLIANT:     "text-emerald-400",
  PARTIAL:       "text-yellow-400",
  NON_COMPLIANT: "text-red-400",
}[s] || "text-slate-400");

const findingIcon = (r) => ({ PASS: "✅", WARN: "⚠️", FAIL: "❌" }[r] || "ℹ️");

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })
  : "Never";

const fmtDays = (d) => d < 0 ? "Never logged in" : `${d} days ago`;

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE:    "bg-emerald-500/20 text-emerald-400",
    INACTIVE:  "bg-slate-500/20 text-slate-400",
    SUSPENDED: "bg-orange-500/20 text-orange-400",
    LOCKED:    "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[status] || "bg-slate-700 text-slate-300"}`}>
      {status}
    </span>
  );
};

const ReviewBadge = ({ status }) => {
  const map = {
    PENDING:    "bg-yellow-500/20 text-yellow-300",
    CERTIFIED:  "bg-emerald-500/20 text-emerald-300",
    REVOKED:    "bg-red-500/20 text-red-300",
    ESCALATED:  "bg-purple-500/20 text-purple-300",
    EXPIRED:    "bg-slate-500/20 text-slate-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[status] || "bg-slate-700 text-slate-300"}`}>
      {status}
    </span>
  );
};

// ── Sub-panels ─────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color = "from-indigo-600 to-purple-600" }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-700/50 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

// ── Panel: Risk Scores ─────────────────────────────────────────────────────
function RiskScoresPanel() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await governanceApi.getAllRiskScores();
      setScores(res.data || []);
    } catch { toast.error("Failed to load risk scores"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const recalc = async () => {
    const t = toast.loading("Recalculating…");
    try {
      const res = await governanceApi.recalculateRisk();
      toast.success(`Scored ${res.data.usersScored} users`, { id: t });
      load();
    } catch { toast.error("Recalculation failed", { id: t }); }
  };

  const dist = {
    CRITICAL: scores.filter(s => s.level === "CRITICAL").length,
    HIGH:     scores.filter(s => s.level === "HIGH").length,
    MEDIUM:   scores.filter(s => s.level === "MEDIUM").length,
    LOW:      scores.filter(s => s.level === "LOW").length,
  };

  const donutData = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [{
      data: [dist.CRITICAL, dist.HIGH, dist.MEDIUM, dist.LOW],
      backgroundColor: ["#ef4444","#f97316","#eab308","#10b981"],
      borderWidth: 0,
    }]
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Risk Scores — All Users</h3>
        <button onClick={recalc}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
          ↻ Recalculate
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Doughnut */}
        <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 flex flex-col items-center">
          <p className="text-sm text-slate-400 mb-3">Risk Distribution</p>
          <div className="w-44 h-44">
            <Doughnut data={donutData} options={{ plugins: { legend: { position: "bottom", labels: { color:"#94a3b8", font:{size:11} } } }, cutout:"65%" }} />
          </div>
        </div>
        {/* KPIs */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{dist.CRITICAL}</p>
            <p className="text-xs text-slate-400 mt-1">Critical Risk</p>
          </div>
          <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-4 text-center">
            <p className="text-3xl font-bold text-orange-400">{dist.HIGH}</p>
            <p className="text-xs text-slate-400 mt-1">High Risk</p>
          </div>
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{dist.MEDIUM}</p>
            <p className="text-xs text-slate-400 mt-1">Medium Risk</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{dist.LOW}</p>
            <p className="text-xs text-slate-400 mt-1">Low Risk</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80">
            <tr className="text-left text-slate-400 text-xs uppercase">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Priv</th>
              <th className="px-4 py-3">Dormancy</th>
              <th className="px-4 py-3">Failed Logins</th>
              <th className="px-4 py-3">SoD</th>
              <th className="px-4 py-3">Risk Factors</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">Loading…</td></tr>
            ) : scores.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">No data — click Recalculate</td></tr>
            ) : scores.sort((a, b) => b.score - a.score).map((s) => (
              <tr key={s.id} className="border-t border-slate-700/40 hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{s.user?.username ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${s.score >= 70 ? "bg-red-500" : s.score >= 45 ? "bg-orange-500" : s.score >= 20 ? "bg-yellow-500" : "bg-emerald-500"}`}
                        style={{ width: `${s.score}%` }} />
                    </div>
                    <span className="text-white font-bold text-xs">{s.score}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.level === "CRITICAL" ? "bg-red-500/20 text-red-400" : s.level === "HIGH" ? "bg-orange-500/20 text-orange-400" : s.level === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                    {s.level}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300 text-xs">{s.privilegedRoleScore}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{s.dormancyScore}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{s.failedLoginScore}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{s.sodConflictScore}</td>
                <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">{s.riskFactors || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Panel: SoD Violations ──────────────────────────────────────────────────
function SodPanel() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await governanceApi.getOpenSodViolations();
      setViolations(res.data || []);
    } catch { toast.error("Failed to load SoD violations"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const accept = async (id) => {
    const justification = window.prompt("Enter business justification for this exception:");
    if (!justification) return;
    const t = toast.loading("Saving exception…");
    try {
      await governanceApi.acceptViolation(id, { justification });
      toast.success("Exception recorded", { id: t });
      load();
    } catch { toast.error("Failed to save exception", { id: t }); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Segregation of Duties Violations</h3>
          <p className="text-xs text-slate-400 mt-0.5">Users holding conflicting role or permission combinations</p>
        </div>
        <span className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm font-bold">
          {violations.length} Open
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Scanning for violations…</div>
      ) : violations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-emerald-400 font-semibold">No open SoD violations detected</p>
          <p className="text-slate-500 text-sm mt-1">All users comply with segregation of duties policies</p>
        </div>
      ) : (
        <div className="space-y-3">
          {violations.map((v) => (
            <div key={v.id} className={`rounded-xl border p-4 ${riskBg(v.severity)}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${sodSevBg(v.severity)}`}>
                      {v.severity}
                    </span>
                    <span className="text-white font-semibold text-sm">{v.ruleName}</span>
                  </div>
                  <p className="text-slate-300 text-xs mb-2">{v.description}</p>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>👤 <strong className="text-white">{v.user?.username}</strong></span>
                    <span>⚔️ <code className="text-orange-300">{v.conflictA}</code> + <code className="text-orange-300">{v.conflictB}</code></span>
                    <span>📅 {fmtDate(v.detectedAt)}</span>
                  </div>
                </div>
                <button onClick={() => accept(v.id)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors">
                  Accept Exception
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Panel: Dormant Accounts ────────────────────────────────────────────────
function DormantPanel() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceApi.getDormantAccounts()
      .then(r => setAccounts(r.data || []))
      .catch(() => toast.error("Failed to load dormant accounts"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Dormant Account Detection</h3>
          <p className="text-xs text-slate-400 mt-0.5">Active accounts with no login activity in 90+ days</p>
        </div>
        <span className="px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-bold">
          {accounts.length} Dormant
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80">
            <tr className="text-left text-slate-400 text-xs uppercase">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3">Dormant</th>
              <th className="px-4 py-3">Risk</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading…</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-emerald-500">✅ No dormant accounts</td></tr>
            ) : accounts.map((a) => (
              <tr key={a.id} className="border-t border-slate-700/40 hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{a.username}</div>
                  <div className="text-xs text-slate-400">{a.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-300">{a.department}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(a.roles || []).map(r => (
                      <span key={r} className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">{r}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300 text-xs">{fmtDate(a.lastLoginAt)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${a.daysDormant >= 180 ? "text-red-400" : a.daysDormant >= 90 ? "text-orange-400" : "text-yellow-400"}`}>
                    {fmtDays(a.daysDormant)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold ${riskColor(a.riskLevel)}`}>{a.riskLevel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Panel: Privileged Users ────────────────────────────────────────────────
function PrivilegedPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceApi.getPrivilegedUsers()
      .then(r => setUsers(r.data || []))
      .catch(() => toast.error("Failed to load privileged users"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Privileged User Monitoring</h3>
          <p className="text-xs text-slate-400 mt-0.5">Users with ADMIN or MANAGER roles — continuously monitored</p>
        </div>
        <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-bold">
          {users.length} Privileged
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-500">Loading…</div>
        ) : users.map((u) => {
          const risk = u.riskScore || {};
          return (
            <div key={u.id} className={`rounded-xl border p-4 ${riskBg(risk.level)}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{u.username}</p>
                  <p className="text-xs text-slate-400">{u.department}</p>
                </div>
                <StatusBadge status={u.status} />
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {(u.roles || []).map(r => (
                  <span key={r} className={`px-2 py-0.5 rounded text-xs font-bold ${r === "ADMIN" ? "bg-red-500/30 text-red-300" : "bg-orange-500/30 text-orange-300"}`}>
                    {r}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-800/60 p-2">
                  <p className={`font-bold text-lg ${riskColor(risk.level)}`}>{risk.score ?? "—"}</p>
                  <p className="text-slate-500">Risk Score</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2">
                  <p className="font-bold text-lg text-white">{u.roleCount}</p>
                  <p className="text-slate-500">Roles</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2">
                  <p className={`font-bold text-lg ${u.sodViolations > 0 ? "text-red-400" : "text-emerald-400"}`}>{u.sodViolations}</p>
                  <p className="text-slate-500">SoD Issues</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Last login: {fmtDate(u.lastLoginAt)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel: Access Reviews ──────────────────────────────────────────────────
function ReviewsPanel() {
  const [campaigns, setCampaigns] = useState([]);
  const [quarter, setQuarter] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    governanceApi.getCampaigns().then(r => {
      const c = r.data || [];
      setCampaigns(c);
      if (c.length > 0) { setQuarter(c[0]); }
    });
  }, []);

  useEffect(() => {
    if (!quarter) return;
    setLoading(true);
    governanceApi.getAccessReviews(quarter)
      .then(r => setReviews(r.data || []))
      .finally(() => setLoading(false));
  }, [quarter]);

  const launch = async () => {
    const now = new Date();
    const q = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    const confirmed = window.confirm(`Launch quarterly review campaign: ${q}?`);
    if (!confirmed) return;
    setLaunching(true);
    const t = toast.loading("Launching campaign…");
    try {
      const res = await governanceApi.launchCampaign(q);
      toast.success(`${res.data.reviewsCreated} reviews created for ${q}`, { id: t });
      setCampaigns(prev => [q, ...prev.filter(c => c !== q)]);
      setQuarter(q);
    } catch (e) {
      toast.error(e.response?.data?.error || "Launch failed", { id: t });
    } finally { setLaunching(false); }
  };

  const action = async (id, type) => {
    const comments = window.prompt(`Enter ${type === "certify" ? "certification" : "revocation"} notes:`);
    if (comments === null) return;
    const t = toast.loading(type === "certify" ? "Certifying…" : "Revoking…");
    try {
      if (type === "certify") await governanceApi.certifyReview(id, comments);
      else await governanceApi.revokeReview(id, comments);
      toast.success(type === "certify" ? "Access certified ✅" : "Access revoked ⚠️", { id: t });
      governanceApi.getAccessReviews(quarter).then(r => setReviews(r.data || []));
    } catch { toast.error("Action failed", { id: t }); }
  };

  const stats = {
    PENDING:   reviews.filter(r => r.status === "PENDING").length,
    CERTIFIED: reviews.filter(r => r.status === "CERTIFIED").length,
    REVOKED:   reviews.filter(r => r.status === "REVOKED").length,
  };

  const pct = reviews.length > 0 ? Math.round((stats.CERTIFIED / reviews.length) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Quarterly Access Review</h3>
          <p className="text-xs text-slate-400 mt-0.5">Certify or revoke user access for compliance attestation</p>
        </div>
        <div className="flex gap-3">
          <select value={quarter} onChange={e => setQuarter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
            {campaigns.length === 0 && <option value="">No campaigns</option>}
            {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={launch} disabled={launching}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
            {launching ? "Launching…" : "＋ New Campaign"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {reviews.length > 0 && (
        <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Certification Progress — <strong className="text-white">{quarter}</strong></span>
            <span className="text-white font-bold">{pct}% Complete</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
            <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
              style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-6 text-xs">
            <span className="text-yellow-400">⏳ {stats.PENDING} Pending</span>
            <span className="text-emerald-400">✅ {stats.CERTIFIED} Certified</span>
            <span className="text-red-400">❌ {stats.REVOKED} Revoked</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80">
            <tr className="text-left text-slate-400 text-xs uppercase">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reviewed</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading reviews…</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">No reviews — launch a campaign first</td></tr>
            ) : reviews.map((r) => (
              <tr key={r.id} className="border-t border-slate-700/40 hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{r.user?.username}</p>
                  <p className="text-xs text-slate-400">{r.user?.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-300 text-xs">{r.rolesSnapshot || "—"}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(r.dueDate)}</td>
                <td className="px-4 py-3"><ReviewBadge status={r.status} /></td>
                <td className="px-4 py-3 text-slate-400 text-xs">{r.reviewedAt ? fmtDate(r.reviewedAt) : "—"}</td>
                <td className="px-4 py-3">
                  {r.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button onClick={() => action(r.id, "certify")}
                        className="px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-medium transition-colors">
                        Certify
                      </button>
                      <button onClick={() => action(r.id, "revoke")}
                        className="px-2 py-1 rounded bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs font-medium transition-colors">
                        Revoke
                      </button>
                    </div>
                  )}
                  {r.status !== "PENDING" && (
                    <span className="text-xs text-slate-500 italic">{r.comments || "No comment"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Panel: Compliance Dashboard ────────────────────────────────────────────
function CompliancePanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceApi.getComplianceDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error("Failed to load compliance data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-slate-500">Loading compliance data…</div>;
  if (!data)  return <div className="text-center py-16 text-red-400">Failed to load compliance data</div>;

  const riskDist = data.riskDistribution || {};
  const barData = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [{
      label: "Users",
      data: [riskDist.CRITICAL || 0, riskDist.HIGH || 0, riskDist.MEDIUM || 0, riskDist.LOW || 0],
      backgroundColor: ["#ef4444","#f97316","#eab308","#10b981"],
      borderRadius: 6,
    }]
  };

  const score = data.overallComplianceScore ?? 0;
  const scoreColor = score >= 85 ? "text-emerald-400" : score >= 65 ? "text-yellow-400" : "text-red-400";
  const scoreRing  = score >= 85 ? "stroke-emerald-500" : score >= 65 ? "stroke-yellow-500" : "stroke-red-500";
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-6">Compliance Dashboard</h3>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard icon="👥" label="Total Users"      value={data.totalUsers}        color="from-indigo-600 to-purple-600" />
        <KpiCard icon="😴" label="Dormant Accounts" value={data.dormantAccounts}   color="from-orange-600 to-red-600" />
        <KpiCard icon="⚔️" label="SoD Violations"   value={data.openSodViolations} color="from-red-600 to-pink-600" />
        <KpiCard icon="🔐" label="Privileged Users"  value={data.privilegedUsers}   color="from-purple-600 to-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Compliance Score Ring */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-700/50 p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-slate-400 mb-4">Overall Compliance Score</p>
          <svg width="130" height="130" className="-rotate-90">
            <circle cx="65" cy="65" r="54" fill="none" stroke="#1e293b" strokeWidth="10" />
            <circle cx="65" cy="65" r="54" fill="none" strokeWidth="10"
              className={scoreRing}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div className="-mt-20 text-center">
            <p className={`text-4xl font-black ${scoreColor}`}>{score}%</p>
            <p className={`text-sm font-bold mt-1 ${complianceBg(data.complianceStatus)}`}>
              {data.complianceStatus?.replace("_", " ")}
            </p>
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">Certification Rate</p>
            <p className="text-xl font-bold text-white">{data.certificationRate ?? 0}%</p>
            <p className="text-xs text-slate-500">{data.latestCampaign || "No campaigns"}</p>
          </div>
        </div>

        {/* Risk Distribution Bar */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-700/50 p-6">
          <p className="text-sm text-slate-400 mb-4">Risk Distribution</p>
          <Bar data={barData} options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: "#64748b" }, grid: { color: "#1e293b" } },
              y: { ticks: { color: "#64748b", stepSize: 1 }, grid: { color: "#1e293b" } }
            }
          }} height={180} />
        </div>

        {/* Access Violations */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-700/50 p-6">
          <p className="text-sm text-slate-400 mb-4">Recent Access Violations (30d)</p>
          <div className="text-center py-6">
            <p className="text-5xl font-black text-red-400">{data.recentAccessViolations}</p>
            <p className="text-sm text-slate-500 mt-2">Denied / Suspicious Events</p>
          </div>
          <div className="border-t border-slate-700/50 pt-4 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between"><span>Certified</span><span className="text-emerald-400">{Math.round((data.certificationRate || 0) * (data.totalUsers || 0) / 100)} users</span></div>
            <div className="flex justify-between"><span>Pending</span><span className="text-yellow-400">{data.totalUsers - Math.round((data.certificationRate || 0) * (data.totalUsers || 0) / 100)} users</span></div>
          </div>
        </div>
      </div>

      {/* Audit Findings */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-700/50 p-6">
        <h4 className="text-sm font-semibold text-white mb-4">📋 Audit Findings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data.auditFindings || []).map((f) => (
            <div key={f.id} className={`rounded-xl border p-4 ${f.result === "PASS" ? "border-emerald-500/30 bg-emerald-500/5" : f.result === "WARN" ? "border-yellow-500/30 bg-yellow-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{findingIcon(f.result)}</span>
                <span className="font-semibold text-white text-sm">{f.title}</span>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded ${f.result === "PASS" ? "bg-emerald-500/20 text-emerald-400" : f.result === "WARN" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                  {f.result}
                </span>
              </div>
              <p className="text-xs text-slate-400">{f.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Governance Page ───────────────────────────────────────────────────
const TABS = [
  { id: "compliance",  label: "Compliance",        icon: "🛡️" },
  { id: "risk",        label: "Risk Scores",        icon: "⚠️" },
  { id: "sod",         label: "SoD Violations",     icon: "⚔️" },
  { id: "dormant",     label: "Dormant Accounts",   icon: "😴" },
  { id: "privileged",  label: "Privileged Users",   icon: "👑" },
  { id: "reviews",     label: "Access Reviews",     icon: "📋" },
];

export default function Governance() {
  const [tab, setTab]         = useState("compliance");
  const [alerts, setAlerts]   = useState([]);
  const [alertBanner, setAlertBanner] = useState(true);

  useEffect(() => {
    governanceApi.getRiskAlerts()
      .then(r => setAlerts(r.data || []))
      .catch(() => {});
  }, []);

  const criticalAlerts = alerts.filter(a => a.severity === "CRITICAL");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Governance & Risk Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Access reviews · SoD detection · Risk scoring · Compliance reporting
          </p>
        </div>
        <div className="flex items-center gap-2">
          {criticalAlerts.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-bold animate-pulse">
              🚨 {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {alertBanner && alerts.length > 0 && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-red-400 font-semibold text-sm mb-2">
                🚨 {alerts.length} Active Risk Alert{alerts.length > 1 ? "s" : ""} Require Attention
              </p>
              <div className="space-y-1">
                {alerts.slice(0, 3).map((a, i) => (
                  <p key={i} className="text-xs text-slate-300">
                    <span className={`font-bold mr-2 ${a.severity === "CRITICAL" ? "text-red-400" : a.severity === "HIGH" ? "text-orange-400" : "text-yellow-400"}`}>
                      [{a.severity}]
                    </span>
                    {a.message}
                  </p>
                ))}
                {alerts.length > 3 && <p className="text-xs text-slate-500">+{alerts.length - 3} more alerts…</p>}
              </div>
            </div>
            <button onClick={() => setAlertBanner(false)} className="text-slate-500 hover:text-slate-300 text-lg">✕</button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-900/50 rounded-xl p-1 border border-slate-700/50 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${tab === t.id
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6">
        {tab === "compliance"  && <CompliancePanel />}
        {tab === "risk"        && <RiskScoresPanel />}
        {tab === "sod"         && <SodPanel />}
        {tab === "dormant"     && <DormantPanel />}
        {tab === "privileged"  && <PrivilegedPanel />}
        {tab === "reviews"     && <ReviewsPanel />}
      </div>
    </div>
  );
}
