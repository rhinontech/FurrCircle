"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  Trash2,
  Search,
  X,
  Stethoscope,
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        size={13}
        className={i <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}
      />
    ))}
  </div>
);

const formatDate = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
};

export default function VetReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .get<any[]>("/admin/vet-reviews")
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return reviews;
    const q = search.toLowerCase();
    return reviews.filter(r =>
      r.user?.name?.toLowerCase().includes(q) ||
      r.vet?.name?.toLowerCase().includes(q) ||
      r.review?.toLowerCase().includes(q)
    );
  }, [reviews, search]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this review? The vet's rating will be recalculated.")) return;
    setDeletingId(id);
    try {
      await adminApi.delete(`/admin/vet-reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch {
      alert("Failed to remove review. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = [
    {
      label: "Total Reviews",
      value: reviews.length,
      icon: Star,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Avg Rating",
      value: avgRating,
      icon: Star,
      color: "bg-primary-50 text-primary-900",
    },
    {
      label: "5-Star",
      value: reviews.filter(r => r.rating === 5).length,
      icon: Star,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "1–2 Star",
      value: reviews.filter(r => r.rating <= 2).length,
      icon: Star,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Vet Reviews</h1>
        <p className="text-slate-500 mt-1">Moderate all veterinarian reviews submitted by pet owners.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-card border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
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
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="font-bold text-slate-950 whitespace-nowrap">All Reviews</h3>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search reviewer, vet, or content..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-input focus:outline-none focus:ring-2 focus:ring-primary-900/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading reviews...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Stethoscope size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No reviews found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Reviewer</th>
                  <th className="px-6 py-4">Vet / Clinic</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Review</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(review => (
                  <tr key={review.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Reviewer */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-950 text-sm">{review.user?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{review.user?.email || ""}</p>
                    </td>

                    {/* Vet */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-950 text-sm">{review.vet?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{review.vet?.hospital_name || ""}</p>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <StarRating rating={review.rating || 0} />
                      <p className="text-xs text-slate-400 mt-1">{review.rating}/5</p>
                    </td>

                    {/* Review text */}
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-slate-600 truncate max-w-48">
                        {review.review || <span className="text-slate-300 italic">No text</span>}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500">{formatDate(review.createdAt || review.date)}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-40"
                        title="Remove review"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            Showing {filtered.length} of {reviews.length} reviews
          </div>
        )}
      </div>
    </div>
  );
}
