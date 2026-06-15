import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heart, MessageCircle, Bell, Check, X } from "./ui/icons";
import { useTokens } from "../lib/theme-store";
import { colors } from "../lib/theme";
import { useToastStore, TOAST_MAX_VISIBLE, type ToastItem, type ToastVariant } from "../lib/toast-store";

const variantIcon = (variant: ToastVariant | undefined, tint: string) => {
  switch (variant) {
    case "like": return <Heart size={18} color={tint} fill={tint} />;
    case "comment": return <MessageCircle size={18} color={tint} />;
    case "match": return <Text style={{ fontSize: 16 }}>🐾</Text>;
    case "success": return <Check size={18} color={tint} strokeWidth={3} />;
    default: return <Bell size={18} color={tint} />;
  }
};

const variantTint = (variant: ToastVariant | undefined) => {
  switch (variant) {
    case "like": return colors.coral;
    case "error": return colors.coral;
    case "success": return colors.success;
    default: return colors.primary;
  }
};

function ToastBanner({ item }: { item: ToastItem }) {
  const tk = useTokens();
  const dismiss = useToastStore((s) => s.dismiss);
  const anim = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => dismiss(item.id));
  };

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 9, tension: 70 }).start();
    const t = setTimeout(close, item.duration ?? 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tint = variantTint(item.variant);

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: tk.card, borderColor: tk.border },
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bannerInner}
        activeOpacity={0.85}
        onPress={() => { item.onPress?.(); close(); }}
      >
        <View style={[styles.iconWrap, { backgroundColor: tint + "1A" }]}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            variantIcon(item.variant, tint)
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: tk.text }]} numberOfLines={1}>{item.title}</Text>
          {item.message ? (
            <Text style={[styles.message, { color: tk.textMuted }]} numberOfLines={1}>{item.message}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.closeBtn}>
          <X size={16} color={tk.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((s) => s.toasts);
  const visible = toasts.slice(0, TOAST_MAX_VISIBLE);

  if (visible.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
      {visible.map((item) => (
        <ToastBanner key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    gap: 8,
  },
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bannerInner: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  title: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  message: { fontFamily: "Inter_400Regular", fontSize: 12.5, marginTop: 1 },
  closeBtn: { padding: 2 },
});
