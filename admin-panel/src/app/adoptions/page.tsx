"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Heart, PawPrint, Search, X, CheckCircle2, User } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

export default function AdoptionsPage() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");

  useEffect(() => {
    adminApi.get<any[]>('/admin/adoptions')
      .then(setPets)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const species = useMemo(() => {
    const all = pets.map(p => p.species).filter(Boolean);
    return ["all", ...Array.from(new Set<string>(all))];
  }, [pets]);

  const filtered = useMemo(() => {
    return pets.filter(p => {
      const matchSearch = !search
        || p.name?.toLowerCase().includes(search.toLowerCase())
        || p.breed?.toLowerCase().includes(search.toLowerCase())
        || p.owner?.name?.toLowerCase().includes(search.toLowerCase());
      const matchSpecies = speciesFilter === "all" || p.species === speciesFilter;
      return matchSearch && matchSpecies;
    });
  }, [pets, search, speciesFilter]);

  const stats = [
    { label: "Open Listings", value: pets.length, color: "bg-rose-50 text-rose-600", icon: Heart },
    { label: "Dogs", value: pets.filter(p => p.species?.toLowerCase() === "dog").length, color: "bg-amber-50 text-amber-600", icon: PawPrint },
    { label: "Cats", value: pets.filter(p => p.species?.toLowerCase() === "cat").length, color: "bg-blue-50 text-blue-600", icon: PawPrint },
    { label: "Others", value: pets.filter(p => !["dog", "cat"].includes(p.species?.toLowerCase())).length, color: "bg-slate-100 text-slate-600", icon: PawPrint },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Adoption Listings</h1>
        <p className="text-slate-500 mt-1">Pets currently open for adoption or foster across FurrCircle.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-card border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${s.color}`}><s.icon size={18} /></div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className="text-2xl font-bold text-slate-950 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">Open Listings</h3>
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search name, breed, owner..."
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
            <div className="flex gap-1 flex-wrap">
              {species.map(s => (
                <button
                  key={s}
                  onClick={() => setSpeciesFilter(s)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-colors ${speciesFilter === s ? "bg-primary-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading adoption listings...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No adoption listings found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Pet</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Listed</th>
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
                          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                            <PawPrint size={18} className="text-rose-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-950 text-sm">{pet.name}</p>
                          <p className="text-xs text-slate-400">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{pet.owner?.name || "—"}</p>
                          <p className="text-xs text-slate-400">{pet.owner?.email || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {pet.gender && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pet.gender}</span>}
                        {pet.age && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pet.age}</span>}
                        {pet.weight && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pet.weight}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {pet.createdAt
                        ? new Date(pet.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            {filtered.length} of {pets.length} listings
          </div>
        )}
      </div>
    </div>
  );
}
