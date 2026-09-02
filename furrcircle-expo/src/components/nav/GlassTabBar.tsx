import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radius, useTheme } from "../../theme";
import { GlassBlur, glassShadow } from "../ui/Glass";
import { Text } from "../ui/Text";

const BAR_HEIGHT = 66;
const SIDE_MARGIN = 16;

export type TabMeta = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

/**
 * Floating blurred tab bar. This is fixed chrome, so real backdrop blur is
 * affordable here — the rest of the app uses the cheap faux-glass surfaces.
 */
export function GlassTabBar({ state, navigation, tabs }: BottomTabBarProps & { tabs: TabMeta[] }) {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const innerWidth = width - SIDE_MARGIN * 2;
  const itemWidth = innerWidth / state.routes.length;
  const pillWidth = itemWidth - 10;

  // RN's Animated rather than Reanimated: a single translateX spring does not
  // justify a worklets runtime, and this runs on the native driver either way.
  const x = useRef(new Animated.Value(state.index * itemWidth + 5)).current;
  useEffect(() => {
    Animated.spring(x, {
      toValue: state.index * itemWidth + 5,
      useNativeDriver: true,
      damping: 18,
      stiffness: 190,
      mass: 0.6,
    }).start();
  }, [state.index, itemWidth, x]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: SIDE_MARGIN,
        right: SIDE_MARGIN,
        // Android draws behind the gesture bar (edgeToEdgeEnabled), so the
        // inset has to be added explicitly rather than assumed.
        bottom: Math.max(insets.bottom, 10),
      }}
    >
      <GlassBlur
        intensity={tk.scheme === "dark" ? 55 : 45}
        style={[
          {
            height: BAR_HEIGHT,
            borderRadius: radius["2xl"],
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderColor: tk.glassBorder,
          },
          glassShadow(tk, "lg"),
        ]}
      >
        <Animated.View
          style={[
            { transform: [{ translateX: x }] },
            {
              position: "absolute",
              top: 5,
              width: pillWidth,
              height: BAR_HEIGHT - 10,
              borderRadius: radius.xl,
              overflow: "hidden",
            },
          ]}
        >
          <LinearGradient
            colors={
              tk.scheme === "dark"
                ? ["rgba(127,169,222,0.22)", "rgba(69,118,185,0.14)"]
                : ["rgba(69,118,185,0.18)", "rgba(22,61,125,0.10)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        <View style={{ flexDirection: "row", height: "100%" }}>
          {state.routes.map((route, index) => {
            const meta = tabs.find((t) => t.name === route.name) ?? tabs[index];
            const focused = state.index === index;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={meta.label}
                onPress={() => {
                  const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                  if (focused || event.defaultPrevented) return;
                  Haptics.selectionAsync().catch(() => {});
                  navigation.navigate(route.name);
                }}
                style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 3 }}
              >
                <Ionicons
                  name={focused ? meta.iconActive : meta.icon}
                  size={21}
                  color={focused ? tk.primary : tk.textMuted}
                />
                <Text
                  variant="micro"
                  color={focused ? tk.primary : tk.textMuted}
                  style={{ letterSpacing: 0.1, fontSize: 10 }}
                  numberOfLines={1}
                >
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassBlur>
    </View>
  );
}
