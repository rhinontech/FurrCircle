"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Search, Trash2, Loader2, MapPin, AlertTriangle, Eye, X } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const STATUS_CONFIG = {
  lost:    { label: "Lost",    color: "bg-rose-50 text-rose-600" },
  spotted: { label: "Spotted", color: "bg-amber-50 text-amber-700" },
  found:   { label: "Found",   color: "bg-emerald-50 text-emerald-700" },
} as const;

type Status = keyof typeof STATUS_CONFIG;

export default function LostPetsPage() {
  const { dangerMode } = useAdminAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const fetchReports = async () => {
    try {
      const data = await adminApi.get<any[]>("/admin/lost-pets");
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await adminApi.delete(`/admin/lost-pets/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch {
      alert("Failed to delete report.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: Status) => {
    setUpdatingId(id);
    try {
      const updated = await adminApi.patch<any>(`/admin/lost-pets/${id}/status`, { status });
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      if (selectedReport?.id === id) setSelectedReport((prev: any) => ({ ...prev, status }));
    } catch {
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() =>
    reports.filter((r) => {
      const matchSearch = !search ||
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.address?.toLowerCase().includes(search.toLowerCase()) ||
        r.author?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    }), [reports, search, statusFilter]);

  const counts = {
    all: reports.length,
    lost: reports.filter((r) => r.status === "lost").length,
    spotted: reports.filter((r) => r.status === "spotted").length,
    found: reports.filter((r) => r.status === "found").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Lost &amp; Found Pets</h1>
        <p className="text-slate-500 mt-1">Monitor lost pet reports and update their status.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Reports", value: counts.all,     color: "text-slate-950" },
          { label: "Lost",          value: counts.lost,    color: "text-rose-600" },
          { label: "Spotted",       value: counts.spotted, color: "text-amber-600" },
          { label: "Found",         value: counts.found,   color: "text-emerald-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by pet name, address or reporter…"
              className="flex-1 text-sm outline-none bg-transparent placeholder-slate-400 text-slate-900"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "lost", "spotted", "found"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-primary-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? `All (${counts.all})` : `${STATUS_CONFIG[s].label} (${counts[s]})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 size={28} className="animate-spin text-slate-400 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No reports found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Pet</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Reported By</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((report) => {
                  const cfg = STATUS_CONFIG[report.status as Status] ?? STATUS_CONFIG.lost;
                  return (
                    <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {report.imageUrl ? (
                            <img
                              src={report.imageUrl}
                              alt={report.name || "Pet"}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                              <AlertTriangle size={18} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-950 text-sm">
                              {report.name || <span className="text-slate-400 italic">Unnamed</span>}
                            </p>
                            {report.description && (
                              <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{report.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={report.status}
                          disabled={updatingId === report.id || !dangerMode}
                          onChange={(e) => handleStatusChange(report.id, e.target.value as Status)}
                          className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border-0 outline-none cursor-pointer ${cfg.color} ${!dangerMode ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <option value="lost">Lost</option>
                          <option value="spotted">Spotted</option>
                          <option value="found">Found</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="max-w-[160px] truncate">{report.address || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {report.author?.avatar_url ? (
                            <img src={report.author.avatar_url} className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                              {report.author?.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <span className="text-sm text-slate-700">{report.author?.name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-2 text-slate-400 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View full image"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            disabled={deletingId === report.id || !dangerMode}
                            className={`p-2 rounded-lg transition-colors ${
                              dangerMode
                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                                : "text-slate-300 cursor-not-allowed bg-slate-50/50"
                            }`}
                            title={!dangerMode ? "Enable Danger Mode to delete report" : "Delete report"}
                          >
                            {deletingId === report.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            {filtered.length} report{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Image preview modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            {selectedReport.imageUrl && (
              <img src={selectedReport.imageUrl} alt={selectedReport.name} className="w-full object-cover max-h-96" />
            )}
            <div className="p-5 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-950 text-lg">{selectedReport.name || "Unnamed Pet"}</p>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                    <MapPin size={13} />{selectedReport.address}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${STATUS_CONFIG[selectedReport.status as Status]?.color}`}>
                  {STATUS_CONFIG[selectedReport.status as Status]?.label}
                </span>
              </div>
              {selectedReport.description && (
                <p className="text-sm text-slate-600 leading-relaxed">{selectedReport.description}</p>
              )}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-400">
                  Reported by <span className="font-semibold text-slate-600">{selectedReport.author?.name ?? "Unknown"}</span>
                  {" · "}{selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </p>
                <button onClick={() => setSelectedReport(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={16} className="text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
