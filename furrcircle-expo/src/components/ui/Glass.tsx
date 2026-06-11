/**
 * Glassmorphism primitives.
 *
 * - glassSurface(tk): style helper for translucent "faux glass" — cheap enough
 *   to use on every list row / chip (no real blur).
 * - GlassCard: faux-glass container with a top light-catch highlight, for
 *   hero surfaces like feed post cards.
 * - GlassBlur: real BlurView surface — reserve for fixed chrome that floats
 *   over scrolling content (tab bar, headers, sheets). Blur re-renders with
 *   what's behind it, so never put it inside list items.
 */
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import type { ReactNode } from "react";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore, useTokens, type Tokens } from "../../lib/theme-store";

export function glassSurface(tk: Tokens): ViewStyle {
  return {
    backgroundColor: tk.glass,
    borderWidth: 1,
    borderColor: tk.glassBorder,
  };
}

export function GlassCard({
  children,
  style,
  radius = 24,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}) {
  const tk = useTokens();
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: tk.glass,
          borderWidth: 1,
          borderColor: tk.glassBorder,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[tk.glassHighlight, "rgba(255,255,255,0)"]}
        style={styles.highlight}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

export function GlassBlur({
  children,
  style,
  strong = false,
  intensity = 50,
  overlayColor,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use the more opaque overlay (sheets/dialogs that need legibility). */
  strong?: boolean;
  intensity?: number;
  overlayColor?: string;
}) {
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <BlurView
        intensity={intensity}
        tint={dark ? "dark" : "light"}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: overlayColor ?? (strong ? tk.glassStrong : tk.blurOverlay) },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 44,
  },
});
