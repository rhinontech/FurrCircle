"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Heart,
  Home,
  Search,
  X,
  PawPrint,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "approved") return <CheckCircle2 size={13} />;
  if (status === "rejected") return <XCircle size={13} />;
  return <Clock size={13} />;
};

export default function AdoptionApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    adminApi
      .get<any[]>("/adoptions/admin")
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch =
        !search ||
        a.applicantName?.toLowerCase().includes(search.toLowerCase()) ||
        a.pet?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.applicantEmail?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchType = typeFilter === "all" || a.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [applications, search, statusFilter, typeFilter]);

  const stats = [
    {
      label: "Total",
      value: applications.length,
      color: "bg-slate-100 text-slate-700",
      icon: Filter,
    },
    {
      label: "Pending",
      value: applications.filter((a) => a.status === "pending").length,
      color: "bg-amber-50 text-amber-600",
      icon: Clock,
    },
    {
      label: "Approved",
      value: applications.filter((a) => a.status === "approved").length,
      color: "bg-emerald-50 text-emerald-600",
      icon: CheckCircle2,
    },
    {
      label: "Adoption",
      value: applications.filter((a) => a.type === "adoption").length,
      color: "bg-rose-50 text-rose-600",
      icon: Heart,
    },
  ];

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Adoption Applications</h1>
        <p className="text-slate-500 mt-1">
          All adoption and foster applications submitted through PawsHub.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-card border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex p-2 rounded-lg mb-3 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              {s.label}
            </p>
            <p className="text-2xl font-bold text-slate-950 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">All Applications</h3>
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Search applicant, pet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-input focus:outline-none focus:ring-2 focus:ring-primary-900/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* Status filter */}
          <div className="flex gap-1 flex-wrap">
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-primary-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Type filter */}
          <div className="flex gap-1 flex-wrap">
            {["all", "adoption", "foster"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                  typeFilter === t
                    ? "bg-primary-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              Loading applications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <PawPrint size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No applications found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Pet</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Applicant */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-950 text-sm">
                        {app.applicantName || "—"}
                      </p>
                      <p className="text-xs text-slate-400">{app.applicantEmail || "—"}</p>
                      {app.applicantCity && (
                        <p className="text-xs text-slate-400">{app.applicantCity}</p>
                      )}
                      {app.applicantPhone && (
                        <p className="text-xs text-slate-400">{app.applicantPhone}</p>
                      )}
                    </td>

                    {/* Pet */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {app.pet?.avatar_url ? (
                          <img
                            src={app.pet.avatar_url}
                            alt={app.pet.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                            <PawPrint size={14} className="text-rose-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-950 text-sm">
                            {app.pet?.name || "—"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {[app.pet?.species, app.pet?.breed].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          app.type === "adoption"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {app.type === "adoption" ? (
                          <Heart size={11} />
                        ) : (
                          <Home size={11} />
                        )}
                        <span className="capitalize">{app.type}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          STATUS_STYLES[app.status] || STATUS_STYLES.pending
                        }`}
                      >
                        <StatusIcon status={app.status} />
                        <span className="capitalize">{app.status}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500">{formatDate(app.createdAt)}</p>
                    </td>

                    {/* Message */}
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-slate-500 truncate max-w-[200px]">
                        {app.message || <span className="text-slate-300 italic">No message</span>}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
