import { View, StyleSheet, ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { SideNav } from "./SideNav";
import { RightRail } from "./RightRail";
import { useBreakpoint } from "../lib/breakpoints";
import { useTokens } from "../lib/theme-store";

interface AppShellProps {
  children: ReactNode;
  /** Pass false to hide side nav + right rail (settings, compose, etc.) */
  showNav?: boolean;
  /** Hide the right rail on focused screens */
  hideRail?: boolean;
  style?: ViewStyle;
}

/**
 * Responsive shell:
 *  mobile  (<768)  → no side nav, no right rail (Tabs layout handles bottom nav)
 *  tablet  (≥768)  → side nav (icons only), content centred, no right rail
 *  desktop (≥1024) → side nav with labels, content centred, right rail (≥1280)
 */
export function AppShell({ children, showNav = true, hideRail = false, style }: AppShellProps) {
  const { isTablet, isDesktop, isWide } = useBreakpoint();
  const tk = useTokens();

  // On mobile the Tabs layout already renders the bottom bar — nothing extra here.
  if (!isTablet) {
    return (
      <View style={[styles.mobileRoot, { backgroundColor: tk.bg }, style]}>
        {children}
      </View>
    );
  }

  // Tablet / desktop layout
  const showRail = showNav && !hideRail && isWide;

  return (
    <View style={[styles.root, { backgroundColor: tk.bg }]}>
      {/* Max-width centering wrapper */}
      <View style={styles.maxWidth}>
        {showNav && <SideNav />}

        {/* Main content column */}
        <View style={[
          styles.main,
          { borderColor: tk.border },
          isDesktop && styles.mainDesktop,
        ]}>
          {children}
        </View>

        {showRail && <RightRail />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileRoot: { flex: 1 },
  root: { flex: 1 },
  maxWidth: {
    flex: 1,
    flexDirection: "row",
    alignSelf: "center",
    width: "100%",
    maxWidth: 1280,
  },
  main: {
    flex: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    // Tablet: centre the feed column with a max-width feel
    maxWidth: 640,
  },
  mainDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
});
