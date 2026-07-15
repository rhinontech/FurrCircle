/**
 * Wraps any pushed screen (non-tab) so it:
 *  - Uses the correct dark/light background with the ambient glass backdrop
 *  - On tablet centres content with max-width 680px
 */
import { View, StyleSheet, ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useTokens } from "../lib/theme-store";
import { useBreakpoint } from "../lib/breakpoints";
import { AmbientBackground } from "./ui/AmbientBackground";

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
  noAmbient?: boolean;
}

export function PageContainer({ children, style, fullWidth = false, noAmbient = false }: Props) {
  const tk = useTokens();
  const { isTablet } = useBreakpoint();

  return (
    <View style={[styles.root, { backgroundColor: tk.bg }, style]}>
      {!noAmbient && <AmbientBackground />}
      <View style={[styles.inner, isTablet && !fullWidth && styles.innerTablet]}>
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
