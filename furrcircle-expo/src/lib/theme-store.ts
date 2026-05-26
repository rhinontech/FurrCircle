import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeStore = {
  dark: boolean;
  setDark: (v: boolean) => void;
  load: () => void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  dark: false,
  setDark: async (v) => {
    set({ dark: v });
    await AsyncStorage.setItem("furr.theme", v ? "dark" : "light");
  },
  load: async () => {
    const saved = await AsyncStorage.getItem("furr.theme");
    set({ dark: saved === "dark" });
  },
}));

// Light and dark token sets
export const lightTokens = {
  bg: "#F7F8FA",
  card: "#FFFFFF",
  text: "#1A1A2E",
  textMuted: "#1A1A2E99",
  border: "#E5E7EB",
  inputBg: "#FFFFFF",
};

export const darkTokens = {
  bg: "#0F0F1A",
  card: "#1C1C2E",
  text: "#F0F0FF",
  textMuted: "#F0F0FF99",
  border: "#2A2A40",
  inputBg: "#1C1C2E",
};

export function useTokens() {
  const dark = useThemeStore((s) => s.dark);
  return dark ? darkTokens : lightTokens;
}
