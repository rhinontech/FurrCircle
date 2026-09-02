import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from "react-native";

import { palette, radius, useTheme } from "../../theme";
import { glassShadow, glassSurface } from "./Glass";
import { Text } from "./Text";

/** `inverse` is a light pill for use on the brand gradient cards, where the
 *  surface is dark in both themes so the label must not follow the theme. */
type Variant = "primary" | "glass" | "ghost" | "danger" | "inverse";
type Size = "sm" | "md" | "lg";

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  style?: ViewStyle;
};

const sizing = {
  sm: { height: 38, px: 14, gap: 6, icon: 15, variant: "caption" as const },
  md: { height: 48, px: 18, gap: 8, icon: 17, variant: "bodyStrong" as const },
  lg: { height: 56, px: 22, gap: 10, icon: 19, variant: "subheading" as const },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  disabled,
  loading,
  full,
  style,
}: ButtonProps) {
  const { tk } = useTheme();
  const s = sizing[size];
  const isSolid = variant === "primary" || variant === "danger";
  const fg = isSolid
    ? "#FFFFFF"
    : variant === "inverse"
      ? palette.brand[800]
      : variant === "ghost"
        ? tk.primary
        : tk.text;

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: s.height,
          borderRadius: radius.pill,
          overflow: "hidden",
          alignSelf: full ? "stretch" : "flex-start",
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
        variant === "glass" && [glassSurface(tk), glassShadow(tk, "sm")],
        variant === "ghost" && { backgroundColor: "transparent" },
        variant === "inverse" && [{ backgroundColor: "rgba(255,255,255,0.94)" }, glassShadow(tk, "sm")],
        isSolid && glassShadow(tk, "md"),
        style,
      ]}
    >
      {isSolid ? (
        <LinearGradient
          colors={
            variant === "danger"
              ? [palette.coral[400], palette.coral[600]]
              : tk.scheme === "dark"
                ? [palette.brand[500], palette.brand[700]]
                : [palette.brand[500], palette.brand[800]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: s.px,
          gap: s.gap,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={s.icon} color={fg} /> : null}
            <Text variant={s.variant} color={fg} numberOfLines={1}>
              {label}
            </Text>
            {iconRight ? <Ionicons name={iconRight} size={s.icon} color={fg} /> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

/** Circular glass icon button — headers, card corners, media controls. */
export function IconButton({
  icon,
  onPress,
  size = 40,
  tone,
  style,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  tone?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const { tk } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon}
      hitSlop={8}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        glassSurface(tk, "chip"),
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.46} color={tone ?? tk.text} />
    </Pressable>
  );
}
