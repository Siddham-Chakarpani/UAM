import { useEffect, useState, useMemo } from "react";
import { usersApi, rolesApi } from "../api/client";
import { MOCK_USERS, MOCK_ROLES } from "../data/mockData";
import {
  Badge, Modal, ConfirmDialog, FormField, FilterBar,
  SearchInput, FilterSelect, TableSkeleton, EmptyState, Pagination,
} from "../components/UI";
import { fmtDate, fmtRelative, initials, USER_STATUS_COLOR, ROLE_COLORS } from "../utils/helpers";
import toast from "react-hot-toast";
import { UserPlus, Pencil, Trash2, Shield, RefreshCw } from "lucide-react";

const EMPTY_FORM = {
  username: "", email: "", password: "", firstName: "", lastName: "",
  department: "", status: "ACTIVE", roleIds: [],
};

export default function Users() {
  const [users, setUsers]           = useState([]);
  const [roles, setRoles]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [roleFilter, setRole]       = useState("");
  const [page, setPage]             = useState(0);
  const PAGE_SIZE                   = 8;

  const [modalOpen, setModalOpen]   = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const [deleteId, setDeleteId]     = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([usersApi.getAll(), rolesApi.getAll()]);
      setUsers(u.data);
      setRoles(r.data);
    } catch {
      setUsers(MOCK_USERS);
      setRoles(MOCK_ROLES);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q || [u.username, u.email, u.firstName, u.lastName, u.department]
        .some((f) => f?.toLowerCase().includes(q));
      const matchStatus = !statusFilter || u.status === statusFilter;
      const matchRole   = !roleFilter   || u.roles?.includes(roleFilter);
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => { setEditUser(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit   = (u)  => {
    setEditUser(u);
    setForm({
      username: u.username, email: u.email, password: "", firstName: u.firstName,
      lastName: u.lastName, department: u.department, status: u.status, roleIds: [],
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.username || !form.email) {
      toast.error("Username and email are required."); return;
    }
    setSaving(true);
    try {
      if (editUser) {
        const res = await usersApi.update(editUser.id, form);
        setUsers((u) => u.map((x) => x.id === editUser.id ? res.data : x));
        toast.success("User updated successfully");
      } else {
        if (!form.password) { toast.error("Password required."); setSaving(false); return; }
        const res = await usersApi.create(form);
        setUsers((u) => [...u, res.data]);
        toast.success("User created successfully");
      }
      setModalOpen(false);
    } catch (err) {
      // Demo fallback
      if (editUser) {
        const updated = { ...editUser, ...form, roles: editUser.roles };
        setUsers((u) => u.map((x) => x.id === editUser.id ? updated : x));
        toast.success("User updated (demo mode)");
      } else {
        const newUser = { ...form, id: Date.now(), roles: [], createdAt: new Date().toISOString() };
        setUsers((u) => [...u, newUser]);
        toast.success("User created (demo mode)");
      }
      setModalOpen(false);
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await usersApi.delete(deleteId);
    } catch {}
    setUsers((u) => u.filter((x) => x.id !== deleteId));
    toast.success("User deleted");
    setDeleteId(null); setDeleting(false);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center text-base">👥</div>
          <div>
            <h2 className="text-base font-bold text-white">Users <span className="text-dark-500 font-normal text-sm ml-1">({filtered.length})</span></h2>
            <p className="text-xs text-dark-500">Manage identities, roles and account status</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost btn-sm btn-icon"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
          <button onClick={openCreate} className="btn-primary btn-sm"><UserPlus size={14} />New User</button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
        <FilterSelect value={statusFilter} onChange={setStatus}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="LOCKED">Locked</option>
        </FilterSelect>
        <FilterSelect value={roleFilter} onChange={setRole}>
          <option value="">All Roles</option>
          {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
        </FilterSelect>
      </FilterBar>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        <div className="table-container rounded-xl">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Department</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={6} cols={7} />
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="👤" title="No users found" desc="Adjust your filters or create a new user" action={<button onClick={openCreate} className="btn-primary btn-sm mx-auto mt-2"><UserPlus size={13} />New User</button>} /></td></tr>
              ) : paginated.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-500/70 to-purple-600/70 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                        {initials(u.firstName, u.lastName)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark-100">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-dark-500 font-mono">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-dark-400 font-mono">{u.email}</td>
                  <td className="text-xs text-dark-400">{u.department}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.length > 0
                        ? u.roles.map((r) => (
                            <span key={r} className={`badge badge-cyber text-[10px] bg-gradient-to-r ${ROLE_COLORS[r] || "from-dark-700/60 to-dark-800/40 border-dark-600/40 text-dark-400"}`}>
                              {r.replace(/_/g, " ")}
                            </span>
                          ))
                        : <span className="text-xs text-dark-600">No roles</span>
                      }
                    </div>
                  </td>
                  <td><Badge variant={USER_STATUS_COLOR[u.status] || "muted"}>{u.status}</Badge></td>
                  <td className="text-xs text-dark-500">{fmtRelative(u.lastLoginAt)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(u)} className="btn-ghost btn-sm btn-icon" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(u.id)} className="btn-danger btn-sm btn-icon" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > PAGE_SIZE && (
          <Pagination
            page={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
            total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editUser ? "Edit User" : "Create New User"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? "Saving…" : (editUser ? "Save Changes" : "Create User")}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
          </FormField>
          <FormField label="Last Name" required>
            <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" />
          </FormField>
          <FormField label="Username" required>
            <input className="input font-mono" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="john.doe" disabled={!!editUser} />
          </FormField>
          <FormField label="Email" required>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
          </FormField>
          {!editUser && (
            <FormField label="Password" required>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </FormField>
          )}
          <FormField label="Department">
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="IT Operations" />
          </FormField>
          <FormField label="Status">
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="LOCKED">Locked</option>
            </select>
          </FormField>
          <FormField label="Assign Roles">
            <select className="input" multiple size={4} value={form.roleIds.map(String)}
              onChange={(e) => setForm({ ...form, roleIds: Array.from(e.target.selectedOptions, (o) => parseInt(o.value)) })}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </FormField>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete User?"
        message="This will permanently delete the user and revoke all access. This action cannot be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        danger
      />
    </div>
  );
}
