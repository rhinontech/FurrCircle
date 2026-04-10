import { api } from '../api';
import { normalizeProfile } from '../shared/normalizers';

export type AuthApiRole = 'owner' | 'veterinarian' | 'admin' | 'shelter';

export type AuthApiPayload = {
  id: string;
  name: string;
  email: string;
  role: AuthApiRole;
  token?: string;
  isVerified?: boolean;
  clinic_name?: string;
  specialty?: string;
  bio?: string;
  city?: string;
  phone?: string;
  memberSince?: string;
  petCount?: number;
  rating?: number | string;
  yearsExp?: number | string;
  avatar?: string;
  avatar_url?: string;
  hospital_name?: string;
  profession?: string;
  experience?: string | number;
};

export const authApi = {
  getMe: () => api.get<AuthApiPayload>('/auth/me'),
  login: (email: string, password: string) => api.post<AuthApiPayload>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, role: AuthApiRole) =>
    api.post<AuthApiPayload>('/auth/register', { name, email, password, role }),
  updateProfile: (updatedData: Record<string, unknown>) =>
    api.put<Partial<AuthApiPayload>>('/auth/profile', updatedData),
  listShelters: async () => {
    const shelters = await api.get<any[]>('/auth/users/shelter');
    return (shelters || []).map(normalizeProfile).filter(Boolean);
  },
};
