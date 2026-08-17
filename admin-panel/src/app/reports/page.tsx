"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Flag, Search, Trash2, MoreVertical, X, Eye, Check, Ban,
  Mail, AtSign, Hash, Calendar, FileText, UserX, ShieldAlert, Clock,
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

type ReportStatus = "pending" | "resolved" | "dismissed";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  resolved: "bg-emerald-50 text-emerald-600",
  dismissed: "bg-slate-100 text-slate-500",
};

function UserBlock({ user, fallback }: { user: any; fallback?: string }) {
  if (!user) return <span className="text-sm text-slate-400">{fallback || "Unknown"}</span>;
  return (
    <div className="flex items-center gap-3">
      {user.avatar_url ? (
        <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
          {user.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-slate-950 text-sm truncate">{user.name || "—"}</p>
        <p className="text-xs text-slate-400 truncate">{user.email || (user.username ? `@${user.username}` : "—")}</p>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm text-slate-700 mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

/* ─── Report moderation drawer ─── */
function ReportDrawer({ report, onClose, onStatus, onDeleteReport, onRemoveUser, busy }: {
  report: any;
  onClose: () => void;
  onStatus: (id: string, status: ReportStatus) => void;
  onDeleteReport: (id: string) => void;
  onRemoveUser: (userId: string, name: string) => void;
  busy: boolean;
}) {
  const { dangerMode } = useAdminAuth();
  const reported = report.reported;
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-950">Report Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Status + reason */}
          <div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyles[report.status] || statusStyles.pending}`}>
              {report.status || "pending"}
            </span>
            <div className="mt-3 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3">
              <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <ShieldAlert size={13} /> Reason
              </p>
              <p className="text-sm font-semibold text-rose-700">{report.subject || "—"}</p>
            </div>
          </div>

          {/* Reported user */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Reported User</p>
            <UserBlock user={reported} fallback="User deleted" />
            {reported && (
              <div className="mt-4 space-y-3">
                <DetailRow icon={<Mail size={15} />} label="Email" value={reported.email || "—"} />
                <DetailRow icon={<AtSign size={15} />} label="Username" value={reported.username ? `@${reported.username}` : "—"} />
                <DetailRow icon={<Hash size={15} />} label="User ID" value={reported.id} />
              </div>
            )}
          </div>

          {/* Reporter */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Reported By</p>
            <UserBlock user={report.reporter} fallback="Anonymous" />
          </div>

          {/* Description + date */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            {report.description && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <FileText size={13} /> Details
                </p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{report.description}</p>
              </div>
            )}
            <DetailRow
              icon={<Calendar size={15} />}
              label="Reported On"
              value={report.createdAt ? new Date(report.createdAt).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => onStatus(report.id, "resolved")}
              disabled={busy || report.status === "resolved" || !dangerMode}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${
                dangerMode
                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              title={!dangerMode ? "Enable Danger Mode to resolve report" : ""}
            >
              <Check size={15} /> Resolve
            </button>
            <button
              onClick={() => onStatus(report.id, "dismissed")}
              disabled={busy || report.status === "dismissed" || !dangerMode}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${
                dangerMode
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              title={!dangerMode ? "Enable Danger Mode to dismiss report" : ""}
            >
              <Ban size={15} /> Dismiss
            </button>
          </div>
          {reported && (
            <button
              onClick={() => onRemoveUser(reported.id, reported.name)}
              disabled={busy || !dangerMode}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                dangerMode
                  ? "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              title={!dangerMode ? "Enable Danger Mode to remove user" : ""}
            >
              <UserX size={15} /> Remove Reported User
            </button>
          )}
          <button
            onClick={() => onDeleteReport(report.id)}
            disabled={busy || !dangerMode}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              dangerMode
                ? "text-rose-500 hover:bg-rose-50 disabled:opacity-60"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
            title={!dangerMode ? "Enable Danger Mode to delete report" : ""}
          >
            <Trash2 size={15} /> Delete Report
          </button>
        </div>
      </div>
    </>
  );
}

export default function ReportsPage() {
  const { dangerMode } = useAdminAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchReports = async () => {
    try {
      const data = await adminApi.get<any[]>("/admin/reports");
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatus = async (id: string, status: ReportStatus) => {
    setBusyId(id);
    try {
      await adminApi.patch(`/admin/reports/${id}/status`, { status });
      setReports(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
      setSelected((r: any) => (r && r.id === id ? { ...r, status } : r));
    } catch {
      alert("Failed to update report status.");
    } finally {
      setBusyId(null);
      setMenuOpenId(null);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await adminApi.delete(`/admin/reports/${id}`);
      setReports(prev => prev.filter(r => r.id !== id));
      setSelected((r: any) => (r && r.id === id ? null : r));
    } catch {
      alert("Failed to delete report.");
    } finally {
      setBusyId(null);
      setMenuOpenId(null);
    }
  };

  const handleRemoveUser = async (userId: string, name: string) => {
    if (!confirm(`Remove user "${name}"? This deletes their account and cannot be undone.`)) return;
    setBusyId(userId);
    try {
      await adminApi.delete(`/admin/users/${userId}`);
      // Auto-resolve every report against this user and clear the reference.
      setReports(prev => prev.map(r => (r.reportedId === userId ? { ...r, status: "resolved", reported: null } : r)));
      setSelected((r: any) => (r ? { ...r, status: "resolved", reported: null } : r));
    } catch {
      alert("Failed to remove user.");
    } finally {
      setBusyId(null);
      setMenuOpenId(null);
    }
  };

  const filtered = useMemo(() => {
    return reports.filter(r => {
      const term = search.toLowerCase();
      const matchSearch = !search
        || r.subject?.toLowerCase().includes(term)
        || r.reported?.name?.toLowerCase().includes(term)
        || r.reported?.email?.toLowerCase().includes(term)
        || r.reported?.username?.toLowerCase().includes(term)
        || r.reporter?.name?.toLowerCase().includes(term);
      const matchStatus = statusFilter === "all" || (r.status || "pending") === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reports, search, statusFilter]);

  const count = (s: string) => reports.filter(r => (r.status || "pending") === s).length;
  const stats = [
    { label: "Total Reports", value: reports.length, icon: Flag, color: "bg-primary-50 text-primary-900" },
    { label: "Pending", value: count("pending"), icon: Clock, color: "bg-amber-50 text-amber-700" },
    { label: "Resolved", value: count("resolved"), icon: Check, color: "bg-emerald-50 text-emerald-700" },
    { label: "Dismissed", value: count("dismissed"), icon: Ban, color: "bg-slate-100 text-slate-600" },
  ];

  return (
    <div className="space-y-8" onClick={() => setMenuOpenId(null)}>
      {selected && (
        <ReportDrawer
          report={selected}
          onClose={() => setSelected(null)}
          onStatus={handleStatus}
          onDeleteReport={handleDeleteReport}
          onRemoveUser={handleRemoveUser}
          busy={busyId !== null}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-950">Reports & Moderation</h1>
        <p className="text-slate-500 mt-1">Review user reports of accounts and content, and take moderation action.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-card border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className="text-2xl font-bold text-slate-950 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">All Reports</h3>
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search by user, reason or reporter..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-input focus:outline-none focus:ring-2 focus:ring-primary-900/20"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-1">
              {["all", "pending", "resolved", "dismissed"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                    statusFilter === s ? "bg-primary-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading reports...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">No reports found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Reported User</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Reported By</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4"><UserBlock user={r.reported} fallback="User deleted" /></td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700 font-medium">{r.subject || "—"}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[160px]">
                      {r.reporter?.name || "Anonymous"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[r.status] || statusStyles.pending}`}>
                        {r.status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === r.id ? null : r.id)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={17} />
                        </button>
                        {menuOpenId === r.id && (
                          <div className="absolute right-0 top-9 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-10 overflow-hidden">
                            <button
                              onClick={() => { setSelected(r); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Eye size={15} /> Review
                            </button>
                             <button
                              onClick={() => handleStatus(r.id, "resolved")}
                              disabled={busyId === r.id || r.status === "resolved" || !dangerMode}
                              className={`w-full flex items-center gap-2 px-4 py-3 text-sm border-t border-slate-100 disabled:opacity-50 transition-colors ${
                                dangerMode ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 cursor-not-allowed bg-slate-50/50"
                              }`}
                              title={!dangerMode ? "Enable Danger Mode to resolve report" : ""}
                            >
                              <Check size={15} /> Resolve
                            </button>
                            <button
                              onClick={() => handleStatus(r.id, "dismissed")}
                              disabled={busyId === r.id || r.status === "dismissed" || !dangerMode}
                              className={`w-full flex items-center gap-2 px-4 py-3 text-sm disabled:opacity-50 transition-colors ${
                                dangerMode ? "text-slate-600 hover:bg-slate-50" : "text-slate-400 cursor-not-allowed bg-slate-50/50"
                              }`}
                              title={!dangerMode ? "Enable Danger Mode to dismiss report" : ""}
                            >
                              <Ban size={15} /> Dismiss
                            </button>
                            <button
                              onClick={() => handleDeleteReport(r.id)}
                              disabled={busyId === r.id || !dangerMode}
                              className={`w-full flex items-center gap-2 px-4 py-3 text-sm border-t border-slate-100 transition-colors ${
                                dangerMode ? "text-rose-600 hover:bg-rose-50" : "text-slate-400 cursor-not-allowed bg-slate-50/50"
                              }`}
                              title={!dangerMode ? "Enable Danger Mode to delete report" : ""}
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            Showing {filtered.length} of {reports.length} reports
          </div>
        )}
      </div>
    </div>
  );
}
