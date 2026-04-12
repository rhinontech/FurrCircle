import { api } from "../api";
import { normalizeAppointment } from "./normalizers";

export const feedbackApi = {
  getPending: async () => {
    const data = await api.get<{ appointment?: any | null }>("/appointments/feedback/pending");
    return normalizeAppointment(data?.appointment);
  },
  submit: async (appointmentId: string, payload: { rating: number; tags?: string[]; comment?: string }) => {
    const data = await api.post<{ appointment?: any }>(`/appointments/${appointmentId}/feedback`, payload);
    return normalizeAppointment(data?.appointment);
  },
};
