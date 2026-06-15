/**
 * post-engagement-store.ts
 *
 * Holds realtime engagement counts (likes / comments / shares) pushed from the
 * server via the "post:update" socket event. Updated centrally in _layout (which
 * owns the socket lifecycle); any post card / detail screen reads the override
 * for its postId and prefers it over the counts from the initial fetch.
 */
import { create } from "zustand";

export type PostCounts = { likeCount: number; commentCount: number; shareCount: number };

type State = {
  counts: Record<string, PostCounts>;
  setCounts: (postId: string, counts: PostCounts) => void;
  /** Optimistically nudge a count so the user's own action doesn't flicker. */
  bumpLike: (postId: string, delta: number) => void;
};

export const usePostEngagementStore = create<State>((set) => ({
  counts: {},
  setCounts: (postId, counts) =>
    set((s) => ({ counts: { ...s.counts, [postId]: counts } })),
  bumpLike: (postId, delta) =>
    set((s) => {
      const existing = s.counts[postId];
      if (!existing) return s; // nothing to nudge until the server has reported
      return {
        counts: {
          ...s.counts,
          [postId]: { ...existing, likeCount: Math.max(0, existing.likeCount + delta) },
        },
      };
    }),
}));
