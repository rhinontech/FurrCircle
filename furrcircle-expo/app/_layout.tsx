import "../src/global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Platform } from "react-native";
import { useEffect, useRef } from "react";
import { useThemeStore, useTokens } from "../src/lib/theme-store";
import { useAuthStore } from "../src/lib/auth-store";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { notificationApi } from "../services/notification/notificationApi";
import { socketService } from "../services/socket/socketService";
import { useNotificationStore } from "../src/lib/notification-store";
import type { AppNotification, UnreadCounts } from "../services/notification/notificationApi";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const load = useThemeStore((s) => s.load);
  const dark = useThemeStore((s) => s.dark);
  const tokens = useTokens();

  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const router = useRouter();
  const segments = useSegments();

  const setUnreadCounts = useNotificationStore((s) => s.setUnreadCounts);
  const prependNotification = useNotificationStore((s) => s.prependNotification);

  useEffect(() => { load(); hydrate(); }, []);

  // ── WebSocket connection lifecycle ─────────────────────────────────────────
  // Connect when the user logs in, disconnect when they log out.
  // Handlers registered here keep the global badge count and realtime
  // notification list in sync for the entire app session.
  useEffect(() => {
    if (!user) {
      // User logged out — close socket
      socketService.disconnect();
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token || cancelled) return;

        socketService.connect(token);

        // Pull the initial unread counts via REST so the badge is accurate
        // even before the first socket event arrives.
        try {
          const counts = await notificationApi.getUnreadCounts();
          if (!cancelled) setUnreadCounts(counts);
        } catch {
          // non-fatal — WS will sync counts on next notification
        }

        // Register WebSocket event handlers
        const unsubNew = socketService.on<AppNotification>(
          "notification:new",
          (notif) => {
            prependNotification(notif);
          }
        );

        const unsubCounts = socketService.on<UnreadCounts>(
          "notification:counts",
          (counts) => {
            setUnreadCounts(counts);
          }
        );

        // Store cleanup refs on the cancel closure
        return () => {
          unsubNew();
          unsubCounts();
        };
      } catch (err) {
        console.warn("[Socket] Bootstrap failed:", err);
      }
    };

    let cleanup: (() => void) | undefined;
    bootstrap().then((fn) => { cleanup = fn; });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user?.id]);

  // ── Push notification bootstrap ─────────────────────────────────────────────
  // Uncomment when Firebase Messaging native module is configured:
  // useEffect(() => {
  //   if (!user) return;
  //   const bootstrapPush = async () => {
  //     try {
  //       const authStatus = await messaging().requestPermission();
  //       const enabled =
  //         authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //         authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  //       if (!enabled) return;
  //       const fcmToken = await messaging().getToken();
  //       let installationId = await SecureStore.getItemAsync("push_installation_id");
  //       if (!installationId) {
  //         installationId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  //         await SecureStore.setItemAsync("push_installation_id", installationId);
  //       }
  //       await notificationApi.registerDevice({
  //         installationId,
  //         expoPushToken: fcmToken,
  //         platform: Platform.OS as "ios" | "android",
  //         pushEnabled: true,
  //       });
  //     } catch (err) {
  //       console.warn("[Push] Bootstrap failed:", err);
  //     }
  //   };
  //   bootstrapPush();
  // }, [user?.id]);

  // Auth guard: redirect based on login state once both fonts + auth are ready
  useEffect(() => {
    if (!fontsLoaded || authLoading) return;
    const inAuthGroup = ["login", "signup", "otp-verify", "forgot-password"].includes(segments[0] || "");
    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, authLoading, fontsLoaded, segments]);

  if (!fontsLoaded || authLoading) return <View style={{ flex: 1, backgroundColor: "#F7F8FA" }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: tokens.bg }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={dark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="post/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="thread/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="community/[slug]" options={{ presentation: "card" }} />
          <Stack.Screen name="u/[handle]" options={{ presentation: "card" }} />
          <Stack.Screen name="p/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="pet" options={{ presentation: "card" }} />
          <Stack.Screen name="records" options={{ presentation: "card" }} />
          <Stack.Screen name="care" options={{ presentation: "card" }} />
          <Stack.Screen name="log/vitals" options={{ presentation: "card" }} />
          <Stack.Screen name="log/meds" options={{ presentation: "card" }} />
          <Stack.Screen name="log/vaccine" options={{ presentation: "card" }} />
          <Stack.Screen name="notifications" options={{ presentation: "card" }} />
          <Stack.Screen name="settings" options={{ presentation: "card" }} />
          <Stack.Screen name="today" options={{ presentation: "card" }} />
          <Stack.Screen name="events" options={{ presentation: "card" }} />
          <Stack.Screen name="lost" options={{ presentation: "card" }} />
          <Stack.Screen name="memory" options={{ presentation: "card" }} />
          <Stack.Screen name="book" options={{ presentation: "card" }} />
          <Stack.Screen name="reels" options={{ presentation: "card" }} />
          <Stack.Screen name="chat" options={{ presentation: "card" }} />
          <Stack.Screen name="compose" options={{ presentation: "modal" }} />
          <Stack.Screen name="add-pet" options={{ presentation: "modal" }} />
          <Stack.Screen name="ask" options={{ presentation: "modal" }} />
          <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="login" options={{ presentation: "card" }} />
          <Stack.Screen name="signup" options={{ presentation: "card" }} />
          <Stack.Screen name="otp-verify" options={{ presentation: "card" }} />
          <Stack.Screen name="forgot-password" options={{ presentation: "card" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
