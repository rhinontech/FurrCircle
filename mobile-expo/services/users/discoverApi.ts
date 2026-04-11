import { api } from '../api';
import { authApi } from '../auth/authApi';
import { userAppointmentsApi } from './appointmentsApi';
import { userCommunityApi } from './communityApi';
import { userPetsApi } from './petsApi';
import { normalizeProfile } from '../shared/normalizers';

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

  // Saved vets
  listSavedVets: async () => {
    const vets = await api.get<any[]>('/saved-vets');
    return (vets || []).map(normalizeProfile).filter(Boolean);
  },
  getSavedVetsCount: async (): Promise<number> => {
    const data = await api.get<{ count: number }>('/saved-vets/count');
    return data?.count ?? 0;
  },
  getSaveStatus: async (vetId: string): Promise<boolean> => {
    const data = await api.get<{ saved: boolean }>(`/saved-vets/${vetId}/status`);
    return data?.saved ?? false;
  },
  saveVet: (vetId: string) => api.post<{ saved: boolean }>(`/saved-vets/${vetId}`, {}),
  unsaveVet: (vetId: string) => api.delete<{ saved: boolean }>(`/saved-vets/${vetId}`),

  // Vet reviews
  getVetReviews: (vetId: string) => api.get<any[]>(`/vets/${vetId}/reviews`),
  submitVetReview: (vetId: string, rating: number, review?: string) =>
    api.post<any>(`/vets/${vetId}/reviews`, { rating, review }),
  deleteVetReview: (vetId: string) => api.delete<any>(`/vets/${vetId}/reviews`),
};
