/**
 * toast-store.ts
 *
 * Lightweight in-app toast/banner queue. Replaces blocking Alert popups for
 * foreground push + realtime notifications.
 *
 * The ToastHost renders only the first MAX_VISIBLE toasts as compact banners at
 * the top of the screen; the rest wait in the queue and slide in one-by-one as
 * visible ones auto-dismiss — so a burst of notifications never covers the
 * whole screen.
 */
import { create } from "zustand";

export type ToastVariant = "info" | "success" | "error" | "like" | "comment" | "match";

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant?: ToastVariant;
  avatar?: string | null;
  /** ms before auto-dismiss; defaults to 4000 */
  duration?: number;
  onPress?: () => void;
};

type ToastState = {
  toasts: ToastItem[];
  show: (toast: Omit<ToastItem, "id"> & { id?: string }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

export const TOAST_MAX_VISIBLE = 1;

// Cooldown history to deduplicate rapid duplicate notifications by title and content
const recentToasts: Record<string, number> = {};
const DUP_COOLDOWN_MS = 1500;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (toast) => {
    const id = toast.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const contentKey = `${toast.title}|${toast.message || ""}`;
    const now = Date.now();

    // Prevent duplicate consecutive toasts with identical title and body content within 1.5s
    if (recentToasts[contentKey] && now - recentToasts[contentKey] < DUP_COOLDOWN_MS) {
      return id;
    }

    // Record the timestamp of this toast content
    recentToasts[contentKey] = now;

    // Prune stale items from recentToasts to avoid memory footprint growth
    for (const key in recentToasts) {
      if (now - recentToasts[key] > DUP_COOLDOWN_MS) {
        delete recentToasts[key];
      }
    }

    set((state) => {
      // Avoid duplicate consecutive toasts by ID
      if (state.toasts.some((t) => t.id === id)) return state;
      // Replace the active toast list with only the newest toast to avoid stacking or queuing.
      return { toasts: [{ duration: 4000, variant: "info", ...toast, id }] };
    });
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Convenience helper for non-React call sites. */
export const toast = {
  show: (t: Omit<ToastItem, "id"> & { id?: string }) => useToastStore.getState().show(t),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
