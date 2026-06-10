import { useEffect, useState } from "react";
import { rolesApi, permissionsApi } from "../api/client";
import { MOCK_ROLES, MOCK_PERMISSIONS } from "../data/mockData";
import { Badge, Modal, ConfirmDialog, FormField, EmptyState } from "../components/UI";
import { ROLE_COLORS } from "../utils/helpers";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, RefreshCw, Shield, Check } from "lucide-react";

const EMPTY_FORM = { name: "", description: "", permissionIds: [] };

export default function Roles() {
  const [roles, setRoles]         = useState([]);
  const [perms, setPerms]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRole, setEditRole]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([rolesApi.getAll(), permissionsApi.getAll()]);
      setRoles(r.data);
      setPerms(p.data);
    } catch {
      setRoles(MOCK_ROLES);
      setPerms(MOCK_PERMISSIONS);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditRole(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit   = (r)  => {
    setEditRole(r);
    setForm({ name: r.name, description: r.description, permissionIds: r.permissions?.map((p) => p.id) || [] });
    setModalOpen(true);
  };

  const togglePerm = (id) => {
    setForm((f) => ({
      ...f,
      permissionIds: f.permissionIds.includes(id)
        ? f.permissionIds.filter((p) => p !== id)
        : [...f.permissionIds, id],
    }));
  };

  const save = async () => {
    if (!form.name) { toast.error("Role name is required"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, permissionIds: form.permissionIds };
      if (editRole) {
        const res = await rolesApi.update(editRole.id, payload);
        setRoles((r) => r.map((x) => x.id === editRole.id ? res.data : x));
        toast.success("Role updated");
      } else {
        const res = await rolesApi.create(payload);
        setRoles((r) => [...r, res.data]);
        toast.success("Role created");
      }
      setModalOpen(false);
    } catch {
      // Demo fallback
      const permObjs = perms.filter((p) => form.permissionIds.includes(p.id));
      if (editRole) {
        setRoles((r) => r.map((x) => x.id === editRole.id ? { ...x, ...form, permissions: permObjs } : x));
        toast.success("Role updated (demo mode)");
      } else {
        setRoles((r) => [...r, { ...form, id: Date.now(), permissions: permObjs, active: true, createdAt: new Date().toISOString() }]);
        toast.success("Role created (demo mode)");
      }
      setModalOpen(false);
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try { await rolesApi.delete(deleteId); } catch {}
    setRoles((r) => r.filter((x) => x.id !== deleteId));
    toast.success("Role deleted");
    setDeleteId(null);
  };

  // Group permissions by resource
  const permsByResource = perms.reduce((acc, p) => {
    const r = p.resource || "other";
    if (!acc[r]) acc[r] = [];
    acc[r].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center text-base">🛡️</div>
          <div>
            <h2 className="text-base font-bold text-white">Role Management <span className="text-dark-500 font-normal text-sm ml-1">({roles.length})</span></h2>
            <p className="text-xs text-dark-500">Define roles and assign permission sets</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost btn-sm btn-icon"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
          <button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14} />New Role</button>
        </div>
      </div>

      {/* Role Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card !p-5 space-y-3">
              <div className="skeleton h-5 w-32 rounded" />
              <div className="skeleton h-4 w-48 rounded" />
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 4 }).map((_, j) => <div key={j} className="skeleton h-5 w-20 rounded-full" />)}
              </div>
            </div>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <EmptyState icon="🛡️" title="No roles defined" action={<button onClick={openCreate} className="btn-primary btn-sm mt-2"><Plus size={13} />Create Role</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div key={role.id} className={`card card-hover !p-0 overflow-hidden bg-gradient-to-br ${ROLE_COLORS[role.name] || "from-dark-800/60 to-dark-900/80 border-dark-700/60"}`}>
              <div className="p-5 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-dark-900/60 border border-dark-700/50 flex items-center justify-center">
                      <Shield size={16} className="text-dark-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{role.name.replace(/_/g, " ")}</h3>
                      <p className="text-xs text-dark-400">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(role)} className="btn-ghost btn-sm btn-icon"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteId(role.id)} className="btn-danger btn-sm btn-icon"><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Permission chips */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {role.permissions?.slice(0, 8).map((p) => (
                    <span key={p.name || p.id} className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-dark-900/60 border border-dark-700/50 text-dark-400">
                      {p.name}
                    </span>
                  ))}
                  {(role.permissions?.length || 0) > 8 && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-dark-900/60 border border-dark-700/50 text-dark-500">
                      +{role.permissions.length - 8} more
                    </span>
                  )}
                  {(!role.permissions || role.permissions.length === 0) && (
                    <span className="text-xs text-dark-600 italic">No permissions assigned</span>
                  )}
                </div>
              </div>
              <div className="px-5 py-2.5 bg-dark-900/40 border-t border-dark-800/50 flex items-center justify-between">
                <span className="text-[11px] text-dark-600">{role.permissions?.length || 0} permissions</span>
                <Badge variant={role.active ? "success" : "muted"}>{role.active ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRole ? "Edit Role" : "Create Role"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? "Saving…" : (editRole ? "Save Changes" : "Create Role")}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <FormField label="Role Name" required>
            <input className="input font-mono uppercase" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase().replace(/ /g, "_") })}
              placeholder="e.g. SECURITY_AUDITOR" />
          </FormField>
          <FormField label="Description">
            <input className="input" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What this role can do…" />
          </FormField>

          <div>
            <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">
              Permissions <span className="text-cyber-400 ml-1">({form.permissionIds.length} selected)</span>
            </label>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {Object.entries(permsByResource).map(([resource, permList]) => (
                <div key={resource}>
                  <p className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-2 font-mono">{resource}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {permList.map((p) => {
                      const checked = form.permissionIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePerm(p.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all
                            ${checked
                              ? "bg-cyber-500/15 border border-cyber-500/40 text-cyber-300"
                              : "bg-dark-800/60 border border-dark-700/50 text-dark-400 hover:border-dark-600"
                            }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all
                            ${checked ? "bg-cyber-500 border-cyber-500" : "border-dark-600"}`}>
                            {checked && <Check size={10} className="text-white" />}
                          </div>
                          <span className="font-mono truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Role?"
        message="Deleting this role will remove it from all users. Users will lose associated permissions."
        danger
      />
    </div>
  );
}
