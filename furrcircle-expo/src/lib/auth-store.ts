import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { Platform } from "react-native";
import { authApi, type AuthPayload } from "../../services/auth/authApi";

const secureGet = (key: string) =>
  Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync(key);
const secureSet = (key: string, value: string) =>
  Platform.OS === 'web' ? Promise.resolve() : SecureStore.setItemAsync(key, value);
const secureDel = (key: string) =>
  Platform.OS === 'web' ? Promise.resolve() : SecureStore.deleteItemAsync(key);

const AUTH_KEY = "furr:auth";

type AuthState = {
  user: AuthPayload | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  login: (identifier: string, password?: string) => Promise<string | null>;
  logout: () => Promise<void>;
  setSession: (payload: AuthPayload) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  hydrate: async () => {
    try {
      const [rawUser, secureToken] = await Promise.all([
        AsyncStorage.getItem(AUTH_KEY),
        secureGet('token'),
      ]);

      const saved = rawUser ? JSON.parse(rawUser) as AuthPayload : null;
      const token = secureToken || saved?.token || null;

      if (saved && token) {
        set({ user: saved, loading: false });
        
        try {
          const fresh = await authApi.getMe();
          const freshWithToken = { ...fresh, token };
          await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(freshWithToken));
          set({ user: freshWithToken });
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
          secureSet('token', data.token),
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
    const currentToken = payload.token || get().user?.token;
    const userToSave = { ...payload, token: currentToken };

    if (currentToken) {
      await secureSet('token', currentToken);
    }

    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userToSave));
    set({ user: userToSave });
  },

  logout: async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_KEY),
      secureDel('token'),
    ]);
    set({ user: null });
  },
}));
