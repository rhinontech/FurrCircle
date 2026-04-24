import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuthToken, setAuthToken, onUnauthorized } from "@/services/api";
import { authApi } from "@/services/auth/authApi";

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
  address?: string;
  working_hours?: string;
  clinicStampUrl?: string;
  licenseNumber?: string;
  hasCompletedOnboarding?: boolean;
}

type AuthPayload = User & {
  avatar_url?: string;
  // Vet-specific API field names (backend uses these, we map → User fields)
  hospital_name?: string;
  profession?: string;
  experience?: string | number;
  working_hours?: string;
};

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean | null;
  login: (email: string, password: string, selectedRole?: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, extra?: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
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
  refreshUser: async () => {},
  completeOnboarding: async () => {},
  isLoading: true,
  switchUser: async () => {},
});

const toAuthPayload = (data: Partial<User>): AuthPayload => ({
  id: data.id || '',
  name: data.name || '',
  email: data.email || '',
  role: data.role || 'owner',
  token: data.token,
  isVerified: data.isVerified,
  hasCompletedOnboarding: data.hasCompletedOnboarding,
  clinic_name: data.clinic_name,
  specialty: data.specialty,
  bio: data.bio,
  city: data.city,
  phone: data.phone,
  address: data.address,
  working_hours: data.working_hours,
  memberSince: data.memberSince,
  petCount: data.petCount,
  rating: data.rating,
  yearsExp: data.yearsExp,
  avatar: data.avatar,
  avatar_url: data.avatar,
  hospital_name: data.clinic_name,
  profession: data.specialty,
  experience: data.yearsExp,
});

const toUser = (data: AuthPayload): User => ({
  id: data.id,
  name: data.name,
  email: data.email,
  role: data.role,
  token: data.token,
  isVerified: data.isVerified,
  hasCompletedOnboarding: data.hasCompletedOnboarding,
  // Vet profile: backend sends hospital_name / profession / experience;
  // User profile: backend sends clinic_name / specialty / yearsExp.
  // Map both so the UI always reads from the same User fields.
  clinic_name: data.hospital_name ?? data.clinic_name,
  specialty: data.profession ?? data.specialty,
  yearsExp: data.experience ?? data.yearsExp,
  bio: data.bio,
  city: data.city,
  phone: data.phone,
  address: data.address,
  working_hours: data.working_hours,
  clinicStampUrl: (data as any).clinicStampUrl,
  licenseNumber: (data as any).licenseNumber,
  memberSince: data.memberSince,
  petCount: data.petCount,
  rating: data.rating,
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

        const storedToken = await AsyncStorage.getItem('user_token');
        const savedUser = await AsyncStorage.getItem('user_data');

        if (storedToken?.startsWith('mock-token:')) {
          clearAuthToken();
          await AsyncStorage.removeItem('user_data');
          await AsyncStorage.removeItem('user_token');
          setUser(null);
          return;
        }

        if (savedUser && storedToken) {
          const parsedUser = JSON.parse(savedUser) as User;
          // Seed in-memory token cache IMMEDIATELY (needed for getMe call)
          setAuthToken(storedToken);
          
          // Validate token before setting user
          try {
            const freshProfile = await authApi.getMe() as AuthPayload;
            const updatedUser = toUser({ ...parsedUser, ...freshProfile });
            
            // Only set user if validation succeeds AND we haven't been logged out since
            setUser(prev => {
              // If some other process already set a user or cleared it, respect that
              // But during loadState, prev is likely null.
              return updatedUser;
            });
            await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
            if (updatedUser.hasCompletedOnboarding && completed !== 'true') {
              await AsyncStorage.setItem('onboarding_completed', 'true');
              setHasCompletedOnboarding(true);
            }
          } catch (error: any) {
            const message = String(error?.message || '').toLowerCase();
            if (message.includes('not authorized') || message.includes('token failed') || message.includes('jwt')) {
              await logout();
            } else {
              setUser(prev => prev || parsedUser);
            }
          }
        } else {
          // If state is inconsistent, ensure we are logged out
          clearAuthToken();
          setUser(null);
        }
      } catch (e) {
        console.error("Auth initialization error", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  // Global unauthorized listener
  useEffect(() => {
    return onUnauthorized(() => {
      logout();
    });
  }, []);

  const login = async (email: string, password: string, selectedRole?: UserRole) => {
    const data = await authApi.login(email, password) as AuthPayload;
    // Validate that the returned account role matches the selected toggle
    if (selectedRole) {
      const returnedRole = data.role;
      const isVetAccount = returnedRole === 'veterinarian' || (data as any).userType === 'vet';
      const selectedIsVet = selectedRole === 'veterinarian';
      if (selectedIsVet && !isVetAccount) {
        throw new Error("No veterinarian account found with these credentials.");
      }
      if (!selectedIsVet && isVetAccount) {
        throw new Error(`No ${selectedRole} account found with these credentials.`);
      }
      if (!selectedIsVet && !isVetAccount && returnedRole !== selectedRole && returnedRole !== 'admin') {
        throw new Error(`No ${selectedRole} account found with these credentials.`);
      }
    }
    const userData = toUser(data);

    // Set in-memory token FIRST — navigation may fire before AsyncStorage awaits complete
    if (userData.token) setAuthToken(userData.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    if (userData.token) await AsyncStorage.setItem('user_token', userData.token);
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string, role: UserRole, extra?: Record<string, string>) => {
    const data = await authApi.register(name, email, password, role, extra) as AuthPayload;
    const userData = toUser({
      ...data,
      isVerified: data.isVerified || (data.role === 'veterinarian' ? false : true),
    });

    if (userData.token) setAuthToken(userData.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    if (userData.token) await AsyncStorage.setItem('user_token', userData.token);
    setUser(userData);
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    const payload = {
      ...updatedData,
      avatar_url: updatedData.avatar,
      hospital_name: updatedData.clinic_name,
      profession: updatedData.specialty,
      experience: updatedData.yearsExp,
    };

    delete (payload as Partial<User>).avatar;
    delete (payload as Partial<User>).clinic_name;
    delete (payload as Partial<User>).specialty;
    delete (payload as Partial<User>).yearsExp;

    const data = await authApi.updateProfile(payload) as AuthPayload;
    if (user) {
      const newUser = toUser({
        ...toAuthPayload(user),
        ...data,
      });
      if (newUser.token) {
        setAuthToken(newUser.token);
        await AsyncStorage.setItem('user_token', newUser.token);
      }
      setUser(newUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const freshProfile = await authApi.getMe() as AuthPayload;
      setUser(prev => {
        if (!prev) return null;
        const updatedUser = toUser({ ...toAuthPayload(prev), ...freshProfile });
        AsyncStorage.setItem('user_data', JSON.stringify(updatedUser)).catch(() => {});
        return updatedUser;
      });
    } catch (error) {
      // Silently fail — stale data is acceptable if the network is unavailable
    }
  };

  const logout = async () => {
    try {
      clearAuthToken();
      setUser(null);
      await Promise.all([
        AsyncStorage.removeItem('user_data'),
        AsyncStorage.removeItem('user_token'),
      ]);
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem('onboarding_completed', 'true');
    if (user && !user.hasCompletedOnboarding) {
      try {
        const data = await authApi.completeOnboarding() as AuthPayload;
        setUser(prev => {
          if (!prev) return null;
          const updatedUser = toUser({ ...toAuthPayload(prev), ...data });
          AsyncStorage.setItem('user_data', JSON.stringify(updatedUser)).catch(() => {});
          return updatedUser;
        });
      } catch {
        // local onboarding state still wins if the network is unavailable
      }
    }
  };

  const switchUser = async (userData: User) => {
    if (userData.token) setAuthToken(userData.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    if (userData.token) await AsyncStorage.setItem('user_token', userData.token);
    setUser(userData);
  };

  useEffect(() => {
    if (!user) return;

    if (user.hasCompletedOnboarding && hasCompletedOnboarding !== true) {
      setHasCompletedOnboarding(true);
      AsyncStorage.setItem('onboarding_completed', 'true').catch(() => {});
      return;
    }

    if (hasCompletedOnboarding && !user.hasCompletedOnboarding) {
      authApi.completeOnboarding()
        .then((data) => {
          setUser(prev => {
            if (!prev) return null;
            const updatedUser = toUser({ ...toAuthPayload(prev), ...(data as AuthPayload) });
            AsyncStorage.setItem('user_data', JSON.stringify(updatedUser)).catch(() => {});
            return updatedUser;
          });
        })
        .catch(() => {});
    }
  }, [user?.id, user?.hasCompletedOnboarding, hasCompletedOnboarding]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      hasCompletedOnboarding,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
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
