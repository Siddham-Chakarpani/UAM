// Shared utility helpers
import { format, formatDistanceToNow } from "date-fns";

export const fmtDate = (d) =>
  d ? format(new Date(d), "MMM d, yyyy HH:mm") : "—";

export const fmtRelative = (d) =>
  d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : "Never";

export const initials = (first, last) =>
  `${(first?.[0] || "").toUpperCase()}${(last?.[0] || "").toUpperCase()}`;

export const EVENT_COLORS = {
  LOGIN:             "success",
  LOGOUT:            "muted",
  REGISTER:          "cyber",
  USER_CREATED:      "success",
  USER_UPDATED:      "info",
  USER_DELETED:      "danger",
  USER_SUSPENDED:    "warning",
  ROLE_CREATED:      "purple",
  ROLE_UPDATED:      "info",
  ROLE_DELETED:      "danger",
  ROLE_ASSIGNED:     "cyber",
  ROLE_REMOVED:      "warning",
  PERMISSION_CHANGED:"warning",
  PASSWORD_CHANGED:  "info",
  FAILED_LOGIN:      "danger",
  ACCOUNT_LOCKED:    "danger",
  DATA_EXPORTED:     "muted",
  ACCESS_DENIED:     "danger",
};

export const STATUS_COLOR = {
  SUCCESS: "success",
  FAILURE: "danger",
  WARNING: "warning",
};

export const USER_STATUS_COLOR = {
  ACTIVE:    "success",
  INACTIVE:  "muted",
  SUSPENDED: "warning",
  LOCKED:    "danger",
};

export const EVENT_ICONS = {
  LOGIN:              "🔑",
  LOGOUT:             "🚪",
  FAILED_LOGIN:       "⛔",
  USER_CREATED:       "👤",
  USER_UPDATED:       "✏️",
  USER_DELETED:       "🗑️",
  USER_SUSPENDED:     "⏸️",
  ROLE_CREATED:       "🏷️",
  ROLE_UPDATED:       "🔧",
  ROLE_DELETED:       "🗑️",
  ROLE_ASSIGNED:      "🔗",
  PERMISSION_CHANGED: "🔐",
  PASSWORD_CHANGED:   "🔒",
  ACCOUNT_LOCKED:     "🔒",
  DATA_EXPORTED:      "📊",
  ACCESS_DENIED:      "🚫",
};

export const ROLE_COLORS = {
  SUPER_ADMIN:  "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400",
  USER_MANAGER: "from-cyber-500/20 to-cyber-600/10 border-cyber-500/30 text-cyber-400",
  AUDITOR:      "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
  READ_ONLY:    "from-dark-700/60 to-dark-800/40 border-dark-600/40 text-dark-400",
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href    = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
