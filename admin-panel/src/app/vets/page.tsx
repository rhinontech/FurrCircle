"use client";
import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  MoreVertical,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
  FileCheck,
  AlertTriangle
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

export default function VetsPage() {
  const [vets, setVets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVets = async () => {
    try {
      const data = await adminApi.get<any[]>('/admin/vets/pending');
      setVets(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      await adminApi.patch(`/admin/vets/${id}/verify`);
      setVets(vets.filter(v => v.id !== id));
    } catch {
      alert("Verification failed");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Veterinarian Management</h1>
          <p className="text-slate-500 mt-1">Review onboarding clinics and verify professional credentials.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-primary-900 text-white rounded-input flex items-center gap-2 font-bold text-sm hover:bg-primary-800 transition-colors shadow-sm">
            <ClipboardList size={18} />
            Bulk Review
          </button>
        </div>
      </div>

      {/* Verification Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <ClipboardList size={20} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Queue</h3>
          </div>
          <p className="text-3xl font-bold text-slate-950">{vets.length} Requests</p>
          <p className="text-xs text-slate-500 font-medium mt-2">Expected review time: ~4h</p>
        </div>
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Verified</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-600">152 Total</p>
          <p className="text-xs text-slate-500 font-medium mt-2">+12 this week</p>
        </div>
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileCheck size={20} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">In Review</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">5 Vets</p>
          <p className="text-xs text-slate-500 font-medium mt-2">Active session with admin</p>
        </div>
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-50 rounded-lg">
              <AlertCircle size={20} className="text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Flagged</h3>
          </div>
          <p className="text-3xl font-bold text-rose-600">2 Docs</p>
          <p className="text-xs text-slate-500 font-medium mt-2">Expired credentials or issues</p>
        </div>
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">Verification Directory</h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold">Connecting to PawsHub engine...</div>
          ) : vets.length === 0 ? (
            <div className="p-12 text-center">
               <ShieldCheck size={48} className="text-emerald-500 mx-auto opacity-20 mb-4" />
               <p className="text-slate-400 font-medium">All veterinarians currently verified!</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Clinic & Vet Detail</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vets.map((vet) => (
                  <tr key={vet.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-900 group-hover:bg-primary-900 group-hover:text-white transition-all duration-300">
                          <Stethoscope size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-950 text-xs tracking-tight">{vet.name}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{vet.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-600 font-medium">{vet.email}</td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                        In Review
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => handleVerify(vet.id)}
                        className="px-3 py-1.5 bg-primary-900 text-white rounded-input text-[10px] font-bold uppercase tracking-wider hover:bg-primary-800 transition-colors shadow-sm"
                      >
                        Verify Credentials
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

const ShieldAlert = ({ size }: { size: number }) => <AlertTriangle size={size} />;
