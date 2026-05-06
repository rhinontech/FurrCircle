import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = "light" | "dark";

export interface Colors {
  // Backgrounds
  bg: string;
  bgCard: string;
  bgSubtle: string;
  bgInput: string;
  // Borders
  border: string;
  borderSubtle: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  // Brand
  brand: string;           // blue-900 equivalent
  brandLight: string;      // lighter brand shade for icons bg
  brandText: string;       // brand tinted text
  // Tab bar
  tabBg: string;
  tabBorder: string;
  tabActive: string;
  tabInactive: string;
  // Hero card (stays blue-900 in both modes)
  heroBg: string;
  heroText: string;
  heroSub: string;
  heroBorder: string;
  // Status chips subtle backgrounds
  successBg: string;
  warningBg: string;
  infoBg: string;
  danger: string;
  dangerBg: string;
}

const LIGHT: Colors = {
  bg: "#f8fafc",
  bgCard: "#ffffff",
  bgSubtle: "#f1f5f9",
  bgInput: "#ffffff",
  border: "#e2e8f0",
  borderSubtle: "#f1f5f9",
  textPrimary: "#0f172a",
  textSecondary: "#334155",
  textMuted: "#64748b",
  textInverse: "#ffffff",
  brand: "#1e3a8a",
  brandLight: "#eff6ff",
  brandText: "#1d4ed8",
  tabBg: "#ffffff",
  tabBorder: "#e2e8f0",
  tabActive: "#1e3a8a",
  tabInactive: "#64748b",
  heroBg: "#1e3a8a",
  heroText: "#ffffff",
  heroSub: "#bfdbfe",
  heroBorder: "#1e40af",
  successBg: "#f0fdf4",
  warningBg: "#fffbeb",
  infoBg: "#eff6ff",
  danger: "#ef4444",
  dangerBg: "#fef2f2",
};

const DARK: Colors = {
  bg: "#0f172a",
  bgCard: "#1e293b",
  bgSubtle: "#1e293b",
  bgInput: "#1e293b",
  border: "#334155",
  borderSubtle: "#1e293b",
  textPrimary: "#f1f5f9",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  textInverse: "#0f172a",
  brand: "#3b82f6",
  brandLight: "#1e3a5f",
  brandText: "#60a5fa",
  tabBg: "#1e293b",
  tabBorder: "#334155",
  tabActive: "#60a5fa",
  tabInactive: "#64748b",
  heroBg: "#172554",
  heroText: "#ffffff",
  heroSub: "#93c5fd",
  heroBorder: "#1e40af",
  successBg: "#052e16",
  warningBg: "#1c1007",
  infoBg: "#0c1a3a",
  danger: "#f87171",
  dangerBg: "#450a0a",
};

interface ThemeContextType {
  isDark: boolean;
  colors: Colors;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: LIGHT,
  toggleTheme: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  // Load theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('theme_preference');
        if (saved !== null) {
          setIsDark(saved === 'dark');
        }
      } catch (e) {
        console.error("Failed to load theme", e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem('theme_preference', next ? 'dark' : 'light');
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  };

  const colors = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
