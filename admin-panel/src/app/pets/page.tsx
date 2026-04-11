"use client";
import React, { useState, useEffect } from "react";
import {
  PawPrint,
  ChevronRight,
  MoreVertical,
  Activity,
  Heart,
  Droplets,
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

export default function PetsPage() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPets = async () => {
    try {
      const data = await adminApi.get<any[]>('/admin/pets');
      setPets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest font-bold">
          <PawPrint size={14} className="text-primary-900" />
          <span>Ecosystem</span>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-slate-900">Pet Listings</span>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-950">Pet Ecosystem Overview</h1>
        <p className="text-slate-500 mt-1">Monitoring {pets.length} active pets across the PawsHub network.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Activity size={20} className="text-primary-900" />
            </div>
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Total Active</h3>
          </div>
          <p className="text-4xl font-bold text-slate-950">{pets.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-4">Growth tracking enabled</p>
        </div>

        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-50 rounded-lg">
              <Heart size={20} className="text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Under Care</h3>
          </div>
          <p className="text-4xl font-bold text-slate-950">{pets.filter(p => !p.isAdoptionOpen).length}</p>
          <p className="text-xs text-slate-500 font-medium mt-4">Verified by PawsHub Vets</p>
        </div>

        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Droplets size={20} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Listed</h3>
          </div>
          <p className="text-4xl font-bold text-slate-950">{pets.filter(p => p.isAdoptionOpen).length}</p>
          <p className="text-xs text-slate-500 font-medium mt-4">Open for Adoption/Foster</p>
        </div>
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">Pet Database</h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 text-center text-slate-500 font-bold">Accessing ecosystem database...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Pet Detail</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <PawPrint size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-950 text-xs tracking-tight">{pet.name}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{pet.species} • {pet.breed || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs text-slate-700 font-semibold">{pet.owner?.name || "Unknown"}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        pet.isAdoptionOpen ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {pet.isAdoptionOpen ? "Listed Adoption" : "Healthy / Owned"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-slate-400 hover:text-primary-900 transition-colors">
                        <MoreVertical size={18} />
                      </button>
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
