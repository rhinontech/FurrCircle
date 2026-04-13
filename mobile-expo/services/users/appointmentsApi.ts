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
  cancelAppointment: async (appointmentId: string) => {
    const appointment = await api.patch<any>(`/appointments/${appointmentId}/status`, { status: 'cancelled' });
    return normalizeAppointment(appointment);
  },
  respondReschedule: async (appointmentId: string, payload: { action: "accept" | "counter" | "cancel"; date?: string; time?: string; reason?: string }) => {
    const appointment = await api.patch<any>(`/appointments/${appointmentId}/reschedule/respond`, payload);
    return normalizeAppointment(appointment);
  },
};
