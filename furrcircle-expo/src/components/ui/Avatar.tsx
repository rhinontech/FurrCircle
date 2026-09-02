import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { palette, useTheme } from "../../theme";
import { Text } from "./Text";

export type AvatarProps = {
  uri?: string | null;
  name?: string;
  size?: number;
  /** Species icon fallback when there is no photo and no name. */
  species?: "dog" | "cat" | "rabbit" | "bird" | "other";
  /** Draws the brand gradient ring — used for verified vets and live stories. */
  ring?: "none" | "brand" | "verified" | "live";
  style?: ViewStyle;
};

const speciesIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  dog: "paw",
  cat: "paw",
  rabbit: "paw",
  bird: "egg",
  other: "paw",
};

export function Avatar({ uri, name, size = 44, species, ring = "none", style }: AvatarProps) {
  const { tk } = useTheme();
  // Remote pet photos are user-supplied and often dead links; fall back to the
  // initials/species face rather than leaving a blank hole in the layout.
  const [broken, setBroken] = React.useState(false);
  const src = broken ? null : uri;
  const ringWidth = ring === "none" ? 0 : Math.max(2, size * 0.05);
  const inner = size - ringWidth * 2 - (ring === "none" ? 0 : 3);

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("")
    : undefined;

  const ringColors =
    ring === "verified"
      ? ([palette.teal[300], palette.teal[500]] as const)
      : ring === "live"
        ? ([palette.coral[300], palette.violet[500]] as const)
        : ([palette.brand[300], palette.brand[700]] as const);

  const face = (
    <View
      style={{
        width: inner,
        height: inner,
        borderRadius: inner / 2,
        overflow: "hidden",
        backgroundColor: tk.primarySoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={180}
          onError={() => setBroken(true)}
        />
      ) : initials ? (
        <Text variant="bodyStrong" tone="primary" style={{ fontSize: inner * 0.36 }}>
          {initials}
        </Text>
      ) : (
        <Ionicons name={speciesIcon[species ?? "other"]} size={inner * 0.44} color={tk.primary} />
      )}
    </View>
  );

  if (ring === "none") {
    return <View style={[{ width: size, height: size }, style]}>{face}</View>;
  }

  return (
    <LinearGradient
      colors={ringColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: ringWidth,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <View
        style={{
          width: size - ringWidth * 2,
          height: size - ringWidth * 2,
          borderRadius: (size - ringWidth * 2) / 2,
          backgroundColor: tk.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {face}
      </View>
    </LinearGradient>
  );
}
