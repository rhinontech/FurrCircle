import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SEED_USERS, SeedUser, findUserByEmail } from "./seed-data";

const AUTH_KEY = "furr:auth";

type AuthState = {
  user: SeedUser | null;
  loading: boolean;
  // hydrate from storage on app start
  hydrate: () => Promise<void>;
  // returns error message or null on success
  login: (email: string, password: string) => Promise<string | null>;
  // returns error message or null on success
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SeedUser;
        // re-hydrate from seed so data is always fresh
        const fresh = SEED_USERS.find((u) => u.id === saved.id) ?? saved;
        set({ user: fresh, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const found = findUserByEmail(email);
    if (!found) return "No account found with that email.";
    if (found.password !== password) return "Incorrect password.";
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(found));
    set({ user: found });
    return null;
  },

  signup: async (name, email, password) => {
    if (!name.trim()) return "Please enter your name.";
    if (!email.includes("@")) return "Enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    // check duplicate
    if (findUserByEmail(email)) return "An account with this email already exists.";

    const newUser: SeedUser = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      handle: name.trim().toLowerCase().replace(/\s+/g, "_") + "_furr",
      email: email.toLowerCase(),
      password,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
      bio: "New to FurrCircle 🐾",
      location: "",
      followers: 0,
      following: 0,
      pets: [],
    };

    // push into runtime seed so they can log back in this session
    SEED_USERS.push(newUser);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    set({ user: newUser });
    return null;
  },

  logout: async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    set({ user: null });
  },
}));
