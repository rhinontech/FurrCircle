"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Search, X } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

type ContactLead = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  source: string;
  pagePath?: string | null;
  status: "new" | "contacted" | "closed";
  createdAt: string;
};

const STATUS_STYLES: Record<ContactLead["status"], string> = {
  new: "bg-amber-50 text-amber-700 border border-amber-200",
  contacted: "bg-blue-50 text-blue-700 border border-blue-200",
  closed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function ContactLeadsPage() {
  const [leads, setLeads] = useState<ContactLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .get<ContactLead[]>("/admin/contact-leads")
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = search.toLowerCase();
      const matchSearch = !query || [
        lead.name,
        lead.email,
        lead.phone || "",
        lead.message,
        lead.source,
        lead.pagePath || "",
      ].some((value) => value.toLowerCase().includes(query));

      const matchStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [leads, search, statusFilter]);

  const stats = [
    { label: "Total Leads", value: leads.length, className: "bg-primary-50 text-primary-900" },
    { label: "New", value: leads.filter((lead) => lead.status === "new").length, className: "bg-amber-50 text-amber-700" },
    { label: "Contacted", value: leads.filter((lead) => lead.status === "contacted").length, className: "bg-blue-50 text-blue-700" },
    { label: "Closed", value: leads.filter((lead) => lead.status === "closed").length, className: "bg-emerald-50 text-emerald-700" },
  ];

  const updateLeadStatus = async (leadId: string, status: ContactLead["status"]) => {
    setUpdatingId(leadId);

    try {
      const updatedLead = await adminApi.patch<ContactLead>(`/admin/contact-leads/${leadId}`, { status });
      setLeads((current) => current.map((lead) => lead.id === leadId ? updatedLead : lead));
    } catch (error) {
      console.error(error);
      alert("Failed to update lead status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Contact Leads</h1>
        <p className="text-slate-500 mt-1">Review everyone who reached out through the website contact forms.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-card border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex px-3 py-1 rounded-lg text-sm font-bold ${stat.className}`}>
              {stat.label}
            </div>
            <p className="text-2xl font-bold text-slate-950 mt-3">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">All Leads</h3>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
            {["all", "new", "contacted", "closed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                  statusFilter === status
                    ? "bg-primary-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading contact leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">No contact leads found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors align-top">
                    <td className="px-6 py-4 min-w-[220px]">
                      <p className="font-semibold text-slate-950 text-sm">{lead.name}</p>
                    </td>
                    <td className="px-6 py-4 min-w-[240px]">
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-primary-900">
                        <Mail size={14} />
                        {lead.email}
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="mt-2 flex items-center gap-2 text-sm text-slate-500 hover:text-primary-900">
                          <Phone size={14} />
                          {lead.phone}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 min-w-[320px]">
                      <p className="text-sm text-slate-600 leading-6">
                        {lead.message.length > 180 ? `${lead.message.slice(0, 180)}...` : lead.message}
                      </p>
                    </td>
                    <td className="px-6 py-4 min-w-[160px]">
                      <p className="text-sm font-semibold text-slate-800 capitalize">{lead.source.replace(/-/g, " ")}</p>
                      <p className="text-xs text-slate-400 mt-1">{lead.pagePath || "—"}</p>
                    </td>
                    <td className="px-6 py-4 min-w-[180px] text-sm text-slate-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4 min-w-[220px]">
                      <div className="flex flex-col gap-3">
                        <span className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${STATUS_STYLES[lead.status]}`}>
                          {lead.status}
                        </span>
                        <select
                          value={lead.status}
                          disabled={updatingId === lead.id}
                          onChange={(event) => updateLeadStatus(lead.id, event.target.value as ContactLead["status"])}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-900/20"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="closed">Closed</option>
                        </select>
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
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        )}
      </div>
    </div>
  );
}
