"use client";
import React, { useState, useEffect } from "react";
import { MessageSquare, CheckCircle2, AlertTriangle, UserCheck, Trash2, Eye } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

export default function CommunityPage() {
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pending, all] = await Promise.all([
        adminApi.get<any[]>('/admin/pending-posts'),
        adminApi.get<any[]>('/admin/posts'),
      ]);
      setPendingPosts(pending);
      setAllPosts(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleModerate = async (id: string, status: "approved" | "rejected") => {
    setModeratingId(id);
    try {
      await adminApi.patch(`/admin/post-moderation/${id}`, { status });
      setPendingPosts(prev => prev.filter(p => p.id !== id));
      setAllPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch {
      alert("Moderation failed");
    } finally {
      setModeratingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-600",
    pending: "bg-amber-50 text-amber-600",
    rejected: "bg-rose-50 text-rose-600",
  };

  const displayPosts = tab === "pending" ? pendingPosts : allPosts;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Community & Content</h1>
          <p className="text-slate-500 mt-1">Monitor the feed and moderate community posts.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: pendingPosts.length, icon: MessageSquare, color: "bg-amber-50 text-amber-600" },
          { label: "Total Posts", value: allPosts.length, icon: Eye, color: "bg-primary-50 text-primary-900" },
          { label: "Approved", value: allPosts.filter(p => p.status === 'approved').length, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Rejected", value: allPosts.filter(p => p.status === 'rejected').length, icon: AlertTriangle, color: "bg-rose-50 text-rose-600" },
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

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => setTab("pending")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${tab === "pending" ? "bg-primary-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              Pending {pendingPosts.length > 0 ? `(${pendingPosts.length})` : ""}
            </button>
            <button
              onClick={() => setTab("all")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${tab === "all" ? "bg-primary-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              All Posts
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Synchronizing feed...</div>
          ) : displayPosts.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3 opacity-30" />
              <p className="text-slate-400 font-medium">
                {tab === "pending" ? "All posts have been moderated!" : "No posts found."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Author & Content</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  {tab === "pending" && <th className="px-6 py-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 max-w-md">
                      <div className="flex items-start gap-3">
                        {post.author?.avatar_url ? (
                          <img src={post.author.avatar_url} alt={post.author.name} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 mt-0.5">
                            {post.author?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-950 text-sm">{post.author?.name || "Unknown"}</p>
                          <p className="text-xs text-slate-500 mt-1 italic leading-relaxed line-clamp-2">
                            "{post.content}"
                          </p>
                          {post.image_url && (
                            <img src={post.image_url} alt="post" className="mt-2 h-16 w-24 object-cover rounded-lg" />
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
                    {tab === "pending" && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleModerate(post.id, "approved")}
                            disabled={moderatingId === post.id}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100 disabled:opacity-50"
                            title="Approve"
                          >
                            <UserCheck size={16} />
                          </button>
                          <button
                            onClick={() => handleModerate(post.id, "rejected")}
                            disabled={moderatingId === post.id}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100 disabled:opacity-50"
                            title="Reject"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            {displayPosts.length} posts
          </div>
        )}
      </div>
    </div>
  );
}
