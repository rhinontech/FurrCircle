"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  MessageCircle, Plus, Trash2, Loader2, Search, ChevronDown,
  ChevronUp, Flame, X, Tag, Globe, CircleDot,
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

/* ─── helpers ─── */
const isHotToday = (q: any) => {
  const ageH = (Date.now() - new Date(q.createdAt).getTime()) / 36e5;
  return ageH <= 24 && (q.upvotes >= 3 || q.answerCount >= 1);
};

/* ─── types ─── */
type Question = {
  id: string; title: string; body?: string; tags: string[];
  upvotes: number; answerCount: number; circleId?: string;
  circle?: { id: string; name: string };
  author?: { id: string; name: string; avatar_url?: string };
  createdAt: string;
};
type Answer = {
  id: string; text: string; upvotes: number; isAccepted: boolean;
  author?: { name: string; avatar_url?: string }; createdAt: string;
};

/* ─── Create drawer ─── */
function CreateDrawer({ circles, onClose, onCreate }: {
  circles: any[];
  onClose: () => void;
  onCreate: (q: Question) => void;
}) {
  const [form, setForm] = useState({ title: "", body: "", tagsRaw: "", circleId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError("");
    try {
      const tags = form.tagsRaw.split(",").map(t => t.trim()).filter(Boolean);
      const created = await adminApi.post<Question>("/admin/questions", {
        title: form.title.trim(),
        body: form.body.trim() || undefined,
        tags,
        circleId: form.circleId || undefined,
      });
      onCreate(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 z-50 h-full w-[480px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Post a Question</h2>
            <p className="text-sm text-slate-500 mt-0.5">Will be posted as Super Admin.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Circle selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Circle (optional)</label>
            <select
              value={form.circleId}
              onChange={e => setForm(f => ({ ...f, circleId: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20"
            >
              <option value="">🌐 Global (no circle)</option>
              {circles.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. What's the best food for golden retrievers?"
              className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Details (optional)</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={4}
              placeholder="Add more context or details…"
              className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tags (comma separated)</label>
            <input
              value={form.tagsRaw}
              onChange={e => setForm(f => ({ ...f, tagsRaw: e.target.value }))}
              placeholder="e.g. nutrition, golden-retriever, food"
              className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20"
            />
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</p>}
        </form>

        <div className="px-8 py-5 border-t border-slate-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 rounded-xl bg-primary-900 text-white text-sm font-bold hover:bg-primary-800 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Posting…" : "Post Question"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Answers panel ─── */
function AnswersPanel({ questionId, onClose }: { questionId: string; onClose: () => void }) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    adminApi.get<Answer[]>(`/admin/questions/${questionId}/answers`)
      .then(setAnswers).catch(console.error).finally(() => setLoading(false));
  }, [questionId]);

  const handleDelete = async (answerId: string) => {
    if (!confirm("Delete this answer?")) return;
    setDeletingId(answerId);
    try {
      await adminApi.delete(`/admin/questions/${questionId}/answers/${answerId}`);
      setAnswers(prev => prev.filter(a => a.id !== answerId));
    } catch { alert("Failed to delete answer."); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Answers ({answers.length})</p>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
          <ChevronUp size={14} /> Collapse
        </button>
      </div>
      {loading ? (
        <Loader2 size={18} className="animate-spin text-slate-400 mx-auto block" />
      ) : answers.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No answers yet.</p>
      ) : answers.map(ans => (
        <div key={ans.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex gap-3">
          {ans.author?.avatar_url ? (
            <img src={ans.author.avatar_url} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 mt-0.5">
              {ans.author?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-700">{ans.author?.name ?? "Unknown"}</span>
              <div className="flex items-center gap-2">
                {ans.isAccepted && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Accepted</span>
                )}
                <span className="text-[10px] text-slate-400">{new Date(ans.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                <button
                  onClick={() => handleDelete(ans.id)}
                  disabled={deletingId === ans.id}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors disabled:opacity-40"
                >
                  {deletingId === ans.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{ans.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main page ─── */
export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "global" | "circle">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchAll = async () => {
    try {
      const [qs, cs] = await Promise.all([
        adminApi.get<Question[]>("/admin/questions"),
        adminApi.get<any[]>("/admin/circles"),
      ]);
      setQuestions(qs);
      setCircles(cs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete question "${title}" and all its answers?`)) return;
    setDeletingId(id);
    try {
      await adminApi.delete(`/admin/questions/${id}`);
      setQuestions(prev => prev.filter(q => q.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch { alert("Failed to delete question."); }
    finally { setDeletingId(null); }
  };

  const hot = useMemo(() => questions.filter(isHotToday).sort((a, b) => b.upvotes - a.upvotes).slice(0, 8), [questions]);

  const filtered = useMemo(() => questions.filter(q => {
    const matchSearch = !search ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.author?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (q.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchScope = scopeFilter === "all" ||
      (scopeFilter === "global" && !q.circleId) ||
      (scopeFilter === "circle" && !!q.circleId);
    return matchSearch && matchScope;
  }), [questions, search, scopeFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Q&amp;A</h1>
          <p className="text-slate-500 mt-1">Manage community questions across circles and global feed.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 bg-primary-900 text-white rounded-input flex items-center gap-2 font-bold text-sm hover:bg-primary-800 shadow-sm"
        >
          <Plus size={18} /> Ask Question
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Questions", value: questions.length, color: "text-slate-950" },
          { label: "Hot Today", value: hot.length, color: "text-orange-500" },
          { label: "Global", value: questions.filter(q => !q.circleId).length, color: "text-primary-900" },
          { label: "Total Answers", value: questions.reduce((s, q) => s + (q.answerCount || 0), 0), color: "text-emerald-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Hot Today */}
      {hot.length > 0 && (
        <div className="bg-white rounded-card border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} className="text-orange-500" />
            <h3 className="font-bold text-slate-950">Hot Today</h3>
            <span className="text-xs text-slate-400 font-medium">questions with activity in the last 24h</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {hot.map(q => (
              <div
                key={q.id}
                className="shrink-0 w-64 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  {q.circleId ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                      <CircleDot size={9} /> {q.circle?.name ?? "Circle"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      <Globe size={9} /> Global
                    </span>
                  )}
                </div>
                <p className="font-bold text-slate-950 text-sm leading-tight line-clamp-2">{q.title}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {q.upvotes} upvotes · {q.answerCount} replies
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, tag or author…"
              className="flex-1 text-sm outline-none bg-transparent placeholder-slate-400 text-slate-900"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "global", "circle"] as const).map(s => (
              <button
                key={s}
                onClick={() => setScopeFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                  scopeFilter === s ? "bg-primary-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? `All (${questions.length})` : s === "global" ? `Global (${questions.filter(q => !q.circleId).length})` : `In Circles (${questions.filter(q => !!q.circleId).length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center"><Loader2 size={28} className="animate-spin text-slate-400 mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No questions found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Question</th>
                  <th className="px-6 py-4">Scope</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Upvotes</th>
                  <th className="px-6 py-4">Answers</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <React.Fragment key={q.id}>
                    <tr className={`hover:bg-slate-50/60 transition-colors border-b border-slate-100 ${expandedId === q.id ? "bg-slate-50/60" : ""}`}>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-start gap-2">
                          {isHotToday(q) && <Flame size={14} className="text-orange-400 shrink-0 mt-0.5" />}
                          <div>
                            <p className="font-semibold text-slate-950 text-sm leading-tight">{q.title}</p>
                            {(q.tags || []).length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                <Tag size={10} className="text-slate-400" />
                                {(q.tags || []).slice(0, 3).map(t => (
                                  <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {q.circleId ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full w-fit">
                            <CircleDot size={11} /> {q.circle?.name ?? "Circle"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full w-fit">
                            <Globe size={11} /> Global
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {q.author?.avatar_url ? (
                            <img src={q.author.avatar_url} className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                              {q.author?.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <span className="text-sm text-slate-700 truncate max-w-[100px]">{q.author?.name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{q.upvotes}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-primary-900 transition-colors"
                        >
                          {q.answerCount}
                          {expandedId === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(q.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(q.id, q.title)}
                          disabled={deletingId === q.id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {deletingId === q.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </td>
                    </tr>
                    {expandedId === q.id && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <AnswersPanel questionId={q.id} onClose={() => setExpandedId(null)} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            {filtered.length} question{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateDrawer
          circles={circles}
          onClose={() => setShowCreate(false)}
          onCreate={q => setQuestions(prev => [q, ...prev])}
        />
      )}
    </div>
  );
}
