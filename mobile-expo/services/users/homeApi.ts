import { userAppointmentsApi } from './appointmentsApi';
import { userCommunityApi } from './communityApi';
import { userPetsApi } from './petsApi';
import { userRemindersApi } from './remindersApi';

export const userHomeApi = {
  getHomeData: async () => {
    const [pets, reminders, vets, spotlightPost] = await Promise.all([
      userPetsApi.listPets(),
      userRemindersApi.listReminders(),
      userAppointmentsApi.listVets(),
      userCommunityApi.getSpotlight().catch(() => null),
    ]);

    return {
      pets: pets || [],
      reminders: reminders || [],
      vets: vets || [],
      latestPost: spotlightPost ?? null,
    };
  },
};
