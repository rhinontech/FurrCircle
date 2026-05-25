import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Home, Users, Bone, Compass, LayoutGrid } from "lucide-react-native";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useBreakpoint } from "../../src/lib/breakpoints";
import { SideNav } from "../../src/components/SideNav";
import { RightRail } from "../../src/components/RightRail";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const tk = useTokens();
  const { isTablet, isWide } = useBreakpoint();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: tk.bg }]}>
      {/* Tablet / desktop: side nav lives here, wrapping the tab content */}
      <View style={[styles.inner, isTablet && styles.innerTablet]}>
        {isTablet && <SideNav />}

        {/* Tab screens */}
        <View style={[styles.content, isTablet && styles.contentTablet, { borderColor: tk.border }]}>
          <Tabs
            screenOptions={{
              headerShown: false,
              // On tablet, hide the bottom bar entirely — SideNav handles navigation
              tabBarStyle: isTablet
                ? { display: "none" }
                : {
                    backgroundColor: tk.card,
                    borderTopColor: tk.border,
                    paddingTop: 6,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
                  },
              tabBarActiveTintColor: colors.coral,
              tabBarInactiveTintColor: tk.textMuted,
              tabBarLabelStyle: {
                fontFamily: "Poppins_600SemiBold",
                fontSize: 11,
              },
            }}
          >
            <Tabs.Screen name="index"     options={{ title: "Feed",    tabBarIcon: ({ color, size }) => <Home      size={size} color={color} strokeWidth={2} /> }} />
            <Tabs.Screen name="community" options={{ title: "Circles", tabBarIcon: ({ color, size }) => <Users     size={size} color={color} strokeWidth={2} /> }} />
            <Tabs.Screen name="match"     options={{ title: "Match",   tabBarIcon: ({ color, size }) => <Bone      size={size} color={color} strokeWidth={2} /> }} />
            <Tabs.Screen name="discover"  options={{ title: "Discover",tabBarIcon: ({ color, size }) => <Compass   size={size} color={color} strokeWidth={2} /> }} />
            <Tabs.Screen name="profile"   options={{ title: "Profile", tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} strokeWidth={2} /> }} />
          </Tabs>
        </View>

        {/* Right rail — only on wide screens (≥ 1280) */}
        {isTablet && isWide && <RightRail />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
  innerTablet: {
    flexDirection: "row",
    alignSelf: "center",
    width: "100%",
    maxWidth: 1280,
  },
  content: { flex: 1 },
  contentTablet: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxWidth: 640,
  },
});
