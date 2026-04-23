"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Stethoscope, ShieldCheck, Search, CheckCircle2, Trash2, MoreVertical, X, Mail, Phone, MapPin, Calendar, BadgeCheck } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

function VetDrawer({ vet, onClose, onVerify, onDelete, actionId }: { vet: any; onClose: () => void; onVerify: (id: string) => void; onDelete: (id: string, name: string) => void; actionId: string | null }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-950">Vet Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            {vet.avatar_url ? (
              <img src={vet.avatar_url} alt={vet.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
                <Stethoscope size={26} className="text-primary-900" />
              </div>
            )}
            <div>
              <p className="font-bold text-slate-950 text-lg leading-tight">{vet.name}</p>
              <p className="text-sm text-slate-400 mt-0.5">{vet.hospital_name || "No clinic name"}</p>
              <span className={`mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${vet.isVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                {vet.isVerified ? "Verified" : "Pending Review"}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <DetailRow icon={<Mail size={15} />} label="Email" value={vet.email || "—"} />
            <DetailRow icon={<Phone size={15} />} label="Phone" value={vet.phone || "—"} />
            <DetailRow icon={<BadgeCheck size={15} />} label="Specialty" value={vet.profession || "—"} />
            <DetailRow icon={<MapPin size={15} />} label="City" value={vet.city || "—"} />
            <DetailRow icon={<Calendar size={15} />} label="Joined" value={new Date(vet.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
            {vet.bio && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bio</p>
                <p className="text-sm text-slate-600 leading-relaxed">{vet.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col gap-2">
          {!vet.isVerified && (
            <button
              onClick={() => onVerify(vet.id)}
              disabled={actionId === vet.id}
              className="w-full py-2.5 bg-primary-900 text-white rounded-xl text-sm font-bold hover:bg-primary-800 transition-colors disabled:opacity-60"
            >
              {actionId === vet.id ? "Verifying..." : "Verify Vet"}
            </button>
          )}
          <button
            onClick={() => onDelete(vet.id, vet.name)}
            disabled={actionId === vet.id}
            className="w-full py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors disabled:opacity-60"
          >
            Remove Vet
          </button>
        </div>
      </div>
    </>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm text-slate-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function VetsPage() {
  const [vets, setVets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "verified">("all");
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedVet, setSelectedVet] = useState<any | null>(null);

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
      {selectedVet && (
        <VetDrawer
          vet={selectedVet}
          onClose={() => setSelectedVet(null)}
          onVerify={async (id) => { await handleVerify(id); setSelectedVet((v: any) => v ? { ...v, isVerified: true } : v); }}
          onDelete={async (id, name) => { await handleDelete(id, name); setSelectedVet(null); }}
          actionId={actionId}
        />
      )}
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
                  <tr key={vet.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => setSelectedVet(vet)}>
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
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
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
