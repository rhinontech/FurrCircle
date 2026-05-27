import { PublicAxios, PrivateAxios } from '../../helpers/PrivateAxios';

export type UserRole = 'owner' | 'shelter' | 'veterinarian';

export type AuthPayload = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  token?: string;
  isVerified?: boolean;
  hasCompletedOnboarding?: boolean;
  isPrivate?: boolean;
  avatar_url?: string;
  bio?: string;
  city?: string;
  address?: string;
  memberSince?: string;
  // Vet specific
  hospital_name?: string;
  profession?: string;
  experience?: string;
  working_hours?: string;
  clinicStampUrl?: string;
  licenseNumber?: string;
  rating?: number;
};

export type CheckUsernameResponse = {
  available: boolean;
  message: string;
};

// ==========================
// ONBOARDING (Signup)
// ==========================

export const checkUsername = async (username: string): Promise<CheckUsernameResponse> => {
    try {
        const response = await PublicAxios.get(`/auth/check-username?username=${username}`);
        return response.data;
    } catch (error: any) {
        console.error("checkUsername Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const register = async (payload: {
    username: string;
    name: string;
    emailOrPhone: string;
    password?: string;
    role: UserRole;
    city?: string;
    address?: string;
    hospital_name?: string;
    profession?: string;
    useBackendOtp?: boolean;
}) => {
    try {
        const response = await PublicAxios.post('/auth/register', payload);
        return response.data;
    } catch (error: any) {
        console.error("register Error:", error?.response?.data || error.message);
        throw error;
    }
};

// Admins
export const requestAdminOtp = async (data: any) => {
    try {
        const response = await PublicAxios.post('/onboarding/admin/signup/request-otp', data);
        return response.data;
    } catch (error: any) {
        console.error("requestAdminOtp Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const verifyAdminOtp = async (data: any) => {
    try {
        const response = await PublicAxios.post('/onboarding/admin/signup/verify-otp', data);
        return response.data;
    } catch (error: any) {
        console.error("verifyAdminOtp Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const verifyInvitation = async (token: string) => {
    try {
        const response = await PublicAxios.get(`/auth/verify-invitation?token=${token}`);
        return response.data;
    } catch (error: any) {
        console.error("verifyInvitation Error:", error?.response?.data || error.message);
        throw error;
    }
};

// ==========================
// OTP VERIFICATION
// ==========================

export const sendEmailOtp = async (userId: string) => {
    try {
        const response = await PublicAxios.post('/auth/send-email-otp', { userId });
        return response.data;
    } catch (error: any) {
        console.error("sendEmailOtp Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const sendPhoneOtp = async (phone: string) => {
    try {
        const response = await PublicAxios.post('/auth/send-phone-otp', { phone });
        return response.data;
    } catch (error: any) {
        console.error("sendPhoneOtp Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const verifyEmailOtp = async (userId: string, otp: string): Promise<AuthPayload> => {
    try {
        const response = await PublicAxios.post('/auth/verify-email-otp', { userId, otp });
        return response.data;
    } catch (error: any) {
        console.error("verifyEmailOtp Error:", error?.response?.data || error.message);
        throw error;
    }
};

// ==========================
// AUTHENTICATION & LOGIN
// ==========================

export const login = async (payload: { identifier: string; password?: string }) => {
    try {
        const response = await PublicAxios.post('/auth/login', payload);
        return response.data;
    } catch (error: any) {
        console.error("login Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const loginOtp = async (phone: string): Promise<AuthPayload> => {
    try {
        const response = await PublicAxios.post('/auth/login-otp', { phone });
        return response.data;
    } catch (error: any) {
        console.error("loginOtp Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const getMe = async (): Promise<AuthPayload> => {
    try {
        const response = await PrivateAxios.get('/auth/me');
        return response.data;
    } catch (error: any) {
        console.error("getMe Error:", error?.response?.data || error.message);
        throw error;
    }
};

// ==========================
// PASSWORD RECOVERY
// ==========================

export const forgotPassword = async (identifier: string, useBackendOtp?: boolean) => {
    try {
        const response = await PublicAxios.post('/auth/forgot-password', { identifier, useBackendOtp });
        return response.data;
    } catch (error: any) {
        console.error("forgotPassword Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const resetPassword = async (payload: { userId: string; otp: string; newPassword?: string }) => {
    try {
        const response = await PublicAxios.post('/auth/reset-password', payload);
        return response.data;
    } catch (error: any) {
        console.error("resetPassword Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const resetPasswordDirect = async (emailOrPhone: string, newPassword?: string) => {
    try {
        const response = await PublicAxios.post('/auth/reset-password-direct', { emailOrPhone, newPassword });
        return response.data;
    } catch (error: any) {
        console.error("resetPasswordDirect Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const authApi = {
  checkUsername,
  register,
  requestAdminOtp,
  verifyAdminOtp,
  verifyInvitation,
  sendEmailOtp,
  sendPhoneOtp,
  verifyEmailOtp,
  login,
  loginOtp,
  getMe,
  forgotPassword,
  resetPassword,
  resetPasswordDirect,
};
