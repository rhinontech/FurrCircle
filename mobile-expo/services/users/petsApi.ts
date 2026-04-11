import { api } from '../api';
import { normalizePet } from '../shared/normalizers';

export const userPetsApi = {
  listPets: async () => {
    const pets = await api.get<any[]>('/pets');
    return (pets || []).map(normalizePet).filter(Boolean);
  },
  listDiscoverPets: async () => {
    const pets = await api.get<any[]>('/pets/discover');
    return (pets || []).map(normalizePet).filter(Boolean);
  },
  getPetById: async (id: string) => normalizePet(await api.get<any>(`/pets/${id}`)),
  createPet: async (payload: Record<string, unknown>) => normalizePet(await api.post<any>('/pets', payload)),
  updatePet: async (id: string, payload: Record<string, unknown>) => normalizePet(await api.put<any>(`/pets/${id}`, payload)),
  deletePet: (id: string) => api.delete<{ success: boolean }>(`/pets/${id}`),
  updateListing: async (id: string, payload: Record<string, unknown>) => normalizePet(await api.patch<any>(`/pets/${id}/listing`, payload)),
};
