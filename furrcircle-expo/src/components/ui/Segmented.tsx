import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View, ViewStyle } from "react-native";

import { radius, spacing, useTheme } from "../../theme";
import { glassSurface } from "./Glass";
import { Text } from "./Text";

/** Glass segmented control. Scrolls horizontally when the options overflow. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  scrollable = false,
  style,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  scrollable?: boolean;
  style?: ViewStyle;
}) {
  const { tk } = useTheme();

  const items = options.map((o) => {
    const active = o.value === value;
    return (
      <Pressable
        key={o.value}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onChange(o.value);
        }}
        style={({ pressed }) => [
          {
            flex: scrollable ? undefined : 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingHorizontal: scrollable ? 16 : 10,
            paddingVertical: 9,
            borderRadius: radius.pill,
            backgroundColor: active ? tk.primary : "transparent",
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text variant="caption" color={active ? tk.onPrimary : tk.textSecondary} style={{ fontWeight: "700" }}>
          {o.label}
        </Text>
        {o.count !== undefined ? (
          <View
            style={{
              minWidth: 18,
              paddingHorizontal: 5,
              paddingVertical: 1,
              borderRadius: 9,
              backgroundColor: active ? "rgba(255,255,255,0.25)" : tk.glassChip,
            }}
          >
            <Text variant="micro" color={active ? tk.onPrimary : tk.textMuted} style={{ textAlign: "center" }}>
              {o.count}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  });

  const container: ViewStyle = {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.pill,
    ...glassSurface(tk, "chip"),
    borderWidth: StyleSheet.hairlineWidth * 2,
  };

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={style}>
        <View style={[container, { gap: spacing.xs }]}>{items}</View>
      </ScrollView>
    );
  }

  return <View style={[container, style]}>{items}</View>;
}
