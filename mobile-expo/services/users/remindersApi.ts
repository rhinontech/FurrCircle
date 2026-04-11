import { api } from '../api';
import { normalizeReminder } from '../shared/normalizers';

export const userRemindersApi = {
  listReminders: async () => {
    const reminders = await api.get<any[]>('/reminders');
    return (reminders || []).map(normalizeReminder).filter(Boolean);
  },
  toggleReminder: (id: string) => api.patch<any>(`/reminders/${id}/toggle`),
  createReminder: async (payload: Record<string, unknown>) => {
    const reminder = await api.post<any>('/reminders', payload);
    return normalizeReminder(reminder);
  },
  updateReminder: async (id: string, payload: Record<string, unknown>) => {
    const reminder = await api.put<any>(`/reminders/${id}`, payload);
    return normalizeReminder(reminder);
  },
  deleteReminder: (id: string) => api.delete<any>(`/reminders/${id}`),
};
