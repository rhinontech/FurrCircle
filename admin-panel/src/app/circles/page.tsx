"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Users, Trash2, Search, Loader2, CircleDot, Globe, Plus, X, ImagePlus } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";
import { useRef } from "react";

const CATEGORIES = ["general", "health", "adoption", "training", "playdate", "nutrition", "other"];

const CATEGORY_COLORS: Record<string, string> = {
  general:   "bg-slate-100 text-slate-600",
  health:    "bg-emerald-50 text-emerald-700",
  adoption:  "bg-rose-50 text-rose-600",
  training:  "bg-amber-50 text-amber-700",
  playdate:  "bg-blue-50 text-blue-700",
  nutrition: "bg-orange-50 text-orange-700",
  other:     "bg-purple-50 text-purple-700",
};
const categoryColor = (cat?: string) =>
  CATEGORY_COLORS[(cat || "general").toLowerCase()] ?? "bg-slate-100 text-slate-600";

/* ─── Create drawer ─── */
function CreateDrawer({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (c: any) => void;
}) {
  const [form, setForm] = useState({ name: "", description: "", category: "general", coverImage: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      setImagePreview(URL.createObjectURL(file));
      const { url } = await adminApi.upload("circles", file);
      setForm(f => ({ ...f, coverImage: url }));
    } catch (err: any) {
      setError("Image upload failed: " + (err.message || "Try again"));
      setImagePreview("");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Circle name is required."); return; }
    if (uploading) { setError("Please wait for the image to finish uploading."); return; }
    setSaving(true); setError("");
    try {
      const created = await adminApi.post<any>("/admin/circles", {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        coverImage: form.coverImage || undefined,
      });
      onCreate(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create circle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 z-50 h-full w-120 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Create Circle</h2>
            <p className="text-sm text-slate-500 mt-0.5">New circle will be created by Super Admin.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Dog Parents Mumbai"
              className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 capitalize"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="What is this circle about?"
              className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Cover Image (optional)</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
            {imagePreview ? (
              <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-200">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                {uploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 size={22} className="animate-spin text-primary-900" />
                  </div>
                )}
                {!uploading && (
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-2.5 py-1.5 bg-white rounded-lg shadow text-xs font-bold text-slate-600 hover:text-primary-900">Change</button>
                    <button type="button" onClick={() => { setImagePreview(""); setForm(f => ({ ...f, coverImage: "" })); }} className="p-1.5 bg-white rounded-lg shadow text-slate-500 hover:text-rose-600"><X size={13} /></button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-36 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary-300 hover:bg-primary-50/30 flex flex-col items-center justify-center gap-2 transition-colors group"
              >
                <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-primary-100 transition-colors">
                  <ImagePlus size={20} className="text-slate-400 group-hover:text-primary-700" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600 group-hover:text-primary-900">Click to upload cover image</p>
                  <p className="text-xs text-slate-400 mt-0.5">PNG, JPG up to 10MB</p>
                </div>
              </button>
            )}
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</p>}
        </form>

        <div className="px-8 py-5 border-t border-slate-100 flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 rounded-xl bg-primary-900 text-white text-sm font-bold hover:bg-primary-800 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Creating…" : "Create Circle"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main page ─── */
export default function CirclesPage() {
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchCircles = async () => {
    try {
      const data = await adminApi.get<any[]>("/admin/circles");
      setCircles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCircles(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete circle "${name}" and all its content? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await adminApi.delete(`/admin/circles/${id}`);
      setCircles((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Failed to delete circle.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() =>
    circles.filter((c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.creator?.name?.toLowerCase().includes(search.toLowerCase())
    ), [circles, search]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Circles</h1>
          <p className="text-slate-500 mt-1">View, create and manage all community circles.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 bg-primary-900 text-white rounded-input flex items-center gap-2 font-bold text-sm hover:bg-primary-800 shadow-sm transition-colors"
        >
          <Plus size={18} /> Create Circle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Circles", value: circles.length, color: "text-slate-950" },
          { label: "Total Members", value: circles.reduce((s, c) => s + (c.memberCount || 0), 0), color: "text-primary-900" },
          { label: "Public Circles", value: circles.filter((c) => c.isPublic).length, color: "text-emerald-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category or creator…"
            className="flex-1 text-sm outline-none bg-transparent placeholder-slate-400 text-slate-900"
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center"><Loader2 size={28} className="animate-spin text-slate-400 mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CircleDot size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No circles found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Circle</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Creator</th>
                  <th className="px-6 py-4">Members</th>
                  <th className="px-6 py-4">Visibility</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((circle) => (
                  <tr key={circle.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {circle.coverImage ? (
                          <img src={circle.coverImage} alt={circle.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                            <CircleDot size={18} className="text-primary-700" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-950 text-sm">{circle.name}</p>
                          {circle.description && (
                            <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{circle.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${categoryColor(circle.category)}`}>
                        {circle.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {circle.creator?.avatar_url ? (
                          <img src={circle.creator.avatar_url} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {circle.creator?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <span className="text-sm text-slate-700">{circle.creator?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <Users size={13} className="text-slate-400" />
                        {circle.memberCount ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Globe size={13} className="text-slate-400" />
                        {circle.isPublic ? "Public" : "Private"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {circle.createdAt ? new Date(circle.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(circle.id, circle.name)}
                        disabled={deletingId === circle.id}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {deletingId === circle.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            {filtered.length} circle{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateDrawer
          onClose={() => setShowCreate(false)}
          onCreate={c => setCircles(prev => [c, ...prev])}
        />
      )}
    </div>
  );
}
