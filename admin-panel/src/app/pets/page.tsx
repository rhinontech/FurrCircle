"use client";
import React, { useState, useEffect, useMemo } from "react";
import { PawPrint, Search, X, Heart, Activity, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

export default function PetsPage() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    adminApi.get<any[]>('/admin/pets')
      .then(setPets)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return pets.filter(p => {
      const matchSearch = !search
        || p.name?.toLowerCase().includes(search.toLowerCase())
        || p.species?.toLowerCase().includes(search.toLowerCase())
        || p.breed?.toLowerCase().includes(search.toLowerCase())
        || p.owner?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all"
        || (statusFilter === "adoption" && p.isAdoptionOpen)
        || (statusFilter === "owned" && !p.isAdoptionOpen);
      return matchSearch && matchStatus;
    });
  }, [pets, search, statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the platform? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await adminApi.delete(`/admin/pets/${id}`);
      setPets(prev => prev.filter(p => p.id !== id));
    } catch {
      alert("Failed to remove pet. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = [
    { label: "Total Pets", value: pets.length, icon: Activity, color: "bg-primary-50 text-primary-900" },
    { label: "Owned / Under Care", value: pets.filter(p => !p.isAdoptionOpen).length, icon: Heart, color: "bg-emerald-50 text-emerald-600" },
    { label: "Open for Adoption", value: pets.filter(p => p.isAdoptionOpen).length, icon: PawPrint, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Pet Ecosystem</h1>
        <p className="text-slate-500 mt-1">All pets registered across the PawsHub network.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-card border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${s.color}`}><s.icon size={20} /></div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className="text-3xl font-bold text-slate-950 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">Pet Database</h3>
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search name, species, breed, owner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-input focus:outline-none focus:ring-2 focus:ring-primary-900/20"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-1">
              {[
                { key: "all", label: "All" },
                { key: "owned", label: "Owned" },
                { key: "adoption", label: "Adoption" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${statusFilter === f.key ? "bg-primary-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Accessing pet database...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <PawPrint size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No pets found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Pet</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Added</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((pet) => (
                  <tr key={pet.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {pet.avatar_url ? (
                          <img src={pet.avatar_url} alt={pet.name} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <PawPrint size={18} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-950 text-sm">{pet.name}</p>
                          <p className="text-xs text-slate-400">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{pet.owner?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{pet.owner?.email || ""}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {pet.gender && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pet.gender}</span>}
                        {pet.age && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pet.age}</span>}
                        {pet.weight && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pet.weight}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${pet.isAdoptionOpen ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                        {pet.isAdoptionOpen ? "Adoption Open" : "Owned"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {pet.createdAt
                        ? new Date(pet.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(pet.id, pet.name)}
                        disabled={deletingId === pet.id}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-40"
                        title="Remove pet"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            Showing {filtered.length} of {pets.length} pets
          </div>
        )}
      </div>
    </div>
  );
}
