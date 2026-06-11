import { View, StyleSheet, Platform, Keyboard } from "react-native";
import { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import { Home, Users, Bone, Compass, LayoutGrid } from "lucide-react-native";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useBreakpoint } from "../../src/lib/breakpoints";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassBlur } from "../../src/components/ui/Glass";
import { AmbientBackground } from "../../src/components/ui/AmbientBackground";

export default function TabsLayout() {
  const tk = useTokens();
  const { isTablet, isWide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: tk.bg }]}>
      <AmbientBackground />
      {isTablet ? (
        /* ── Desktop: SideNav + RightRail handled at root _layout level ── */
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: "transparent" },
            tabBarStyle: { display: "none" },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: tk.textMuted,
          }}
        >
          <Tabs.Screen name="index" options={{ title: "Feed", tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2} /> }} />
          <Tabs.Screen name="community" options={{ title: "Circles", tabBarIcon: ({ color, size }) => <Users size={size} color={color} strokeWidth={2} /> }} />
          <Tabs.Screen name="match" options={{ title: "Match", tabBarIcon: ({ color, size }) => <Bone size={size} color={color} strokeWidth={2} /> }} />
          <Tabs.Screen name="discover" options={{ title: "Discover", tabBarIcon: ({ color, size }) => <Compass size={size} color={color} strokeWidth={2} /> }} />
          <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} strokeWidth={2} /> }} />
        </Tabs>
      ) : (
        /* ── Mobile: glass bottom tabs floating over content ── */
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: "transparent" },
            tabBarStyle: {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: keyboardHeight > 0 ? -keyboardHeight : 0,
              backgroundColor: "transparent",
              borderTopWidth: 0,
              elevation: 0,
              paddingTop: 6,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
              height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
            },
            tabBarBackground: () => (
              <GlassBlur
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.tabBarGlass,
                  { borderColor: tk.glassBorder },
                ]}
              />
            ),
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: tk.textMuted,
            tabBarLabelStyle: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
          }}
        >
          <Tabs.Screen name="index" options={{ title: "Feed", tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2} /> }} />
          <Tabs.Screen name="community" options={{ title: "Circles", tabBarIcon: ({ color, size }) => <Users size={size} color={color} strokeWidth={2} /> }} />
          <Tabs.Screen name="match" options={{ title: "Match", tabBarIcon: ({ color, size }) => <Bone size={size} color={color} strokeWidth={2} /> }} />
          <Tabs.Screen name="discover" options={{ title: "Discover", tabBarIcon: ({ color, size }) => <Compass size={size} color={color} strokeWidth={2} /> }} />
          <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} strokeWidth={2} /> }} />
        </Tabs>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Rounded glass slab behind the floating tab bar
  tabBarGlass: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
  },

  // Desktop 3-column row — fills the whole screen width
  desktopRow: { flex: 1, flexDirection: "row" },

  // Middle column: flex:1 so it fills space between the two fixed sidebars,
  // then centres the feed column within that space
  desktopCenter: { flex: 1, alignItems: "center" },

  // The actual feed column — capped at 680 px so it never stretches too wide
  feedColumn: {
    width: "100%",
    maxWidth: 680,
    flex: 1,
  },

  // Right rail wrapper — fixed 300 px, glued to right edge
  rightRailWrap: { width: 300, flexShrink: 0, borderLeftWidth: 1 },
});
