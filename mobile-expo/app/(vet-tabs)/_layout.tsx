import React from "react";
import { Tabs } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";

// ─── Types ────────────────────────────────────────────────────────────────────
type PremiumTabIconProps = {
  badgeName?: AppIconName;
  focused: boolean;
  iconSize?: number;
  isCenter?: boolean;
  name: AppIconName;
  activeColor: string;
  inactiveColor: string;
  surfaceColor: string;
  borderColor: string;
};

type PremiumTabLabelProps = {
  focused: boolean;
  isCenter?: boolean;
  label: string;
  activeColor: string;
  inactiveColor: string;
};

// ─── Vet Android custom glyphs ────────────────────────────────────────────────
// iOS uses SF Symbols via AppIcon; these only render on Android.
function VetAndroidGlyph({
  color,
  cutoutColor,
  name,
  size,
}: {
  color: string;
  cutoutColor: string;
  name: "dashboard" | "patients" | "user";
  size: number;
}) {
  if (name === "dashboard") {
    // Medical monitor with EKG heartbeat line
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        {/* Screen */}
        <Rect x="1" y="3" width="30" height="21" rx="3" fill={color} />
        {/* Monitor stand */}
        <Rect x="12" y="24" width="8" height="4" rx="1" fill={color} />
        <Rect x="7" y="28" width="18" height="2.5" rx="1.25" fill={color} />
        {/* EKG heartbeat cutout */}
        <Path
          d="M4 13.5L7 13.5L9 9.5L11.5 18L14 12L16 13.5L19.5 7L22.5 20L25 13.5L28 13.5"
          stroke={cutoutColor}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }

  if (name === "user") {
    // Community — person silhouette with paw-print badge in corner
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        {/* Person head */}
        <Circle cx="15" cy="11" r="6.5" fill={color} />
        {/* Person shoulders */}
        <Path d="M3 30C3 22 8 17.5 15 17.5C22 17.5 27 22 27 30Z" fill={color} />
        {/* Badge disc — cutout ring separates it from the body */}
        <Circle cx="26" cy="26" r="8" fill={cutoutColor} />
        {/* Paw — three toe beans */}
        <Circle cx="24" cy="23.2" r="1.5" fill={color} />
        <Circle cx="26" cy="22.3" r="1.5" fill={color} />
        <Circle cx="28" cy="23.2" r="1.5" fill={color} />
        {/* Paw — main pad */}
        <Ellipse cx="26" cy="27" rx="2.6" ry="2.2" fill={color} />
      </Svg>
    );
  }

  // Patients — stethoscope (Y-shape earpieces + chest piece)
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {/* Left earpiece */}
      <Circle cx="8" cy="8" r="2.8" fill={color} />
      {/* Right earpiece */}
      <Circle cx="24" cy="8" r="2.8" fill={color} />
      {/* Left tube → junction */}
      <Path
        d="M8 10.8L8 16Q8 18 10 19L14.5 20.5"
        stroke={color}
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right tube → junction */}
      <Path
        d="M24 10.8L24 16Q24 18 22 19L17.5 20.5"
        stroke={color}
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Tube body: junction → chest piece */}
      <Path
        d="M14.5 20.5Q16 21.5 17.5 20.5L17.5 20.5"
        stroke={color}
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M16 21V24.5"
        stroke={color}
        strokeWidth={3.4}
        strokeLinecap="round"
        fill="none"
      />
      {/* Chest piece */}
      <Circle cx="16" cy="28" r="4.5" fill={color} />
      <Circle cx="16" cy="28" r="2" fill={cutoutColor} />
    </Svg>
  );
}

// ─── Platform glyph switcher ──────────────────────────────────────────────────
function VetPlatformTabGlyph({
  color,
  cutoutColor,
  filled = true,
  name,
  size,
  strokeWidth,
}: {
  color: string;
  cutoutColor: string;
  filled?: boolean;
  name: AppIconName;
  size: number;
  strokeWidth: number;
}) {
  if (Platform.OS !== "ios" && (name === "dashboard" || name === "vet" || name === "user")) {
    return (
      <VetAndroidGlyph
        color={color}
        cutoutColor={cutoutColor}
        name={name === "vet" ? "patients" : name === "user" ? "user" : "dashboard"}
        size={size}
      />
    );
  }

  return (
    <AppIcon
      name={name}
      size={size}
      color={color}
      fill={filled ? color : "transparent"}
      filled={filled}
      strokeWidth={strokeWidth}
    />
  );
}

// ─── Premium tab icon ─────────────────────────────────────────────────────────
function PremiumTabIcon({
  badgeName,
  focused,
  iconSize,
  isCenter,
  name,
  activeColor,
  inactiveColor,
  surfaceColor,
  borderColor,
}: PremiumTabIconProps) {
  if (isCenter) {
    return (
      <View style={styles.centerIconSlot}>
        <View
          style={[
            styles.centerBadge,
            {
              backgroundColor: focused ? activeColor : surfaceColor,
              borderColor: focused ? "rgba(255,255,255,0.95)" : borderColor,
              shadowColor: activeColor,
            },
          ]}
        >
          <VetPlatformTabGlyph
            name={name}
            size={31}
            color={focused ? "#fff" : activeColor}
            cutoutColor={focused ? activeColor : surfaceColor}
            filled
            strokeWidth={2.4}
          />
          <View style={[styles.badgeSpark, styles.badgeSparkLarge, { backgroundColor: focused ? "rgba(255,255,255,0.9)" : activeColor }]} />
          <View style={[styles.badgeSpark, styles.badgeSparkSmall, { backgroundColor: focused ? "rgba(255,255,255,0.74)" : activeColor }]} />
        </View>
      </View>
    );
  }

  const color = focused ? activeColor : inactiveColor;

  return (
    <View style={styles.sideIconSlot}>
      <VetPlatformTabGlyph
        name={name}
        size={iconSize ?? 30}
        color={color}
        cutoutColor={surfaceColor}
        filled
        strokeWidth={focused ? 2.5 : 2.1}
      />
      {badgeName && (
        <View style={[styles.sideIconBadge, { backgroundColor: focused ? activeColor : surfaceColor, borderColor }]}>
          <AppIcon
            name={badgeName}
            size={11}
            color={focused ? "#fff" : inactiveColor}
            fill={focused ? "#fff" : inactiveColor}
            filled
            strokeWidth={2.4}
          />
        </View>
      )}
    </View>
  );
}

// ─── Premium tab label ────────────────────────────────────────────────────────
function PremiumTabLabel({
  focused,
  isCenter,
  label,
  activeColor,
  inactiveColor,
}: PremiumTabLabelProps) {
  return (
    <Text
      numberOfLines={1}
      style={[
        styles.tabLabel,
        isCenter && styles.centerLabel,
        { color: focused ? activeColor : inactiveColor },
      ]}
    >
      {label}
    </Text>
  );
}

// ─── Vet tab layout ───────────────────────────────────────────────────────────
export default function VetTabLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, 10);
  const tabBarHeight = 76 + bottomInset;
  const sceneBottomPadding = tabBarHeight;
  const activeColor = colors.brand;
  const inactiveColor = isDark ? "#8a94a6" : "#687083";
  const tabSurface = isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.9)";
  const borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          overflow: "visible",
          backgroundColor: Platform.OS === "ios" ? "transparent" : tabSurface,
          borderTopWidth: 0.5,
          borderTopColor: borderColor,
          height: tabBarHeight,
          paddingBottom: bottomInset > 10 ? bottomInset - 4 : 10,
          paddingTop: 9,
          shadowColor: "#0f172a",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: isDark ? 0.26 : 0.1,
          shadowRadius: 18,
          elevation: 18,
        },
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={72}
            experimentalBlurMethod="dimezisBlurView"
            style={[StyleSheet.absoluteFill, { backgroundColor: tabSurface }]}
          />
        ),
        tabBarItemStyle: {
          height: 62,
        },
        sceneStyle: {
          backgroundColor: colors.bg,
          paddingBottom: sceneBottomPadding,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarLabel: ({ focused }) => (
            <PremiumTabLabel focused={focused} label="Dashboard" activeColor={activeColor} inactiveColor={inactiveColor} />
          ),
          tabBarIcon: ({ focused }) => (
            <PremiumTabIcon focused={focused} name="dashboard" activeColor={activeColor} inactiveColor={inactiveColor} surfaceColor={colors.bgCard} borderColor={borderColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarLabel: ({ focused }) => (
            <PremiumTabLabel focused={focused} label="Schedule" activeColor={activeColor} inactiveColor={inactiveColor} />
          ),
          tabBarIcon: ({ focused }) => (
            <PremiumTabIcon focused={focused} name="appointments" iconSize={28} activeColor={activeColor} inactiveColor={inactiveColor} surfaceColor={colors.bgCard} borderColor={borderColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarItemStyle: styles.centerTabItem,
          tabBarLabel: ({ focused }) => (
            <PremiumTabLabel focused={focused} isCenter label="Patients" activeColor={activeColor} inactiveColor={inactiveColor} />
          ),
          tabBarIcon: ({ focused }) => (
            <PremiumTabIcon focused={focused} isCenter name="vet" activeColor={activeColor} inactiveColor={inactiveColor} surfaceColor={colors.bgCard} borderColor={borderColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarLabel: ({ focused }) => (
            <PremiumTabLabel focused={focused} label="Community" activeColor={activeColor} inactiveColor={inactiveColor} />
          ),
          tabBarIcon: ({ focused }) => (
            <PremiumTabIcon focused={focused} name="user" badgeName="paw" iconSize={35} activeColor={activeColor} inactiveColor={inactiveColor} surfaceColor={colors.bgCard} borderColor={borderColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: ({ focused }) => (
            <PremiumTabLabel focused={focused} label="Profile" activeColor={activeColor} inactiveColor={inactiveColor} />
          ),
          tabBarIcon: ({ focused }) => (
            <PremiumTabIcon focused={focused} name="profile" activeColor={activeColor} inactiveColor={inactiveColor} surfaceColor={colors.bgCard} borderColor={borderColor} />
          ),
        }}
      />
    </Tabs>
  );
}

// ─── Styles (mirrors user tab layout exactly) ─────────────────────────────────
const styles = StyleSheet.create({
  sideIconSlot: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    marginBottom: 2,
    width: 52,
  },
  sideIconBadge: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    bottom: 1,
    height: 20,
    justifyContent: "center",
    position: "absolute",
    right: 7,
    width: 20,
  },
  centerTabItem: {
    height: 82,
  },
  centerIconSlot: {
    alignItems: "center",
    height: 54,
    justifyContent: "center",
    marginBottom: 0,
    marginTop: -45,
    width: 82,
  },
  centerBadge: {
    alignItems: "center",
    borderRadius: 37,
    borderWidth: 3,
    height: 74,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    width: 74,
    elevation: 12,
  },
  badgeSpark: {
    borderRadius: 999,
    position: "absolute",
  },
  badgeSparkLarge: {
    height: 6,
    right: 16,
    top: 18,
    width: 6,
  },
  badgeSparkSmall: {
    bottom: 18,
    height: 4,
    left: 17,
    width: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 16,
  },
  centerLabel: {
    marginTop: 4,
  },
});
