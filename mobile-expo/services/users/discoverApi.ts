import { authApi } from '../auth/authApi';
import { userAppointmentsApi } from './appointmentsApi';
import { userCommunityApi } from './communityApi';
import { userPetsApi } from './petsApi';

export const userDiscoverApi = {
  getDiscoverData: async () => {
    const [vets, shelters, pets] = await Promise.all([
      userAppointmentsApi.listVets(),
      authApi.listShelters(),
      userPetsApi.listDiscoverPets(),
    ]);

    return {
      vets: vets || [],
      shelters: shelters || [],
      pets: pets || [],
    };
  },
  getVetById: async (id: string) => {
    const vets = await userAppointmentsApi.listVets();
    return (vets || []).find((item) => String(item.id) === String(id)) || null;
  },
  startPetInterestChat: (payload: Record<string, unknown>) => userCommunityApi.startChat(payload),
};
