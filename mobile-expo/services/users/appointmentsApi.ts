import { api } from '../api';
import { normalizeAppointment, normalizeProfile } from '../shared/normalizers';

export const userAppointmentsApi = {
  listVets: async () => {
    const vets = await api.get<any[]>('/appointments/vets');
    return (vets || []).map(normalizeProfile).filter(Boolean);
  },
  listOwnerAppointments: async () => {
    const appointments = await api.get<any[]>('/appointments/owner');
    return (appointments || []).map(normalizeAppointment).filter(Boolean);
  },
  bookAppointment: async (payload: Record<string, unknown>) => {
    const appointment = await api.post<any>('/appointments', payload);
    return normalizeAppointment(appointment);
  },
};
