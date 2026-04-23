"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  PawPrint,
  Stethoscope,
  Bell,
  TrendingUp,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

type AdminStats = {
  totalUsers: number;
  totalVets: number;
  totalPets: number;
  totalPosts: number;
  pendingPosts: number;
  pendingVets: number;
  totalAppointments: number;
  totalContactLeads: number;
  newContactLeads: number;
};

type PendingVet = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingVets, setPendingVets] = useState<PendingVet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.get<AdminStats>('/admin/stats'),
      adminApi.get<PendingVet[]>('/admin/vets/pending'),
    ])
      .then(([s, vets]) => {
        setStats(s);
        setPendingVets(vets.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, change: "Live" },
        { label: "Active Pets", value: stats.totalPets.toLocaleString(), icon: PawPrint, change: "Live" },
        { label: "Vets Joined", value: stats.totalVets.toLocaleString(), icon: Stethoscope, change: "Live" },
        { label: "New Leads", value: stats.newContactLeads.toLocaleString(), icon: Mail, change: "Inbox" },
        { label: "Pending Posts", value: stats.pendingPosts.toLocaleString(), icon: Bell, change: "Queue" },
        { label: "Pending Vets", value: stats.pendingVets.toLocaleString(), icon: ShieldCheck, change: "Queue" },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back, here's what's happening with FurrCircle today.</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="h-32 flex items-center justify-center text-slate-400 font-medium">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-card border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="bg-primary-50 p-3 rounded-xl">
                  <stat.icon className="text-primary-900" size={24} />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-950 mt-1">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-card border border-slate-200 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-950">Growth Activity</h3>
            <TrendingUp className="text-slate-400" size={20} />
          </div>
          <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium italic">Chart visualization coming soon</p>
          </div>
        </div>

        {/* Pending Vet Verifications */}
        <div className="bg-white rounded-card border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-950 mb-6">Pending Verifications</h3>
          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : pendingVets.length === 0 ? (
            <p className="text-slate-400 text-sm">No pending verifications.</p>
          ) : (
            <div className="space-y-4">
              {pendingVets.map((vet) => (
                <div key={vet.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-950 truncate">{vet.name}</p>
                    <p className="text-xs text-slate-500 truncate">{vet.email}</p>
                  </div>
                  <a href="/vets" className="text-xs font-bold text-primary-900 hover:underline shrink-0">Review</a>
                </div>
              ))}
            </div>
          )}
          <a href="/vets" className="block w-full mt-6 py-2.5 text-sm font-bold text-center text-slate-600 bg-slate-100 rounded-input hover:bg-slate-200 transition-colors">
            View All
          </a>
        </div>
      </div>
    </div>
  );
}
