import React from "react";
import { Tabs } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, Text } from "react-native";
import { BlurView } from "expo-blur";
import { HomeIcon, PetsIcon, DiscoverIcon, CommunityIcon, ProfileIcon } from "@/components/ui/TabIcons";
import AppIcon from "@/components/ui/AppIcon";

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0.5,
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          // Android fallback for glass effect: semi-transparent solid color
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDark ? 'rgba(18,18,18,0.94)' : 'rgba(255,255,255,0.94)'),
          elevation: 0,
          height: Platform.OS === 'ios' ? 60 + bottomInset : 74,
          paddingBottom: Platform.OS === 'ios' ? (bottomInset > 0 ? bottomInset - 10 : 10) : 16,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={60}
            // Experimental prop for Android support in newer Expo versions
            experimentalBlurMethod="dimezisBlurView"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Home", 
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon color={color} size={28 } focused={focused} />
          ) 
        }} 
      />
      <Tabs.Screen 
        name="pets" 
        options={{ 
          title: "Pets", 
          tabBarLabel: "Pets",
          tabBarIcon: ({ color, focused }) => (
            <PetsIcon color={color} size={28} focused={focused} />
          ) 
        }} 
      />
      <Tabs.Screen 
        name="discover" 
        options={{ 
          title: "Discover", 
          tabBarLabel: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <DiscoverIcon color={color} size={28} focused={focused} />
          ) 
        }} 
      />
      <Tabs.Screen 
        name="community" 
        options={{ 
          title: "Community", 
          tabBarLabel: "Social",
          tabBarIcon: ({ color, focused }) => (
            <CommunityIcon color={color} size={28} focused={focused} />
          ) 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Profile", 
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <ProfileIcon color={color} size={28} focused={focused} />
          ) 
        }} 
      />
    </Tabs>
  );
}
