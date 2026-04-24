import React from "react";
import { Tabs } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";

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

function AndroidTabGlyph({
  color,
  cutoutColor,
  name,
  size,
}: {
  color: string;
  cutoutColor: string;
  name: "discover" | "home";
  size: number;
}) {
  if (name === "home") {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Path
          d="M4.4 15.5 15 6.1c.6-.5 1.4-.5 2 0l10.6 9.4c.9.8.3 2.3-.9 2.3h-1.1v8.1c0 1.5-1.2 2.7-2.7 2.7h-4.1v-7.4h-5.6v7.4H9.1c-1.5 0-2.7-1.2-2.7-2.7v-8.1H5.3c-1.2 0-1.8-1.5-.9-2.3Z"
          fill={color}
        />
        <Path d="M13.2 28.6v-7.4h5.6v7.4h-5.6Z" fill={cutoutColor} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="16" cy="16" r="10.5" fill="none" stroke={color} strokeWidth={3.2} />
      <Path
        d="M21.8 9.4 18.6 19c-.1.4-.4.7-.8.8l-9.6 3.2 3.2-9.6c.1-.4.4-.7.8-.8l9.6-3.2Z"
        fill={color}
      />
      <Circle cx="16" cy="16" r="1.6" fill={cutoutColor} />
    </Svg>
  );
}

function PlatformTabGlyph({
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
  if (Platform.OS !== "ios" && (name === "home" || name === "discover")) {
    return <AndroidTabGlyph color={color} cutoutColor={cutoutColor} name={name} size={size} />;
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
          <PlatformTabGlyph
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
      <PlatformTabGlyph
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

export default function TabLayout() {
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
        name="index"
        options={{
          title: "Home",
          tabBarLabel: ({ focused }) => <PremiumTabLabel focused={focused} label="Home" activeColor={activeColor} inactiveColor={inactiveColor} />,
          tabBarIcon: ({ focused }) => (
            <PremiumTabIcon focused={focused} name="home" activeColor={activeColor} inactiveColor={inactiveColor} surfaceColor={colors.bgCard} borderColor={borderColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: "Pets",
          tabBarLabel: ({ focused }) => <PremiumTabLabel focused={focused} label="Pets" activeColor={activeColor} inactiveColor={inactiveColor} />,
          tabBarIcon: ({ focused }) => (
            <PremiumTabIcon focused={focused} name="pets" activeColor={activeColor} inactiveColor={inactiveColor} surfaceColor={colors.bgCard} borderColor={borderColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarItemStyle: styles.centerTabItem,
          tabBarLabel: ({ focused }) => <PremiumTabLabel focused={focused} isCenter label="Explore" activeColor={activeColor} inactiveColor={inactiveColor} />,
          tabBarIcon: ({ focused }) => (
            <PremiumTabIcon focused={focused} isCenter name="discover" activeColor={activeColor} inactiveColor={inactiveColor} surfaceColor={colors.bgCard} borderColor={borderColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarLabel: ({ focused }) => <PremiumTabLabel focused={focused} label="Social" activeColor={activeColor} inactiveColor={inactiveColor} />,
          tabBarIcon: ({ focused }) => (
            <PremiumTabIcon focused={focused} name="user" badgeName="paw" iconSize={35} activeColor={activeColor} inactiveColor={inactiveColor} surfaceColor={colors.bgCard} borderColor={borderColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: ({ focused }) => <PremiumTabLabel focused={focused} label="Profile" activeColor={activeColor} inactiveColor={inactiveColor} />,
          tabBarIcon: ({ focused }) => (
            <PremiumTabIcon focused={focused} name="profile" activeColor={activeColor} inactiveColor={inactiveColor} surfaceColor={colors.bgCard} borderColor={borderColor} />
          ),
        }}
      />
    </Tabs>
  );
}

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
