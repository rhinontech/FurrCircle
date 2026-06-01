/**
 * notification-store.ts
 *
 * Zustand store for real-time notification state.
 *
 * This is the single source of truth for:
 *  - The unread badge count shown on the bell icon / tab bar
 *  - Notifications received via WebSocket (prepended to the notifications list)
 *
 * Lifecycle:
 *  1. On app start / notifications screen focus → REST call populates initial counts
 *  2. WebSocket `notification:counts` events → `setUnreadCounts` keeps badge fresh
 *  3. WebSocket `notification:new` events → `prependNotification` prepends to list
 *  4. "Mark all read" action → `clearUnread` resets counts to zero
 */

import { create } from "zustand";
import type { AppNotification, UnreadCounts } from "../../services/notification/notificationApi";

type NotificationState = {
  /** Total unread count (activity + campaign) — drives the bell badge */
  unreadCount: number;
  activityCount: number;
  campaignCount: number;

  /**
   * Notifications received in real-time via WebSocket.
   * These are prepended to the REST-fetched list in the notifications screen.
   */
  realtimeNotifs: AppNotification[];

  // ── Setters ────────────────────────────────────────────────────────────────

  /** Called when `notification:counts` WebSocket event arrives */
  setUnreadCounts: (counts: UnreadCounts) => void;

  /** Called when `notification:new` WebSocket event arrives */
  prependNotification: (notif: AppNotification) => void;

  /**
   * Called after "Mark all read" to zero out the badge.
   * The REST call already marks them read server-side; this just clears the UI.
   */
  clearUnread: () => void;

  /**
   * Called when the notifications screen mounts / REST fetch completes,
   * so realtime notifs that were already fetched via REST aren't shown twice.
   */
  resetRealtimeNotifs: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  activityCount: 0,
  campaignCount: 0,
  realtimeNotifs: [],

  setUnreadCounts: ({ activity, campaign, total }) => {
    set({
      activityCount: activity,
      campaignCount: campaign,
      unreadCount: total,
    });
  },

  prependNotification: (notif) => {
    // Deduplicate: don't add if we already have this id
    const existing = get().realtimeNotifs;
    if (existing.some((n) => n.id === notif.id)) return;
    set({
      realtimeNotifs: [notif, ...existing],
    });
  },

  clearUnread: () => {
    set({ unreadCount: 0, activityCount: 0, campaignCount: 0 });
  },

  resetRealtimeNotifs: () => {
    set({ realtimeNotifs: [] });
  },
}));
