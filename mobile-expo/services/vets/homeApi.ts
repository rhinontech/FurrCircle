import { vetAppointmentsApi } from './appointmentsApi';

export const vetHomeApi = {
  getHomeData: async () => {
    const [stats, appointments] = await Promise.all([
      vetAppointmentsApi.getStats(),
      vetAppointmentsApi.listAppointments(),
    ]);

    return {
      stats,
      appointments,
    };
  },
};
