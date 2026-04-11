import { userAppointmentsApi } from './appointmentsApi';
import { userPetsApi } from './petsApi';
import { userRemindersApi } from './remindersApi';

export const userHomeApi = {
  getHomeData: async () => {
    const [pets, reminders, vets] = await Promise.all([
      userPetsApi.listPets(),
      userRemindersApi.listReminders(),
      userAppointmentsApi.listVets(),
    ]);

    return {
      pets: pets || [],
      reminders: reminders || [],
      vets: vets || [],
    };
  },
};
