"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  X,
  PawPrint,
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200",
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "completed" || status === "confirmed") return <CheckCircle2 size={13} />;
  if (status === "cancelled" || status === "rejected") return <XCircle size={13} />;
  return <Clock size={13} />;
};

const formatDate = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    adminApi
      .get<any[]>("/admin/appointments")
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const matchSearch =
        !search ||
        a.owner?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.veterinarian?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.pet?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [appointments, search, statusFilter]);

  const stats = [
    {
      label: "Total",
      value: appointments.length,
      icon: Calendar,
      color: "bg-primary-50 text-primary-900",
    },
    {
      label: "Pending",
      value: appointments.filter(a => a.status === "pending").length,
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Completed",
      value: appointments.filter(a => a.status === "completed").length,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Cancelled",
      value: appointments.filter(a => a.status === "cancelled" || a.status === "rejected").length,
      icon: XCircle,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  const statusTabs = ["all", "pending", "confirmed", "completed", "cancelled"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Appointments</h1>
        <p className="text-slate-500 mt-1">All appointments booked across the FurrCircle platform.</p>
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
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className="text-2xl font-bold text-slate-950 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">All Appointments</h3>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search owner, vet, or pet..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
          <div className="flex gap-1 flex-wrap">
            {statusTabs.map(s => (
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
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading appointments...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No appointments found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Vet / Clinic</th>
                  <th className="px-6 py-4">Pet</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Owner */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-950 text-sm">{appt.owner?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{appt.owner?.email || ""}</p>
                    </td>

                    {/* Vet */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-950 text-sm">{appt.veterinarian?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{appt.veterinarian?.hospital_name || ""}</p>
                    </td>

                    {/* Pet */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <PawPrint size={13} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950 text-sm">{appt.pet?.name || "—"}</p>
                          <p className="text-xs text-slate-400 capitalize">{appt.pet?.species || ""}</p>
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{formatDate(appt.date)}</p>
                      {appt.time && (
                        <p className="text-xs text-slate-400 mt-0.5">{appt.time}</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          STATUS_COLORS[appt.status] || STATUS_COLORS.pending
                        }`}
                      >
                        <StatusIcon status={appt.status} />
                        {appt.status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            Showing {filtered.length} of {appointments.length} appointments
          </div>
        )}
      </div>
    </div>
  );
}
