// Reusable UI primitives

// ── Badge ──
export function Badge({ variant = "muted", children, className = "" }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}

// ── Modal ──
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-xl w-full animate-slide-up">
        <div className="modal-header">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Confirm Dialog ──
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Delete", danger = true }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-dark-900 border border-dark-700/80 rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-500/10" : "bg-cyber-500/10"}`}>
            <span className="text-2xl">{danger ? "⚠️" : "❓"}</span>
          </div>
          <h3 className="text-base font-bold text-center text-white mb-2">{title}</h3>
          <p className="text-sm text-dark-400 text-center">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 justify-center btn ${danger ? "btn-danger hover:!bg-red-500 hover:!text-white" : "btn-primary"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── FormField ──
export function FormField({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Skeleton rows ──
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-dark-800/60">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 py-3.5">
          <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  ));
}

// ── Empty State ──
export function EmptyState({ icon = "📭", title = "No data found", desc = "", action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4 opacity-30">{icon}</div>
      <h3 className="text-sm font-semibold text-dark-400 mb-1">{title}</h3>
      {desc && <p className="text-xs text-dark-600 mb-4">{desc}</p>}
      {action}
    </div>
  );
}

// ── Stat Card ──
export function StatCard({ label, value, icon, trend, trendLabel, accent = "cyber", loading }) {
  const accents = {
    cyber:   "from-cyber-500/20   via-cyber-600/5   to-transparent border-cyber-500/30   text-cyber-400",
    emerald: "from-emerald-500/20 via-emerald-600/5 to-transparent border-emerald-500/30 text-emerald-400",
    amber:   "from-amber-500/20   via-amber-600/5   to-transparent border-amber-500/30   text-amber-400",
    red:     "from-red-500/20     via-red-600/5     to-transparent border-red-500/30     text-red-400",
    purple:  "from-purple-500/20  via-purple-600/5  to-transparent border-purple-500/30  text-purple-400",
    sky:     "from-sky-500/20     via-sky-600/5     to-transparent border-sky-500/30     text-sky-400",
  };

  return (
    <div className={`stat-card bg-gradient-to-br ${accents[accent]} transition-all duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`text-2xl ${accents[accent].split(" ").slice(-1)[0]}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {loading ? (
        <>
          <div className="skeleton h-8 w-20 mb-1 rounded" />
          <div className="skeleton h-4 w-28 rounded" />
        </>
      ) : (
        <>
          <p className="text-3xl font-black text-white tabular-nums">{value ?? "—"}</p>
          <p className="text-xs font-medium text-dark-400 mt-0.5">{label}</p>
          {trendLabel && <p className="text-[11px] text-dark-600 mt-1">{trendLabel}</p>}
        </>
      )}
    </div>
  );
}

// ── Pagination ──
export function Pagination({ page, totalPages, total, pageSize, onPageChange }) {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700/60">
      <p className="text-xs text-dark-500">
        Showing <span className="text-dark-300 font-semibold">{start}–{end}</span> of{" "}
        <span className="text-dark-300 font-semibold">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-dark-400 hover:text-white
                     hover:bg-dark-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors
              ${i === page ? "bg-cyber-600 text-white" : "text-dark-400 hover:text-white hover:bg-dark-700"}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-dark-400 hover:text-white
                     hover:bg-dark-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Search + Filter bar ──
export function FilterBar({ children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 text-sm">🔍</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-search w-full"
      />
    </div>
  );
}

export function FilterSelect({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input py-2 text-sm min-w-[130px] max-w-[200px] ${className}`}
    >
      {children}
    </select>
  );
}
