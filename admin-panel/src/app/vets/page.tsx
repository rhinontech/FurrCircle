"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Stethoscope, ShieldCheck, Search, CheckCircle2, Trash2, MoreVertical, X } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

export default function VetsPage() {
  const [vets, setVets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "verified">("all");
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchVets = async () => {
    try {
      const data = await adminApi.get<any[]>('/admin/vets');
      setVets(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVets(); }, []);

  const handleVerify = async (id: string) => {
    setActionId(id);
    try {
      await adminApi.patch(`/admin/vets/${id}/verify`);
      setVets(prev => prev.map(v => v.id === id ? { ...v, isVerified: true } : v));
    } catch { alert("Verification failed"); }
    finally { setActionId(null); setMenuOpenId(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove vet "${name}"? This cannot be undone.`)) return;
    setActionId(id);
    try {
      await adminApi.delete(`/admin/vets/${id}`);
      setVets(prev => prev.filter(v => v.id !== id));
    } catch { alert("Failed to remove vet."); }
    finally { setActionId(null); setMenuOpenId(null); }
  };

  const filtered = useMemo(() => {
    return vets.filter(v => {
      const matchTab = tab === "all" || (tab === "pending" ? !v.isVerified : v.isVerified);
      const matchSearch = !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.email?.toLowerCase().includes(search.toLowerCase()) || v.hospital_name?.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [vets, tab, search]);

  const pending = vets.filter(v => !v.isVerified).length;
  const verified = vets.filter(v => v.isVerified).length;

  return (
    <div className="space-y-8" onClick={() => setMenuOpenId(null)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Veterinarian Management</h1>
        <p className="text-slate-500 mt-1">Review and verify professional credentials for all clinic accounts.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
          <div className="p-2 bg-slate-50 rounded-lg w-fit mb-3"><Stethoscope size={20} className="text-primary-900" /></div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Vets</p>
          <p className="text-2xl font-bold text-slate-950 mt-1">{vets.length}</p>
        </div>
        <div className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
          <div className="p-2 bg-emerald-50 rounded-lg w-fit mb-3"><ShieldCheck size={20} className="text-emerald-600" /></div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Verified</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{verified}</p>
        </div>
        <div className="bg-white p-5 rounded-card border border-amber-100 shadow-sm">
          <div className="p-2 bg-amber-50 rounded-lg w-fit mb-3"><ShieldCheck size={20} className="text-amber-600" /></div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pending}</p>
        </div>
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex gap-1">
            {(["all", "pending", "verified"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                  tab === t ? "bg-primary-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {t} {t === "pending" && pending > 0 ? `(${pending})` : ""}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search vet, clinic, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-input focus:outline-none focus:ring-2 focus:ring-primary-900/20"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={14} /></button>}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading vets...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3 opacity-30" />
              <p className="text-slate-400 font-medium">{tab === "pending" ? "No pending verifications." : "No vets found."}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Vet / Clinic</th>
                  <th className="px-6 py-4">Specialty</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((vet) => (
                  <tr key={vet.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {vet.avatar_url ? (
                          <img src={vet.avatar_url} alt={vet.name} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                            <Stethoscope size={18} className="text-primary-900" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-950 text-sm">{vet.name}</p>
                          <p className="text-xs text-slate-400">{vet.hospital_name || vet.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">{vet.profession || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${vet.isVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                        {vet.isVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(vet.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!vet.isVerified && (
                          <button
                            onClick={() => handleVerify(vet.id)}
                            disabled={actionId === vet.id}
                            className="px-3 py-1.5 bg-primary-900 text-white rounded-lg text-[11px] font-bold hover:bg-primary-800 transition-colors disabled:opacity-60"
                          >
                            {actionId === vet.id ? "Verifying..." : "Verify"}
                          </button>
                        )}
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === vet.id ? null : vet.id)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <MoreVertical size={17} />
                          </button>
                          {menuOpenId === vet.id && (
                            <div className="absolute right-0 top-9 w-40 bg-white rounded-xl border border-slate-200 shadow-lg z-10 overflow-hidden">
                              <button
                                onClick={() => handleDelete(vet.id, vet.name)}
                                disabled={actionId === vet.id}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 size={15} />
                                Remove Vet
                              </button>
                            </div>
                          )}
                        </div>
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
            Showing {filtered.length} of {vets.length} vets
          </div>
        )}
      </div>
    </div>
  );
}
