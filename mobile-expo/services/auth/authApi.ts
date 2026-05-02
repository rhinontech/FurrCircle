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
  hasCompletedOnboarding?: boolean;
  clinic_name?: string;
  specialty?: string;
  bio?: string;
  city?: string;
  phone?: string;
  address?: string;
  working_hours?: string;
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
  loginOtp: (phone: string) => api.post<AuthApiPayload>('/auth/login-otp', { phone }),
  register: (name: string, email: string, password: string, role: AuthApiRole, extra?: Record<string, string>) =>
    api.post<AuthApiPayload>('/auth/register', { name, email, password, role, ...extra }),
  updateProfile: (updatedData: Record<string, unknown>) =>
    api.put<AuthApiPayload>('/auth/profile', updatedData),
  completeOnboarding: () =>
    api.post<AuthApiPayload>('/auth/onboarding-complete'),
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, newPassword }),
  resetPasswordDirect: (email: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password-direct', { email, newPassword }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),
  deleteAccount: (reason?: string) =>
    api.delete<{ message: string }>('/auth/delete-account'),
  listShelters: async () => {
    const shelters = await api.get<any[]>('/auth/users/shelter');
    return (shelters || []).map(normalizeProfile).filter(Boolean);
  },
};
