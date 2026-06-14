"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Users, UserCheck, Stethoscope, Search, Trash2, MoreVertical, X,
  Mail, Phone, MapPin, Calendar, AtSign, Hash, Copy, Check, Eye,
  ShieldCheck, FileText, Lock, Heart, Tag,
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

/* ─── Copyable field (id / email / phone) ─── */
function CopyField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  const has = !!value;

  const copy = async () => {
    if (!has) return;
    try {
      await navigator.clipboard.writeText(value!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm text-slate-700 break-all">{has ? value : "—"}</p>
          {has && (
            <button
              onClick={copy}
              className="shrink-0 p-1 rounded-md text-slate-400 hover:text-primary-900 hover:bg-slate-100 transition-colors"
              title={`Copy ${label.toLowerCase()}`}
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm text-slate-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function Chips({ items }: { items?: string[] | null }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">—</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span key={it} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
          {it}
        </span>
      ))}
    </div>
  );
}

const roleColors: Record<string, string> = {
  owner: "bg-emerald-50 text-emerald-600",
  shelter: "bg-blue-50 text-blue-600",
  admin: "bg-amber-50 text-amber-600",
};

/* ─── User detail drawer ─── */
function UserDrawer({ user, onClose, onDelete, deleting }: {
  user: any;
  onClose: () => void;
  onDelete: (id: string, name: string) => void;
  deleting: boolean;
}) {
  const flags = [
    { label: "Onboarded", on: user.hasCompletedOnboarding },
    { label: "Private", on: user.isPrivate },
    { label: "2FA", on: user.twoFactorEnabled },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-950">User Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-900 font-bold text-xl">
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-950 text-lg leading-tight truncate">{user.name}</p>
              {user.username && <p className="text-sm text-slate-400 mt-0.5">@{user.username}</p>}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleColors[user.role] || "bg-slate-100 text-slate-500"}`}>
                  {user.role}
                </span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.isVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  {user.isVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact + identity */}
          <div className="space-y-4">
            <CopyField icon={<Mail size={15} />} label="Email" value={user.email} />
            <CopyField icon={<Phone size={15} />} label="Phone" value={user.phone} />
            <CopyField icon={<AtSign size={15} />} label="Username" value={user.username} />
            <CopyField icon={<Hash size={15} />} label="User ID" value={user.id} />
            <DetailRow icon={<MapPin size={15} />} label="City" value={user.city || "—"} />
            <DetailRow icon={<MapPin size={15} />} label="Address" value={user.address || "—"} />
            <DetailRow
              icon={<Calendar size={15} />}
              label="Joined"
              value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            />
          </div>

          {/* Flags */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Lock size={13} /> Account
            </p>
            <div className="flex flex-wrap gap-1.5">
              {flags.map((f) => (
                <span
                  key={f.label}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${f.on ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                >
                  {f.on ? "✓" : "✕"} {f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Heart size={13} /> Pet Interests
              </p>
              <Chips items={user.petTypeInterests} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Tag size={13} /> Topics
              </p>
              <Chips items={user.topicInterests} />
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <FileText size={13} /> Bio
              </p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100">
          <button
            onClick={() => onDelete(user.id, user.name)}
            disabled={deleting}
            className="w-full py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Trash2 size={15} />
            {deleting ? "Removing..." : "Remove User"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

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
      setSelectedUser((u: any) => (u && u.id === id ? null : u));
    } catch {
      alert("Failed to remove user.");
    } finally {
      setDeletingId(null);
      setMenuOpenId(null);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const term = search.toLowerCase();
      const matchSearch = !search
        || u.name?.toLowerCase().includes(term)
        || u.email?.toLowerCase().includes(term)
        || u.username?.toLowerCase().includes(term)
        || u.phone?.toLowerCase().includes(term)
        || u.id?.toLowerCase().includes(term);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "bg-primary-50 text-primary-900" },
    { label: "Pet Owners", value: users.filter(u => u.role === 'owner').length, icon: UserCheck, color: "bg-emerald-50 text-emerald-700" },
    { label: "Shelters", value: users.filter(u => u.role === 'shelter').length, icon: Stethoscope, color: "bg-blue-50 text-blue-700" },
    { label: "Admins", value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck, color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="space-y-8" onClick={() => setMenuOpenId(null)}>
      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onDelete={handleDelete}
          deleting={deletingId === selectedUser.id}
        />
      )}

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
                placeholder="Search by name, email, phone, username or ID..."
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
              {["all", "owner", "shelter", "admin"].map(role => (
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
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950 text-sm truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{user.phone || "—"}</td>
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
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
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
                          <div className="absolute right-0 top-9 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-10 overflow-hidden">
                            <button
                              onClick={() => { setSelectedUser(user); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Eye size={15} />
                              View Details
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              disabled={deletingId === user.id}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
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
