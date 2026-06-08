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
import { useBreakpoint } from "../src/lib/breakpoints";
import { SideNav } from "../src/components/SideNav";
import { RightRail } from "../src/components/RightRail";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { notificationApi } from "../services/notification/notificationApi";
import { socketService } from "../services/socket/socketService";
import { useNotificationStore } from "../src/lib/notification-store";
import type { AppNotification, UnreadCounts } from "../services/notification/notificationApi";
import { Alert } from "react-native";

// Safe dynamic import for Firebase messaging
const getMessaging = () => {
  if (Constants.appOwnership === 'expo' || Platform.OS === 'web') return null;
  try {
    return require("@react-native-firebase/messaging").default;
  } catch {
    return null;
  }
};

// Register background handler early
const messaging = getMessaging();
if (messaging) {
  messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
    console.log("Message handled in the background!", remoteMessage);
  });
}

const queryClient = new QueryClient();

// Helper to handle routing based on FCM payload
const handleNotificationRedirect = (remoteMessage: any, router: any) => {
  if (!remoteMessage?.data) return;
  const { actionType, actionPayload: actionPayloadStr, relatedId } = remoteMessage.data;
  
  let actionPayload: any = {};
  try {
    if (actionPayloadStr) {
      actionPayload = JSON.parse(actionPayloadStr);
    }
  } catch (e) {}

  if (actionType === 'chat_thread') {
    const chatId = actionPayload.conversationId || actionPayload.id || relatedId;
    if (chatId) {
      router.push(`/chat?id=${chatId}`);
    } else {
      router.push('/chat');
    }
  } else if (actionType === 'like' || actionType === 'comment' || actionType === 'post_detail' || actionType === 'comment_detail') {
    const postId = actionPayload.postId || relatedId;
    if (postId) router.push(`/post/${postId}`);
  } else if (actionType === 'profile' || actionType === 'user_profile') {
    const handle = actionPayload.username || actionPayload.id || actionPayload.userId || relatedId;
    if (handle) router.push(`/u/${handle}`);
  } else if (actionType === 'event_detail') {
    const eventId = actionPayload.eventId || actionPayload.id || relatedId;
    if (eventId) {
      router.push(`/events?eventId=${eventId}`);
    } else {
      router.push('/events');
    }
  } else if (actionType === 'events_list') {
    router.push('/events');
  } else if (actionType === 'question_detail' || actionType === 'thread') {
    const questionId = actionPayload.questionId || actionPayload.id || relatedId;
    if (questionId) {
      router.push(`/thread/${questionId}`);
    } else {
      router.push('/notifications');
    }
  } else if (actionType === 'reminder' || actionType === 'vaccine' || actionType === 'medication') {
    router.push('/today');
  } else if (actionType === 'appointment_detail') {
    const appointmentId = actionPayload.appointmentId || relatedId;
    if (appointmentId) {
      router.push(`/book?id=${appointmentId}`);
    } else {
      router.push('/book');
    }
  } else if (actionType === 'discover') {
    router.push('/discover');
  } else if (actionType === 'community') {
    router.push('/community');
  } else {
    // Default fallback
    router.push('/notifications');
  }
};

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
  const { isTablet } = useBreakpoint();

  const { isWide } = useBreakpoint();
  const AUTH_SCREENS = ["login", "signup", "otp-verify", "forgot-password", "onboarding"];
  const isAuthScreen = AUTH_SCREENS.includes(segments[0] || "");
  const showSideNav = isTablet && !!user && !isAuthScreen;
  const showRightRail = isWide && !!user && !isAuthScreen;

  const setUnreadCounts = useNotificationStore((s) => s.setUnreadCounts);
  const prependNotification = useNotificationStore((s) => s.prependNotification);
  const incrementChatUnread = useNotificationStore((s) => s.incrementChatUnread);

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
        const token = Platform.OS === 'web'
          ? useAuthStore.getState().user?.token ?? null
          : await SecureStore.getItemAsync("token");
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

        const unsubChat = socketService.on<any>(
          "chat:message",
          () => {
            // Increment the chat badge when a new message arrives
            incrementChatUnread();
          }
        );

        // Store cleanup refs on the cancel closure
        return () => {
          unsubNew();
          unsubCounts();
          unsubChat();
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
  useEffect(() => {
    if (!user) return;
    const bootstrapPush = async () => {
      try {
        const messaging = getMessaging();
        if (!messaging) return;

        // Check the existing permission status — the login screen may have already prompted.
        // Only request again if the status is not yet determined (first launch before login screen ran).
        let authStatus = await messaging().hasPermission();
        const alreadyEnabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!alreadyEnabled) {
          // If still undetermined, request now (e.g. if user skipped the login screen quickly)
          authStatus = await messaging().requestPermission();
        }

        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) return;

        const fcmToken = await messaging().getToken();
        let installationId = await SecureStore.getItemAsync("push_installation_id");
        if (!installationId) {
          installationId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          await SecureStore.setItemAsync("push_installation_id", installationId);
        }
        let pushPref = true;
        try {
          const storedPref = await SecureStore.getItemAsync("push_notifications_enabled");
          if (storedPref !== null) {
            pushPref = storedPref === "true";
          }
        } catch (e) {}

        await notificationApi.registerDevice({
          installationId,
          expoPushToken: fcmToken,
          platform: Platform.OS as "ios" | "android",
          pushEnabled: pushPref,
        });

        // Listen for foreground messages
        const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
          console.log("A new FCM message arrived!", JSON.stringify(remoteMessage));
          if (remoteMessage.notification) {
            Alert.alert(
              remoteMessage.notification.title || "New Notification",
              remoteMessage.notification.body || "",
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'View', onPress: () => handleNotificationRedirect(remoteMessage, router) }
              ]
            );
          }
        });
        
        // Listen for background clicks (app running in background)
        messaging().onNotificationOpenedApp((remoteMessage: any) => {
          console.log("Notification caused app to open from background state:", remoteMessage.notification);
          handleNotificationRedirect(remoteMessage, router);
        });

        // Check for killed-state clicks (app completely closed)
        messaging().getInitialNotification().then((remoteMessage: any) => {
          if (remoteMessage) {
            console.log("Notification caused app to open from quit state:", remoteMessage.notification);
            // Slight delay ensures the root layout and router are fully mounted before pushing
            setTimeout(() => {
              handleNotificationRedirect(remoteMessage, router);
            }, 1000);
          }
        });
        
        return unsubscribe;
      } catch (err) {
        console.warn("[Push] Bootstrap failed:", err);
      }
    };
    let unsubForeground: any;
    bootstrapPush().then(unsub => { unsubForeground = unsub; });
    return () => {
      if (unsubForeground && typeof unsubForeground === 'function') {
        unsubForeground();
      }
    };
  }, [user?.id]);


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

  const stackScreens = (
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
      <Stack.Screen name="event/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="lost" options={{ presentation: "card" }} />
      <Stack.Screen name="memory" options={{ presentation: "card" }} />
      <Stack.Screen name="book" options={{ presentation: "card" }} />
      <Stack.Screen name="reels" options={{ presentation: "card" }} />
      <Stack.Screen name="chat" options={{ presentation: "card" }} />
      <Stack.Screen name="blocked-accounts" options={{ presentation: "card" }} />
      <Stack.Screen name="compose" options={{ presentation: "card" }} />
      <Stack.Screen name="add-pet" options={{ presentation: "card" }} />
      <Stack.Screen name="edit-pet" options={{ presentation: "card" }} />
      <Stack.Screen name="ask" options={{ presentation: "card" }} />
      <Stack.Screen name="user/followers" options={{ presentation: "card" }} />
      <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="login" options={{ presentation: "card" }} />
      <Stack.Screen name="signup" options={{ presentation: "card" }} />
      <Stack.Screen name="otp-verify" options={{ presentation: "card" }} />
      <Stack.Screen name="forgot-password" options={{ presentation: "card" }} />
    </Stack>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: tokens.bg }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={dark ? "light" : "dark"} />
        {showSideNav ? (
          <View style={{ flex: 1, flexDirection: "row" }}>
            <SideNav />
            <View style={{ flex: 1, alignItems: "center" }}>
              <View style={{ flex: 1, width: "100%", maxWidth: 680 }}>
                {stackScreens}
              </View>
            </View>
            {showRightRail && (
              <View style={{ width: 300, flexShrink: 0, borderLeftWidth: 1, borderLeftColor: tokens.border }}>
                <RightRail />
              </View>
            )}
          </View>
        ) : (
          stackScreens
        )}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
