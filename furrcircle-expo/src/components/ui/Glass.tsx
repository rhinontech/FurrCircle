import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from "react-native";

import { radius as R, Tokens, useTokens } from "../../theme";

/**
 * Faux glass: a translucent fill plus a hairline light border. No blur, so it
 * is cheap enough for list rows, chips and anything that scrolls. Real blur is
 * reserved for fixed chrome — see `GlassBlur`.
 */
export function glassSurface(tk: Tokens, level: "chip" | "card" | "sheet" = "card"): ViewStyle {
  return {
    backgroundColor: level === "chip" ? tk.glassChip : level === "sheet" ? tk.glassStrong : tk.glass,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: tk.glassBorder,
  };
}

/** Soft ambient drop shadow tuned per scheme (dark mode needs a wider, softer cast). */
export function glassShadow(tk: Tokens, strength: "sm" | "md" | "lg" = "md"): ViewStyle {
  const cfg = {
    sm: { radius: 10, y: 3, opacity: 0.1 },
    md: { radius: 20, y: 8, opacity: 0.13 },
    lg: { radius: 34, y: 16, opacity: 0.18 },
  }[strength];
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: tk.shadow,
      shadowOpacity: tk.scheme === "dark" ? cfg.opacity + 0.22 : cfg.opacity,
      shadowRadius: cfg.radius,
      shadowOffset: { width: 0, height: cfg.y },
    },
    android: { elevation: strength === "sm" ? 2 : strength === "md" ? 5 : 9 },
    default: {},
  })!;
}

type GlassCardProps = ViewProps & {
  /** Corner radius token. */
  rounded?: keyof typeof R;
  padded?: boolean;
  shadow?: "none" | "sm" | "md" | "lg";
};

/**
 * The workhorse surface: an evenly tinted frosted panel, a hairline edge and a
 * soft shadow. Deliberately flat inside — a gradient sweeping across the face
 * of a card reads as brushed metal rather than glass, so the depth comes from
 * the blue ground showing through instead.
 */
export function GlassCard({
  rounded = "xl",
  padded = true,
  shadow = "md",
  style,
  children,
  ...rest
}: GlassCardProps) {
  const tk = useTokens();
  return (
    <View
      {...rest}
      style={[
        glassSurface(tk),
        shadow !== "none" && glassShadow(tk, shadow),
        { borderRadius: R[rounded], overflow: "hidden" },
        padded && { padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type GlassBlurProps = ViewProps & {
  intensity?: number;
  rounded?: keyof typeof R;
  /** Extra tint painted over the blur so text keeps contrast on busy content. */
  tinted?: boolean;
};

/**
 * Real backdrop blur. Expensive — use only for fixed chrome (tab bar, headers,
 * sheets), never inside a scrolling list.
 */
export function GlassBlur({
  intensity = 40,
  rounded,
  tinted = true,
  style,
  children,
  ...rest
}: GlassBlurProps) {
  const tk = useTokens();
  return (
    <View
      {...rest}
      style={[rounded ? { borderRadius: R[rounded], overflow: "hidden" } : { overflow: "hidden" }, style]}
    >
      <BlurView
        intensity={intensity}
        tint={tk.scheme === "dark" ? "dark" : "light"}
        // Android needs the Dimezis implementation for a real backdrop blur.
        experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        style={StyleSheet.absoluteFillObject}
      />
      {tinted ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: tk.glassStrong }]}
        />
      ) : null}
      {children}
    </View>
  );
}

/** Small pill surface for filters, tags and segmented options. */
export function GlassChip({
  active,
  tone,
  style,
  children,
  ...rest
}: ViewProps & { active?: boolean; tone?: string }) {
  const tk = useTokens();
  const accent = tone ?? tk.primary;
  return (
    <View
      {...rest}
      style={[
        {
          borderRadius: R.pill,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderWidth: StyleSheet.hairlineWidth * 2,
          backgroundColor: active ? accent : tk.glassChip,
          borderColor: active ? accent : tk.glassBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A hairline divider that reads as an etched line in the glass. */
export function GlassDivider({ style }: { style?: ViewStyle }) {
  const tk = useTokens();
  return (
    <View
      style={[{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginVertical: 12 }, style]}
    />
  );
}
