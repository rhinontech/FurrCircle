import { api } from "../api";

export type NotificationCategory = "activity" | "campaign";

export type NotificationCounts = {
  activity: number;
  campaign: number;
  total: number;
};

export interface AppNotification {
  id: string;
  userId: string;
  userType: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  actionType?: string | null;
  actionPayload?: Record<string, unknown> | null;
  campaignId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationPreferences = {
  marketingEnabled: boolean;
};

export const userNotificationsApi = {
  list: async (category?: NotificationCategory): Promise<AppNotification[]> => {
    const query = category ? `?category=${category}` : "";
    return api.get<AppNotification[]>(`/notifications${query}`);
  },

  getUnreadCounts: async (): Promise<NotificationCounts> => {
    return api.get<NotificationCounts>("/notifications/unread-counts");
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (category?: NotificationCategory): Promise<void> => {
    const query = category ? `?category=${category}` : "";
    await api.patch(`/notifications/read-all${query}`);
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    return api.get<NotificationPreferences>("/notifications/preferences");
  },

  updatePreferences: async (payload: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    return api.patch<NotificationPreferences>("/notifications/preferences", payload);
  },

  registerDevice: async (payload: {
    installationId: string;
    expoPushToken?: string | null;
    platform: "ios" | "android";
    pushEnabled: boolean;
  }) => {
    return api.post("/notifications/devices/register", payload);
  },

  deleteDevice: async (installationId: string) => {
    return api.delete(`/notifications/devices/${installationId}`);
  },
};
