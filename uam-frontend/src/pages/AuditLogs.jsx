import { useEffect, useState, useMemo } from "react";
import { auditApi } from "../api/client";
import { MOCK_AUDIT_LOGS } from "../data/mockData";
import {
  Badge, FilterBar, SearchInput, FilterSelect,
  TableSkeleton, EmptyState, Pagination,
} from "../components/UI";
import { fmtDate, fmtRelative, EVENT_COLORS, STATUS_COLOR, EVENT_ICONS, downloadBlob } from "../utils/helpers";
import toast from "react-hot-toast";
import { Download, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";

const EVENT_TYPES = [
  "LOGIN","LOGOUT","REGISTER",
  "USER_CREATED","USER_UPDATED","USER_DELETED","USER_SUSPENDED",
  "ROLE_CREATED","ROLE_UPDATED","ROLE_DELETED","ROLE_ASSIGNED",
  "PERMISSION_CHANGED","PASSWORD_CHANGED","FAILED_LOGIN","ACCOUNT_LOCKED",
  "DATA_EXPORTED","ACCESS_DENIED",
];

const PAGE_SIZE = 15;

export default function AuditLogs() {
  const [logs, setLogs]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);

  const [search, setSearch]         = useState("");
  const [eventType, setEventType]   = useState("");
  const [status, setStatus]         = useState("");
  const [startDate, setStartDate]   = useState("");
  const [endDate, setEndDate]       = useState("");

  const [exporting, setExporting]   = useState(false);

  const load = async (pg = 0) => {
    setLoading(true);
    try {
      const params = {
        page: pg, size: PAGE_SIZE,
        ...(search    && { username: search }),
        ...(eventType && { eventType }),
        ...(status    && { status }),
        ...(startDate && { startDate: new Date(startDate).toISOString() }),
        ...(endDate   && { endDate: new Date(endDate).toISOString() }),
      };
      const res = await auditApi.getLogs(params);
      setLogs(res.data.content);
      setTotal(res.data.totalElements);
      setTotalPages(res.data.totalPages);
    } catch {
      // Demo fallback
      let filtered = [...MOCK_AUDIT_LOGS];
      if (search)    filtered = filtered.filter((l) => l.username?.includes(search) || l.description?.toLowerCase().includes(search));
      if (eventType) filtered = filtered.filter((l) => l.eventType === eventType);
      if (status)    filtered = filtered.filter((l) => l.status === status);
      const start = pg * PAGE_SIZE;
      setLogs(filtered.slice(start, start + PAGE_SIZE));
      setTotal(filtered.length);
      setTotalPages(Math.ceil(filtered.length / PAGE_SIZE));
    } finally { setLoading(false); }
  };

  useEffect(() => { setPage(0); load(0); }, [search, eventType, status, startDate, endDate]);

  const handlePageChange = (p) => { setPage(p); load(p); };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = { ...(eventType && { eventType }), ...(status && { status }) };
      const res = await auditApi.exportCsv(params);
      downloadBlob(res.data, "audit-logs.csv");
      toast.success("CSV exported successfully");
    } catch {
      // Demo CSV
      const header = "ID,Event Type,Username,IP Address,Description,Status,Timestamp\n";
      const rows = MOCK_AUDIT_LOGS.map((l) =>
        `${l.id},${l.eventType},${l.username},${l.ipAddress},"${l.description}",${l.status},${l.timestamp}`
      ).join("\n");
      downloadBlob(new Blob([header + rows], { type: "text/csv" }), "audit-logs.csv");
      toast.success("CSV exported (demo mode)");
    } finally { setExporting(false); }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const params = { ...(eventType && { eventType }), ...(status && { status }) };
      const res = await auditApi.exportPdf(params);
      downloadBlob(res.data, "audit-logs.pdf");
      toast.success("PDF exported successfully");
    } catch {
      toast.error("PDF export requires backend connection");
    } finally { setExporting(false); }
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center text-base">📋</div>
          <div>
            <h2 className="text-base font-bold text-white">Audit Logs <span className="text-dark-500 font-normal text-sm ml-1">({total})</span></h2>
            <p className="text-xs text-dark-500">Complete trail of all system access and security events</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => load(page)} className="btn-ghost btn-sm btn-icon" disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={exportCsv} disabled={exporting} className="btn-secondary btn-sm">
            <FileSpreadsheet size={14} />
            {exporting ? "…" : "CSV"}
          </button>
          <button onClick={exportPdf} disabled={exporting} className="btn-secondary btn-sm">
            <FileText size={14} />
            {exporting ? "…" : "PDF"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by username, description…" />
        <FilterSelect value={eventType} onChange={setEventType}>
          <option value="">All Events</option>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </FilterSelect>
        <FilterSelect value={status} onChange={setStatus}>
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
          <option value="WARNING">Warning</option>
        </FilterSelect>
        <input type="datetime-local" className="input text-xs py-2 max-w-[175px]"
          value={startDate} onChange={(e) => setStartDate(e.target.value)} title="Start Date" />
        <input type="datetime-local" className="input text-xs py-2 max-w-[175px]"
          value={endDate}   onChange={(e) => setEndDate(e.target.value)}   title="End Date" />
        {(search || eventType || status || startDate || endDate) && (
          <button onClick={() => { setSearch(""); setEventType(""); setStatus(""); setStartDate(""); setEndDate(""); }}
            className="btn-ghost btn-sm text-red-400 hover:text-red-300">
            ✕ Clear
          </button>
        )}
      </FilterBar>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="table-container rounded-xl">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>ID</th>
                <th>Event</th>
                <th>User</th>
                <th>IP Address</th>
                <th>Description</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={8} cols={7} />
              ) : logs.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="📋" title="No logs found" desc="Try adjusting your search filters" /></td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="group">
                  <td className="text-xs text-dark-600 font-mono">#{log.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{EVENT_ICONS[log.eventType] || "📝"}</span>
                      <Badge variant={EVENT_COLORS[log.eventType] || "muted"}>
                        {log.eventType?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyber-500/60 to-purple-600/60 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {log.username?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-xs font-mono text-dark-300">{log.username}</span>
                    </div>
                  </td>
                  <td><span className="text-xs font-mono text-dark-500">{log.ipAddress}</span></td>
                  <td className="max-w-xs">
                    <p className="text-xs text-dark-300 truncate" title={log.description}>{log.description}</p>
                  </td>
                  <td><Badge variant={STATUS_COLOR[log.status] || "muted"}>{log.status}</Badge></td>
                  <td>
                    <div>
                      <p className="text-xs text-dark-400 font-mono">{fmtDate(log.timestamp)}</p>
                      <p className="text-[11px] text-dark-600">{fmtRelative(log.timestamp)}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > PAGE_SIZE && (
          <Pagination
            page={page} totalPages={totalPages} total={total}
            pageSize={PAGE_SIZE} onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
