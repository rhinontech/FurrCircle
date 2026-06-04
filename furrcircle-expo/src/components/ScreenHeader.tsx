import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "../lib/theme";
import { useTokens } from "../lib/theme-store";
import { useBreakpoint } from "../lib/breakpoints";

type Props = {
  title: string;
  right?: React.ReactNode;
  /** Show the back chevron. Defaults true on mobile, false on tablet (side nav handles nav). */
  showBack?: boolean;
  /** Optional custom back handler. If not provided, uses router.back() */
  onBack?: () => void;
};

export function ScreenHeader({ title, right, showBack, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tk = useTokens();
  const { isTablet } = useBreakpoint();

  // Default: show back on mobile, hide on tablet
  const shouldShowBack = showBack ?? !isTablet;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top + 8, backgroundColor: tk.bg },
      isTablet && styles.containerTablet,
    ]}>
      {shouldShowBack ? (
        <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: tk.card }]}>
          <ChevronLeft size={24} color={tk.text} strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtn} />
      )}

      <Text style={[styles.title, { color: tk.text }]} numberOfLines={1}>{title}</Text>

      <View style={styles.rightSlot}>{right ?? <View style={styles.backBtn} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  containerTablet: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },
  rightSlot: {
    minWidth: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
