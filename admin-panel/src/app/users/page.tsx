"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Users, UserCheck, Stethoscope, Search, Trash2, MoreVertical, X } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove user "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await adminApi.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {
      alert("Failed to remove user.");
    } finally {
      setDeletingId(null);
      setMenuOpenId(null);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "bg-primary-50 text-primary-900" },
    { label: "Pet Owners", value: users.filter(u => u.role === 'owner').length, icon: UserCheck, color: "bg-emerald-50 text-emerald-700" },
    { label: "Veterinarians", value: users.filter(u => u.role === 'veterinarian').length, icon: Stethoscope, color: "bg-blue-50 text-blue-700" },
    { label: "Admins", value: users.filter(u => u.role === 'admin').length, icon: Users, color: "bg-amber-50 text-amber-700" },
  ];

  const roleColors: Record<string, string> = {
    owner: "bg-emerald-50 text-emerald-600",
    veterinarian: "bg-blue-50 text-blue-600",
    admin: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="space-y-8" onClick={() => setMenuOpenId(null)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">User Management</h1>
          <p className="text-slate-500 mt-1">Manage pet owners, veterinarians, and administrators.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-card border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className="text-2xl font-bold text-slate-950 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">All Users</h3>
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-input focus:outline-none focus:ring-2 focus:ring-primary-900/20"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-1">
              {["all", "owner", "veterinarian", "admin"].map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                    roleFilter === role ? "bg-primary-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">No users found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-950 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleColors[user.role] || "bg-slate-100 text-slate-500"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${user.isVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                        {user.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === user.id ? null : user.id)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={17} />
                        </button>
                        {menuOpenId === user.id && (
                          <div className="absolute right-0 top-9 w-40 bg-white rounded-xl border border-slate-200 shadow-lg z-10 overflow-hidden">
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              disabled={deletingId === user.id}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={15} />
                              {deletingId === user.id ? "Removing..." : "Remove User"}
                            </button>
                          </div>
                        )}
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
            Showing {filtered.length} of {users.length} users
          </div>
        )}
      </div>
    </div>
  );
}
