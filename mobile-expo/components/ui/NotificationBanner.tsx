import React, { useEffect, useState } from "react";
import { View, Text, Animated, Pressable, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Bell, X } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";

const { width } = Dimensions.get("window");

export default function NotificationBanner() {
  const { colors } = useTheme();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const translateY = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    // Mock notification trigger after 2 seconds
    const timer = setTimeout(() => {
      showNotification();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const showNotification = () => {
    setVisible(true);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();

    // Auto-hide after 6 seconds
    setTimeout(() => {
      hideNotification();
    }, 6000);
  };

  const hideNotification = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY }],
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        }
      ]}
    >
      <Pressable
        onPress={() => {
          hideNotification();
          router.push('/notifications');
        }}
        style={styles.content}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.brand + '15' }]}>
          <Bell size={20} color={colors.brand} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>New Community Event!</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>"Puppy Social Mixer" is happening on April 15. Tap to see details.</Text>
        </View>
        <Pressable onPress={hideNotification} style={styles.closeButton}>
          <X size={18} color={colors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  }
});
