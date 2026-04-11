import { api } from '../api';
import { normalizeReminder } from '../shared/normalizers';

export const userRemindersApi = {
  listReminders: async () => {
    const reminders = await api.get<any[]>('/reminders');
    return (reminders || []).map(normalizeReminder).filter(Boolean);
  },
  toggleReminder: (id: string) => api.patch<any>(`/reminders/${id}/toggle`),
};
