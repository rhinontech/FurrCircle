import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { radius, useTheme } from "../../theme";
import { Text } from "./Text";

export type Tone = "primary" | "success" | "warning" | "danger" | "verified" | "community" | "neutral";

export function Badge({
  label,
  tone = "neutral",
  icon,
  style,
}: {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  const { tk } = useTheme();
  const map = {
    primary: [tk.primary, tk.primarySoft],
    success: [tk.success, tk.successSoft],
    warning: [tk.warning, tk.warningSoft],
    danger: [tk.danger, tk.dangerSoft],
    verified: [tk.verified, tk.verifiedSoft],
    community: [tk.community, tk.communitySoft],
    neutral: [tk.textSecondary, tk.glassChip],
  } as const;
  const [fg, bg] = map[tone];

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          alignSelf: "flex-start",
          paddingHorizontal: 9,
          paddingVertical: 4,
          borderRadius: radius.pill,
          backgroundColor: bg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: fg + "33",
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={11} color={fg} /> : null}
      <Text variant="micro" color={fg}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

/** The FurrCircle verification mark. Only ever rendered for approved clinicians. */
export function VerifiedMark({ size = 15 }: { size?: number }) {
  const { tk } = useTheme();
  return <Ionicons name="shield-checkmark" size={size} color={tk.verified} />;
}
