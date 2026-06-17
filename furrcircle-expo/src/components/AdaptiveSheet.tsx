import { Modal, View, Pressable, StyleSheet, DimensionValue, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { useBreakpoint } from "../lib/breakpoints";
import { useTokens } from "../lib/theme-store";
import { useState, useEffect } from "react";

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      setKeyboardVisible(false);
      return;
    }

    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [visible]);

  if (isTablet) {
    // Desktop: centered dialog, fade in, click outside to close
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.overlayCenter} onPress={onClose}>
          <Pressable
            style={[styles.dialog, { maxWidth, maxHeight, backgroundColor: tk.glassStrong, borderWidth: 1, borderColor: tk.glassBorder }]}
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.overlayMobile} onPress={onClose}>
          <View
            style={[styles.sheet, { backgroundColor: tk.glassStrong, borderWidth: 1, borderBottomWidth: 0, borderColor: tk.glassBorder, maxHeight }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.handle, { backgroundColor: tk.textMuted }]} />
            {children}
          </View>
        </Pressable>
      </KeyboardAvoidingView>
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
  },
});
