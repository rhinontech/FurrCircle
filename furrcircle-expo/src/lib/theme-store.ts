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
  bg: "#EFF6FF",
  card: "#FFFFFF",
  text: "#1A1A2E",
  textMuted: "#1A1A2E99",
  border: "#E5E7EB",
  inputBg: "#FFFFFF",
  // Glassmorphism surfaces
  glass: "rgba(255,255,255,0.62)",
  glassStrong: "rgba(255,255,255,0.90)",
  glassChip: "rgba(255,255,255,0.55)",
  glassBorder: "rgba(255,255,255,0.75)",
  glassHighlight: "rgba(255,255,255,0.95)",
  blurOverlay: "rgba(255,255,255,0.42)",
  // Navigation Bar
  tabBarBg: "rgba(219, 234, 254, 0.72)", // light bluish glass (Tailwind blue-100 overlay)
  tabBarBorder: "rgba(37, 99, 235, 0.22)", // tinted blue border
};

export const darkTokens = {
  bg: "#0F0F1A",
  card: "#1C1C2E",
  text: "#F0F0FF",
  textMuted: "#F0F0FF99",
  border: "#2A2A40",
  inputBg: "#1C1C2E",
  // Glassmorphism surfaces
  glass: "rgba(32,32,56,0.55)",
  glassStrong: "rgba(24,24,42,0.93)",
  glassChip: "rgba(255,255,255,0.07)",
  glassBorder: "rgba(255,255,255,0.10)",
  glassHighlight: "rgba(255,255,255,0.09)",
  blurOverlay: "rgba(15,15,26,0.45)",
  // Navigation Bar
  tabBarBg: "rgba(20, 20, 35, 0.65)", // dark glass
  tabBarBorder: "rgba(255, 255, 255, 0.12)", // subtle white border
};

export type Tokens = typeof lightTokens;

export function useTokens() {
  const dark = useThemeStore((s) => s.dark);
  return dark ? darkTokens : lightTokens;
}
