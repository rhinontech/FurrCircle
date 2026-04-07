import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from "../services/api";

export type UserRole = "owner" | "veterinarian" | "admin" | "shelter";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  token?: string;
  isVerified?: boolean;
  petCount?: number;
  memberSince?: string;
  rating?: number | string;
  yearsExp?: number | string;
  clinic_name?: string;
  specialty?: string;
  bio?: string;
  city?: string;
  phone?: string;
}

type AuthPayload = User & {
  avatar_url?: string;
};

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  isLoading: boolean;
  switchUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  hasCompletedOnboarding: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  completeOnboarding: async () => {},
  isLoading: true,
  switchUser: async () => {},
});

const toUser = (data: AuthPayload): User => ({
  id: data.id,
  name: data.name,
  email: data.email,
  role: data.role,
  token: data.token,
  isVerified: data.isVerified,
  clinic_name: data.clinic_name,
  specialty: data.specialty,
  bio: data.bio,
  city: data.city,
  phone: data.phone,
  memberSince: data.memberSince,
  petCount: data.petCount,
  rating: data.rating,
  yearsExp: data.yearsExp,
  avatar: data.avatar_url ?? data.avatar,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding_completed');
        setHasCompletedOnboarding(completed === 'true');

        const savedUser = await AsyncStorage.getItem('user_data');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser) as User;
          setUser(parsedUser);
          // Optionally fetch fresh profile data
          try {
            const freshProfile = await api.get('/auth/me') as AuthPayload;
            const updatedUser = toUser({ ...parsedUser, ...freshProfile });
            setUser(updatedUser);
            await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
          } catch (err) {
            const fallbackProfile = await api.post('/auth/login', {
              email: parsedUser?.email || 'alex@pawshub.app',
              password: 'mock-password',
            }) as AuthPayload;
            const fallbackUser = toUser(fallbackProfile);
            setUser(fallbackUser);
            await AsyncStorage.setItem('user_data', JSON.stringify(fallbackUser));
            if (fallbackUser.token) {
              await AsyncStorage.setItem('user_token', fallbackUser.token);
            }
          }
        }
      } catch (e) {
        console.error("Auth initialization error", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post('/auth/login', { email, password }) as AuthPayload;
    const userData = toUser(data);

    setUser(userData);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    if (userData.token) {
      await AsyncStorage.setItem('user_token', userData.token);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const data = await api.post('/auth/register', { name, email, password, role }) as AuthPayload;
    const userData = toUser({
      ...data,
      isVerified: data.isVerified || (data.role === 'veterinarian' ? false : true),
    });

    setUser(userData);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    if (userData.token) {
      await AsyncStorage.setItem('user_token', userData.token);
    }
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    const data = await api.put('/auth/profile', updatedData) as Partial<AuthPayload>;
    if (user) {
      const newUser: User = {
        ...user,
        ...data,
        avatar: data.avatar_url ?? data.avatar ?? user.avatar,
      };
      setUser(newUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user_data');
    await AsyncStorage.removeItem('user_token');
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem('onboarding_completed', 'true');
  };

  const switchUser = async (userData: User) => {
    setUser(userData);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    if (userData.token) {
      await AsyncStorage.setItem('user_token', userData.token);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoggedIn: !!user, 
      hasCompletedOnboarding, 
      login, 
      register,
      logout,
      updateProfile,
      completeOnboarding,
      isLoading,
      switchUser
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
