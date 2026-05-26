import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { authApi, type AuthPayload } from "../../services/auth/authApi";

const AUTH_KEY = "furr:auth";

type AuthState = {
  user: AuthPayload | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  login: (identifier: string, password?: string) => Promise<string | null>;
  logout: () => Promise<void>;
  setSession: (payload: AuthPayload) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  hydrate: async () => {
    try {
      const [rawUser, token] = await Promise.all([
        AsyncStorage.getItem(AUTH_KEY),
        SecureStore.getItemAsync('token'),
      ]);
      
      if (rawUser && token) {
        const saved = JSON.parse(rawUser) as AuthPayload;
        set({ user: saved, loading: false });
        
        try {
          const fresh = await authApi.getMe();
          await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(fresh));
          set({ user: fresh });
        } catch (err) {
          console.error("Hydration profile refresh failed:", err);
        }
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  login: async (identifier, password) => {
    try {
      const data = await authApi.login({ identifier, password });
      
      if (data && !data.isVerified) {
        return `unverified:${data.userId}:${data.emailOrPhone}`;
      }
      
      if (data && data.token) {
        await Promise.all([
          AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data)),
          SecureStore.setItemAsync('token', data.token),
        ]);
        set({ user: data });
        return null;
      }
      return "Login failed: No token returned from server";
    } catch (err: any) {
      return err.message || "Invalid credentials";
    }
  },

  setSession: async (payload: AuthPayload) => {
    if (payload.token) {
      await Promise.all([
        AsyncStorage.setItem(AUTH_KEY, JSON.stringify(payload)),
        SecureStore.setItemAsync('token', payload.token),
      ]);
      set({ user: payload });
    }
  },

  logout: async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_KEY),
      SecureStore.deleteItemAsync('token'),
    ]);
    set({ user: null });
  },
}));
