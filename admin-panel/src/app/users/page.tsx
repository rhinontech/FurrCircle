"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  MoreVertical,
  ShieldCheck,
  AlertCircle,
  UserCheck
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await adminApi.get<any[]>('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = [
    { label: "Total Users", value: users.length.toString(), icon: Users, change: "Network" },
    { label: "Active Owners", value: users.filter(u => u.role === 'owner').length.toString(), icon: UserCheck, change: "Live" },
    { label: "Pending Vets", value: users.filter(u => u.role === 'veterinarian' && !u.isVerified).length.toString(), icon: ShieldCheck, change: "Queue" },
    { label: "Reported", value: "0", icon: AlertCircle, change: "Neutral" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">User Management</h1>
          <p className="text-slate-500 mt-1">Manage pet owners, veterinarians, and system administrators.</p>
        </div>
      </div>

      {/* User KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-card border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary-50 rounded-lg">
                <s.icon size={20} className="text-primary-900" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">{s.label}</p>
            <p className="text-2xl font-bold text-slate-950 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">All Users</h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 text-center text-slate-500 font-bold">Querying directory...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {user.name?.charAt(0) || "?"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-950 text-xs">{user.name}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs text-slate-600 font-bold uppercase tracking-widest text-[10px]">{user.role}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.isVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {user.isVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs text-slate-500 font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
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
