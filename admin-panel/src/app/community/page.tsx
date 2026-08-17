"use client";
import React, { useState, useEffect, useMemo } from "react";
import { MessageSquare, CheckCircle2, AlertTriangle, Search, X, Eye } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

export default function CommunityPage() {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi.get<any[]>('/admin/posts')
      .then(setAllPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-600",
    pending:  "bg-amber-50 text-amber-600",
    rejected: "bg-rose-50 text-rose-600",
  };

  const filtered = useMemo(() => {
    return allPosts.filter(p => {
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (p.author?.name || p.vetAuthor?.name || "").toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [allPosts, search, statusFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Community &amp; Content</h1>
        <p className="text-slate-500 mt-1">Monitor and moderate all community posts.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Posts",  value: allPosts.length,                                              icon: Eye,           color: "bg-primary-50 text-primary-900" },
          { label: "Approved",     value: allPosts.filter(p => p.status === "approved").length,         icon: CheckCircle2,  color: "bg-emerald-50 text-emerald-600" },
          { label: "Rejected",     value: allPosts.filter(p => p.status === "rejected").length,         icon: AlertTriangle, color: "bg-rose-50 text-rose-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-card border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className="text-2xl font-bold text-slate-950 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Status filter */}
          <div className="flex gap-1">
            {(["all", "approved", "rejected"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                  statusFilter === s ? "bg-primary-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? `All (${allPosts.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${allPosts.filter(p => p.status === s).length})`}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search author or content…"
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
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading posts…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No posts found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Author &amp; Content</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((post) => {
                  const displayAuthor = post.author || post.vetAuthor;
                  return (
                    <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 max-w-md">
                        <div className="flex items-start gap-3">
                          {displayAuthor?.avatar_url ? (
                            <img src={displayAuthor.avatar_url} alt={displayAuthor.name} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 mt-0.5">
                              {displayAuthor?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-950 text-sm">
                              {displayAuthor?.name || "Unknown"}
                              {post.vetAuthor && <span className="ml-1.5 text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">Vet</span>}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 italic leading-relaxed line-clamp-2">"{post.content}"</p>
                            {post.imageUrl && (
                              <img src={post.imageUrl} alt="post" className="mt-2 h-16 w-24 object-cover rounded-lg" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {post.category || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[post.status] || "bg-slate-100 text-slate-500"}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!loading && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            {filtered.length} posts
          </div>
        )}
      </div>
    </div>
  );
}
