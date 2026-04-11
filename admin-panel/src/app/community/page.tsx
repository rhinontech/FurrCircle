"use client";
import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Star,
  Users,
  Trash2,
  UserCheck
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPosts = async () => {
    try {
      const data = await adminApi.get<any[]>('/admin/pending-posts');
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const handleModerate = async (id: string, status: "approved" | "rejected") => {
    try {
      await adminApi.patch(`/admin/post-moderation/${id}`, { status });
      setPosts(posts.filter(p => p.id !== id));
    } catch {
      alert("Moderation failed");
    }
  };

  const highlights = [
    { label: "Pending Review", value: posts.length.toString(), change: "Queue", icon: MessageSquare },
    { label: "Active Users", value: "245", change: "+4.2%", icon: Users },
    { label: "Flagged Content", value: "12", change: "-15.8%", icon: AlertTriangle },
    { label: "Community Spotlight", value: "4", change: "Active", icon: Star },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Community & Content</h1>
          <p className="text-slate-500 mt-1">Monitor the feed, manage the community spotlight, and moderate content.</p>
        </div>
      </div>

      {/* Community KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {highlights.map((h, i) => (
          <div key={i} className="bg-white p-6 rounded-card border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary-50 rounded-lg">
                <h.icon size={20} className="text-primary-900" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">{h.label}</p>
            <p className="text-2xl font-bold text-slate-950 mt-1">{h.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-950 whitespace-nowrap">Pending Moderation</h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold">Synchronizing feed...</div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
               <CheckCircle2 size={48} className="text-emerald-500 mx-auto opacity-20 mb-4" />
               <p className="text-slate-400 font-medium">All posts have been moderated!</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Author & Post Content</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 max-w-md">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-950 text-xs">{post.author?.name || "Unknown"}</span>
                          <span className="text-[11px] text-slate-400 font-medium">• {post.createdAt}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed italic border-l-2 border-slate-200 pl-3">"{post.content}"</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-widest text-[10px]">{post.category}</span>
                    </td>
                    <td className="px-6 py-5 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleModerate(post.id, "approved")}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100" 
                        title="Approve"
                      >
                        <UserCheck size={16} />
                      </button>
                      <button 
                        onClick={() => handleModerate(post.id, "rejected")}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100" 
                        title="Reject"
                      >
                       <Trash2 size={16} />
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
