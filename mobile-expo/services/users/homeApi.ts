import { userAppointmentsApi } from './appointmentsApi';
import { userCommunityApi } from './communityApi';
import { userPetsApi } from './petsApi';
import { userRemindersApi } from './remindersApi';

export const userHomeApi = {
  getHomeData: async () => {
    const [pets, reminders, vets, feed] = await Promise.all([
      userPetsApi.listPets(),
      userRemindersApi.listReminders(),
      userAppointmentsApi.listVets(),
      userCommunityApi.listFeed(),
    ]);


    return {
      pets: pets || [],
      reminders: reminders || [],
      vets: vets || [],
      latestPost: feed && feed.length > 0 ? feed[0] : null,
    };
  },
};
