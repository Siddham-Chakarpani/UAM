import { useEffect, useState, useMemo } from "react";
import { permissionsApi } from "../api/client";
import { MOCK_PERMISSIONS } from "../data/mockData";
import { SearchInput, FilterSelect, FilterBar, TableSkeleton, EmptyState } from "../components/UI";
import { RefreshCw } from "lucide-react";

const ACTION_COLORS = {
  read:   "bg-sky-500/15 text-sky-400 ring-sky-500/20",
  create: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
  update: "bg-amber-500/15 text-amber-400 ring-amber-500/20",
  delete: "bg-red-500/15 text-red-400 ring-red-500/20",
  manage: "bg-purple-500/15 text-purple-400 ring-purple-500/20",
  export: "bg-cyber-500/15 text-cyber-400 ring-cyber-500/20",
};

const RESOURCE_ICONS = {
  users:       "👤",
  roles:       "🛡️",
  audit:       "📋",
  reports:     "📊",
  permissions: "🔐",
};

export default function Permissions() {
  const [perms, setPerms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [resource, setResource] = useState("");
  const [action, setAction]     = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await permissionsApi.getAll();
      setPerms(res.data);
    } catch {
      setPerms(MOCK_PERMISSIONS);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return perms.filter((p) => {
      const matchQ = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      const matchR = !resource || p.resource === resource;
      const matchA = !action   || p.action === action;
      return matchQ && matchR && matchA;
    });
  }, [perms, search, resource, action]);

  const grouped = filtered.reduce((acc, p) => {
    const r = p.resource || "other";
    if (!acc[r]) acc[r] = [];
    acc[r].push(p);
    return acc;
  }, {});

  const resources = [...new Set(perms.map((p) => p.resource).filter(Boolean))];
  const actions   = [...new Set(perms.map((p) => p.action).filter(Boolean))];

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center text-base">🔐</div>
          <div>
            <h2 className="text-base font-bold text-white">Permissions <span className="text-dark-500 font-normal text-sm ml-1">({filtered.length})</span></h2>
            <p className="text-xs text-dark-500">System-wide permission definitions and access controls</p>
          </div>
        </div>
        <button onClick={load} className="btn-ghost btn-sm btn-icon"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search permissions…" />
        <FilterSelect value={resource} onChange={setResource}>
          <option value="">All Resources</option>
          {resources.map((r) => <option key={r} value={r}>{r}</option>)}
        </FilterSelect>
        <FilterSelect value={action} onChange={setAction}>
          <option value="">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </FilterSelect>
      </FilterBar>

      {/* Stats strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Total", value: perms.length, color: "text-white" },
          { label: "Read",   value: perms.filter((p) => p.action === "read").length,   color: "text-sky-400" },
          { label: "Create", value: perms.filter((p) => p.action === "create").length, color: "text-emerald-400" },
          { label: "Update", value: perms.filter((p) => p.action === "update").length, color: "text-amber-400" },
          { label: "Delete", value: perms.filter((p) => p.action === "delete").length, color: "text-red-400" },
          { label: "Manage", value: perms.filter((p) => !["read","create","update","delete"].includes(p.action)).length, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="card !p-3 text-center">
            <p className={`text-xl font-black ${s.color}`}>{loading ? "—" : s.value}</p>
            <p className="text-[11px] text-dark-500 uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grouped by resource */}
      {loading ? (
        <div className="card !p-0 overflow-hidden">
          <table className="data-table"><thead><tr><th>Name</th><th>Resource</th><th>Action</th><th>Description</th></tr></thead>
          <tbody><TableSkeleton rows={8} cols={4} /></tbody></table>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔐" title="No permissions match" desc="Try adjusting your search or filters" />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([res, pList]) => (
            <div key={res} className="card !p-0 overflow-hidden">
              {/* Resource header */}
              <div className="flex items-center gap-3 px-5 py-3 bg-dark-800/40 border-b border-dark-700/60">
                <span className="text-base">{RESOURCE_ICONS[res] || "🔑"}</span>
                <h3 className="text-sm font-bold text-white capitalize">{res}</h3>
                <span className="text-xs text-dark-500 ml-auto">{pList.length} permission{pList.length !== 1 ? "s" : ""}</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Permission Name</th>
                    <th>Action</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {pList.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="font-mono text-xs bg-dark-800/60 border border-dark-700/50 px-2.5 py-1 rounded-md text-dark-200">
                          {p.name}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ring-1 ${ACTION_COLORS[p.action] || "bg-dark-700/60 text-dark-400"}`}>
                          {p.action}
                        </span>
                      </td>
                      <td className="text-xs text-dark-400">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
