// Central API client — proxies to Spring Boot on :8080
import axios from "axios";

const API_BASE = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("uam_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/* ── Auth ── */
export const authApi = {
  login:   (data) => api.post("/auth/login", data),
  logout:  ()     => api.post("/auth/logout"),
  me:      ()     => api.get("/auth/me"),
  register:(data) => api.post("/auth/register", data),
};

/* ── Users ── */
export const usersApi = {
  getAll:     ()           => api.get("/users"),
  getById:    (id)         => api.get(`/users/${id}`),
  create:     (data)       => api.post("/users", data),
  update:     (id, data)   => api.put(`/users/${id}`, data),
  delete:     (id)         => api.delete(`/users/${id}`),
  assignRole: (uid, rid)   => api.post(`/users/${uid}/roles/${rid}`),
};

/* ── Roles ── */
export const rolesApi = {
  getAll:  ()          => api.get("/roles"),
  getById: (id)        => api.get(`/roles/${id}`),
  create:  (data)      => api.post("/roles", data),
  update:  (id, data)  => api.put(`/roles/${id}`, data),
  delete:  (id)        => api.delete(`/roles/${id}`),
};

/* ── Permissions ── */
export const permissionsApi = {
  getAll: () => api.get("/permissions"),
};

/* ── Audit Logs ── */
export const auditApi = {
  getLogs: (params) => api.get("/audit", { params }),
  exportCsv: (params) => api.get("/audit/export", {
    params: { ...params, format: "csv" },
    responseType: "blob",
  }),
  exportPdf: (params) => api.get("/audit/export", {
    params: { ...params, format: "pdf" },
    responseType: "blob",
  }),
};

/* ── Security Events ── */
export const securityApi = {
  getEvents: () => api.get("/security/events"),
};

/* ── Dashboard ── */
export const dashboardApi = {
  getStats:          () => api.get("/dashboard/stats"),
  getRecentActivity: () => api.get("/dashboard/recent-activity"),
};

export default api;
