import { api } from '../api';
import { normalizeAppointment } from '../shared/normalizers';

const sortByDateTime = (a: any, b: any) => `${a.date || a.appointment_date || ''} ${a.time || a.appointment_time || ''}`.localeCompare(`${b.date || b.appointment_date || ''} ${b.time || b.appointment_time || ''}`);

export const vetAppointmentsApi = {
  listAppointments: async () => {
    const appointments = await api.get<any[]>('/appointments/vet');
    return (appointments || []).map(normalizeAppointment).filter(Boolean).slice().sort(sortByDateTime);
  },
  updateStatus: (id: string, status: string, notes?: string) => api.patch<any>(`/appointments/${id}/status`, { status, notes }),
  requestReschedule: async (id: string, payload: { date: string; time: string; reason?: string }) => {
    const appointment = await api.patch<any>(`/appointments/${id}/reschedule`, payload);
    return normalizeAppointment(appointment);
  },
  respondReschedule: async (id: string, payload: { action: "accept" | "counter" | "cancel"; date?: string; time?: string; reason?: string }) => {
    const appointment = await api.patch<any>(`/appointments/${id}/reschedule/respond`, payload);
    return normalizeAppointment(appointment);
  },
  getStats: () => api.get<any>('/appointments/vet/stats'),
  listPatients: async () => {
    const appointments = await vetAppointmentsApi.listAppointments();
    const petsMap = new Map<string, any>();

    for (const appointment of appointments || []) {
      if (!appointment.pet) {
        continue;
      }

      const existing = petsMap.get(appointment.pet.id);
      if (existing) {
        existing.visits += 1;
        if (appointment.status === 'completed' && (!existing.lastVisit || appointment.date > existing.lastVisit)) {
          existing.lastVisit = appointment.date;
        }
        if ((appointment.status === 'confirmed' || appointment.status === 'pending') && (!existing.nextVisit || appointment.date < existing.nextVisit)) {
          existing.nextVisit = appointment.date;
        }
        continue;
      }

      petsMap.set(appointment.pet.id, {
        ...appointment.pet,
        owner: appointment.owner,
        visits: 1,
        lastVisit: appointment.status === 'completed' ? appointment.date : null,
        nextVisit: appointment.status === 'confirmed' || appointment.status === 'pending' ? appointment.date : null,
      });
    }

    return Array.from(petsMap.values());
  },
};
