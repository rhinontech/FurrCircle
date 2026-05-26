/**
 * Wraps any pushed screen (non-tab) so it:
 *  - Uses the correct dark/light background
 *  - On tablet centres content with max-width 680px
 */
import { View, StyleSheet, ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useTokens } from "../lib/theme-store";
import { useBreakpoint } from "../lib/breakpoints";

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export function PageContainer({ children, style }: Props) {
  const tk = useTokens();
  const { isTablet } = useBreakpoint();

  return (
    <View style={[styles.root, { backgroundColor: tk.bg }, style]}>
      <View style={[styles.inner, isTablet && styles.innerTablet]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
  innerTablet: {
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
});
