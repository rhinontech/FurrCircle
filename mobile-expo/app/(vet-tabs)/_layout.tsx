import React from "react";
import { Tabs } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "@/components/ui/AppIcon";

export default function VetTabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, 10);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopWidth: 1,
          borderTopColor: colors.tabBorder,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <AppIcon name="dashboard" color={color} size={size} /> }} />
      <Tabs.Screen name="appointments" options={{ title: "Appointments", tabBarIcon: ({ color, size }) => <AppIcon name="appointments" color={color} size={size} /> }} />
      <Tabs.Screen name="patients" options={{ title: "Patients", tabBarIcon: ({ color, size }) => <AppIcon name="patients" color={color} size={size} /> }} />
      <Tabs.Screen name="community" options={{ title: "Community", tabBarIcon: ({ color, size }) => <AppIcon name="community" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <AppIcon name="profile" color={color} size={size} /> }} />
    </Tabs>
  );
}
