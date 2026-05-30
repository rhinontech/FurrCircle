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
import messaging from "@react-native-firebase/messaging";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { notificationApi } from "../services/notification/notificationApi";

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

  useEffect(() => { load(); hydrate(); }, []);

  // ── Push notification bootstrap ─────────────────────────────────────────────
  // Run only once after the user is authenticated
  useEffect(() => {
    if (!user) return;

    const bootstrapPush = async () => {
      try {
        // 1. Request permission (iOS prompts; Android 13+ also needs this)
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log("[Push] Permission denied");
          return;
        }

        // 2. Get FCM token
        const fcmToken = await messaging().getToken();
        console.log("[Push] FCM token:", fcmToken?.slice(0, 20) + "...");

        // 3. Stable installation ID (persisted across app restarts)
        let installationId = await SecureStore.getItemAsync("push_installation_id");
        if (!installationId) {
          installationId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          await SecureStore.setItemAsync("push_installation_id", installationId);
        }

        // 4. Register device with backend
        await notificationApi.registerDevice({
          installationId,
          expoPushToken: fcmToken,
          platform: Platform.OS as "ios" | "android",
          pushEnabled: true,
        });

        console.log("[Push] Device registered");
      } catch (err) {
        console.warn("[Push] Bootstrap failed:", err);
      }
    };

    bootstrapPush();
  }, [user?.id]); // Re-run only if the logged-in user changes

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
