import { api } from "../api";

export interface AppNotification {
  id: string;
  userId: string;
  userType: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
  updatedAt: string;
}

export const userNotificationsApi = {
  list: async (): Promise<AppNotification[]> => {
    return api.get<AppNotification[]>("/notifications");
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<{ count: number }>("/notifications/unread-count");
    return res.count ?? 0;
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all");
  },
};
