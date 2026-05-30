import { PrivateAxios } from '../../helpers/PrivateAxios';

export type NotificationCategory = 'activity' | 'campaign';

export interface AppNotification {
  id: string;
  userId: string;
  userType: string;
  type: string;          // like | comment | follow | follow_request | reminder | appointment | general ...
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  actionType?: string;
  actionPayload?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCounts {
  activity: number;
  campaign: number;
  total: number;
}

export const listNotifications = async (
  category?: NotificationCategory,
  cursor?: string,
  limit = 50
): Promise<AppNotification[]> => {
  const params: Record<string, any> = { limit };
  if (category) params.category = category;
  if (cursor) params.cursor = cursor;
  const res = await PrivateAxios.get('/notifications', { params });
  return res.data;
};

export const getUnreadCounts = async (): Promise<UnreadCounts> => {
  const res = await PrivateAxios.get('/notifications/unread-counts');
  return res.data;
};

export const markRead = async (id: string): Promise<void> => {
  await PrivateAxios.patch(`/notifications/${id}/read`);
};

export const markAllRead = async (category?: NotificationCategory): Promise<void> => {
  const params: Record<string, any> = {};
  if (category) params.category = category;
  await PrivateAxios.patch('/notifications/read-all', {}, { params });
};

export const registerDevice = async (payload: {
  installationId: string;
  expoPushToken: string | null;
  platform: 'ios' | 'android';
  pushEnabled: boolean;
}): Promise<void> => {
  await PrivateAxios.post('/notifications/devices/register', payload);
};

export const deleteDevice = async (installationId: string): Promise<void> => {
  await PrivateAxios.delete(`/notifications/devices/${installationId}`);
};

export const notificationApi = {
  listNotifications,
  getUnreadCounts,
  markRead,
  markAllRead,
  registerDevice,
  deleteDevice,
};
