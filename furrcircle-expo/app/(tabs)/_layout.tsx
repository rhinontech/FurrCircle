import { View, StyleSheet, Platform, Keyboard } from "react-native";
import { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useBreakpoint } from "../../src/lib/breakpoints";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassBlur } from "../../src/components/ui/Glass";
import { AmbientBackground } from "../../src/components/ui/AmbientBackground";
import { TAB_BAR_HEIGHT, tabBarBottom } from "../../src/lib/tabbar";

type IonName = keyof typeof Ionicons.glyphMap;

/** SF-Symbols-style tab icon: filled when active, outline when idle. */
const tabIcon = (active: IonName, inactive: IonName) =>
  ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  );

const TAB_SCREENS = [
  { name: "index", title: "Feed", icon: tabIcon("home", "home-outline") },
  { name: "community", title: "Circles", icon: tabIcon("people", "people-outline") },
  { name: "match", title: "Match", icon: tabIcon("paw", "paw-outline") },
  { name: "discover", title: "Discover", icon: tabIcon("compass", "compass-outline") },
  { name: "profile", title: "Profile", icon: tabIcon("person-circle", "person-circle-outline") },
];

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
            // Opaque scene on desktop/web: react-native-screens does not reliably
            // hide inactive tab scenes on web, so a transparent scene lets every
            // visited tab bleed through. An opaque bg keeps only the active tab visible.
            sceneStyle: { backgroundColor: Platform.OS === 'web' ? tk.bg : 'transparent' },
            tabBarStyle: { display: "none" },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: tk.textMuted,
          }}
        >
          {TAB_SCREENS.map((s) => (
            <Tabs.Screen key={s.name} name={s.name} options={{ title: s.title, tabBarIcon: s.icon }} />
          ))}
        </Tabs>
      ) : (
        /* ── Mobile: glass bottom tabs floating over content ── */
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: Platform.OS === 'web' ? tk.bg : "transparent" },
            tabBarStyle: {
              position: "absolute",
              // Same margin on all three sides, Instagram-style (capped so it
              // never gets chunky on Android 3-button nav where the bottom
              // offset has to clear the system bar). Must use start/end —
              // the library anchors the bar with start/end: 0, which beats
              // left/right in RN's style resolution.
              start: Math.min(tabBarBottom(insets.bottom), 18),
              end: Math.min(tabBarBottom(insets.bottom), 18),
              bottom: keyboardHeight > 0 ? -keyboardHeight : tabBarBottom(insets.bottom),
              backgroundColor: "transparent",
              borderTopWidth: 0,
              elevation: 0,
              paddingTop: 6,
              paddingBottom: 8,
              height: TAB_BAR_HEIGHT,
              borderRadius: 32,
            },
            tabBarBackground: () => (
              <GlassBlur
                overlayColor={tk.tabBarBg}
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.tabBarGlass,
                  { borderColor: tk.tabBarBorder },
                ]}
              />
            ),
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: tk.textMuted,
            tabBarLabelStyle: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
          }}
        >
          {TAB_SCREENS.map((s) => (
            <Tabs.Screen key={s.name} name={s.name} options={{ title: s.title, tabBarIcon: s.icon }} />
          ))}
        </Tabs>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Glass pill behind the floating tab bar
  tabBarGlass: {
    borderRadius: 32,
    borderWidth: 1,
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
