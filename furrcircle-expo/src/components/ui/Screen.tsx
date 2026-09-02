import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing, TAB_BAR_CLEARANCE, useTheme } from "../../theme";
import { AmbientBackground } from "./AmbientBackground";
import { glassSurface } from "./Glass";
import { Text } from "./Text";

type ScreenProps = {
  children: React.ReactNode;
  /** Paints the ambient backdrop. Turn off inside a screen already nested in one. */
  ambient?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, ambient = true, style }: ScreenProps) {
  return (
    <View style={[{ flex: 1 }, style]}>
      {ambient ? <AmbientBackground /> : null}
      {children}
    </View>
  );
}

type ScreenScrollProps = ScrollViewProps & {
  /** Adds bottom padding so content clears the floating tab bar. */
  underTabBar?: boolean;
};

export function ScreenScroll({ underTabBar = true, contentContainerStyle, ...rest }: ScreenScrollProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
      {...rest}
      contentContainerStyle={[
        {
          paddingHorizontal: spacing.xl,
          paddingBottom: underTabBar ? TAB_BAR_CLEARANCE + insets.bottom : spacing["3xl"] + insets.bottom,
        },
        contentContainerStyle,
      ]}
    />
  );
}

type HeaderProps = {
  title: string;
  subtitle?: string;
  /** Shows a glass back chevron. Defaults on for pushed screens. */
  back?: boolean;
  right?: React.ReactNode;
  /** Large hero title (dashboards) vs. compact title (pushed screens). */
  size?: "large" | "compact";
};

export function ScreenHeader({ title, subtitle, back = false, right, size = "large" }: HeaderProps) {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        paddingTop: insets.top + (Platform.OS === "android" ? spacing.md : spacing.sm),
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        {back ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              glassSurface(tk, "chip"),
              {
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={tk.text} />
          </Pressable>
        ) : null}

        <View style={{ flex: 1 }}>
          <Text variant={size === "large" ? "display" : "title"} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {right}
      </View>
    </View>
  );
}

/** Section label + optional trailing action, used between card groups. */
export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: spacing["2xl"],
          marginBottom: spacing.md,
        },
        style,
      ]}
    >
      <Text variant="heading">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text variant="caption" tone="primary" style={{ fontWeight: "700" }}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const hairline = StyleSheet.hairlineWidth;
