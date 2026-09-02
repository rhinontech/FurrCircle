import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { darkTokens, lightTokens, radius, spacing, type, Tokens } from "./tokens";

export * from "./tokens";

type Preference = "system" | "light" | "dark";

type ThemeValue = {
  tk: Tokens;
  scheme: "light" | "dark";
  preference: Preference;
  setPreference: (p: Preference) => void;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof type;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<Preference>("system");

  const value = useMemo<ThemeValue>(() => {
    const scheme = preference === "system" ? (system === "dark" ? "dark" : "light") : preference;
    return {
      tk: scheme === "dark" ? darkTokens : lightTokens,
      scheme,
      preference,
      setPreference,
      spacing,
      radius,
      type,
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/** Shorthand for the common case of only needing the token set. */
export function useTokens(): Tokens {
  return useTheme().tk;
}
