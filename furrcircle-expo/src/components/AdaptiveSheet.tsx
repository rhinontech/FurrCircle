import { Modal, View, Pressable, StyleSheet, DimensionValue } from "react-native";
import { useBreakpoint } from "../lib/breakpoints";
import { useTokens } from "../lib/theme-store";

interface AdaptiveSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
  maxHeight?: DimensionValue;
}

export function AdaptiveSheet({
  visible,
  onClose,
  children,
  maxWidth = 480,
  maxHeight = "90%",
}: AdaptiveSheetProps) {
  const { isTablet } = useBreakpoint();
  const tk = useTokens();

  if (isTablet) {
    // Desktop: centered dialog, fade in, click outside to close
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.overlayCenter} onPress={onClose}>
          <Pressable
            style={[styles.dialog, { maxWidth, maxHeight, backgroundColor: tk.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            {children}
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // Mobile: slide-up bottom sheet
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlayMobile} onPress={onClose}>
        <View
          style={[styles.sheet, { backgroundColor: tk.card, maxHeight }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.handle, { backgroundColor: tk.textMuted }]} />
          {children}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayMobile: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  overlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    width: "100%",
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
    opacity: 0.25,
  },
  dialog: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
});
