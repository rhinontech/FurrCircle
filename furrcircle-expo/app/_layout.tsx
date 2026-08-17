import "../src/global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { Fredoka_400Regular, Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Platform } from "react-native";
import { useEffect, useRef } from "react";
import { useThemeStore, useTokens } from "../src/lib/theme-store";
import { useAuthStore } from "../src/lib/auth-store";
import { useBreakpoint } from "../src/lib/breakpoints";
import { SideNav } from "../src/components/SideNav";
import { RightRail } from "../src/components/RightRail";
import { AmbientBackground } from "../src/components/ui/AmbientBackground";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { notificationApi } from "../services/notification/notificationApi";
import { socketService } from "../services/socket/socketService";
import { useNotificationStore } from "../src/lib/notification-store";
import type { AppNotification, UnreadCounts } from "../services/notification/notificationApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocationSync } from "../src/components/LocationSync";
import { ToastHost } from "../src/components/ToastHost";
import { toast } from "../src/lib/toast-store";
import { navigateForNotification } from "../src/lib/notification-nav";
import { usePostEngagementStore } from "../src/lib/post-engagement-store";
import { LanguageProvider } from "../src/lib/language-context";

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
  } catch (e) { }

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
  } else if (actionType === 'match_requests' || actionType === 'adoption_application') {
    router.push('/notifications?openRequests=true');
  } else {
    // Default fallback
    router.push('/notifications');
  }
};

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Fredoka_400Regular,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  const load = useThemeStore((s) => s.load);
  const dark = useThemeStore((s) => s.dark);
  const tokens = useTokens();

  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const justSignedUp = useAuthStore((s) => s.justSignedUp);
  const router = useRouter();
  const segments = useSegments();
  const { isTablet, isDesktop, isWide } = useBreakpoint();
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

    let isActive = true;
    let unsubscribes: Array<() => void> = [];

    const bootstrap = async () => {
      try {
        const token = Platform.OS === 'web'
          ? useAuthStore.getState().user?.token ?? null
          : await SecureStore.getItemAsync("token");
        if (!token || !isActive) return;

        socketService.connect(token);

        // Pull the initial unread counts via REST so the badge is accurate
        // even before the first socket event arrives.
        try {
          const counts = await notificationApi.getUnreadCounts();
          if (isActive) setUnreadCounts(counts);
        } catch {
          // non-fatal — WS will sync counts on next notification
        }

        if (!isActive) return;

        // Register WebSocket event handlers
        const unsubNew = socketService.on<AppNotification>(
          "notification:new",
          (notif) => {
            prependNotification(notif);
            // Surface it as a non-blocking banner that stacks/queues.
            const variant =
              notif.type === "like" ? "like"
                : notif.type === "comment" ? "comment"
                  : notif.type === "match" ? "match"
                    : "info";
            toast.show({
              id: notif.id,
              title: notif.title,
              message: notif.message,
              variant,
              onPress: () => {
                if (!navigateForNotification(notif, router)) router.push("/notifications");
              },
            });
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

        // Realtime post engagement counts (likes / comments / shares)
        const unsubPost = socketService.on<{ postId: string; likeCount: number; commentCount: number; shareCount: number }>(
          "post:update",
          ({ postId, likeCount, commentCount, shareCount }) => {
            usePostEngagementStore.getState().setCounts(postId, { likeCount, commentCount, shareCount });
          }
        );

        if (isActive) {
          unsubscribes.push(unsubNew, unsubCounts, unsubChat, unsubPost);
        } else {
          // Clean up immediately if effect has cleaned up while bootstrap was running
          unsubNew();
          unsubCounts();
          unsubChat();
          unsubPost();
        }
      } catch (err) {
        console.warn("[Socket] Bootstrap failed:", err);
      }
    };

    bootstrap();

    return () => {
      isActive = false;
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user?.id]);

  // ── Push notification bootstrap ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let isActive = true;
    let unsubscribe: (() => void) | null = null;

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
        if (!enabled || !isActive) return;

        const fcmToken = await messaging().getToken();
        if (!isActive) return;

        let installationId = await SecureStore.getItemAsync("push_installation_id");
        if (!installationId && isActive) {
          installationId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          await SecureStore.setItemAsync("push_installation_id", installationId);
        }
        let pushPref = true;
        try {
          const storedPref = await SecureStore.getItemAsync("push_notifications_enabled");
          if (storedPref !== null) {
            pushPref = storedPref === "true";
          }
        } catch (e) { }

        if (!isActive) return;

        await notificationApi.registerDevice({
          installationId: installationId!,
          expoPushToken: fcmToken,
          platform: Platform.OS as "ios" | "android",
          pushEnabled: pushPref,
        });

        if (!isActive) return;

        // Listen for foreground messages
        const unsub = messaging().onMessage(async (remoteMessage: any) => {
          console.log("A new FCM message arrived!", JSON.stringify(remoteMessage));
          if (!remoteMessage) return;
          const title = remoteMessage.notification?.title || remoteMessage.data?.title || "New Notification";
          const body = remoteMessage.notification?.body || remoteMessage.data?.body || "";
          const notificationId = remoteMessage.data?.notificationId;
          // Non-blocking in-app banner instead of a full-screen Alert popup.
          toast.show({
            id: notificationId,
            title,
            message: body,
            onPress: () => handleNotificationRedirect(remoteMessage, router),
          });
        });

        // Listen for background clicks (app running in background)
        messaging().onNotificationOpenedApp((remoteMessage: any) => {
          console.log("Notification caused app to open from background state:", remoteMessage.notification);
          handleNotificationRedirect(remoteMessage, router);
        });

        // Check for killed-state clicks (app completely closed)
        messaging().getInitialNotification().then((remoteMessage: any) => {
          if (remoteMessage && isActive) {
            console.log("Notification caused app to open from quit state:", remoteMessage.notification);
            // Slight delay ensures the root layout and router are fully mounted before pushing
            setTimeout(() => {
              if (isActive) handleNotificationRedirect(remoteMessage, router);
            }, 1000);
          }
        });

        if (isActive) {
          unsubscribe = unsub;
        } else {
          unsub();
        }
      } catch (err) {
        console.warn("[Push] Bootstrap failed:", err);
      }
    };

    bootstrapPush();

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.id]);


  // Auth guard: redirect based on login state once both fonts + auth are ready
  useEffect(() => {
    if (!fontsLoaded || authLoading) return;
    const firstSegment = (segments[0] || "") as string;
    const inAuthGroup = ["login", "signup", "otp-verify", "forgot-password"].includes(firstSegment);
    const isOnboarding = firstSegment === "onboarding";

    if (Platform.OS === 'web') {
      const isWebLandingRoute = firstSegment === "web";
      if (!user) {
        if (!isWebLandingRoute && !inAuthGroup) {
          router.replace("/web" as any);
        }
      } else {
        if (isWebLandingRoute || inAuthGroup || isOnboarding || firstSegment === "") {
          if (user.hasCompletedOnboarding === false) {
            router.replace("/onboarding");
          } else {
            router.replace("/(tabs)");
          }
        }
      }
    } else {
      // Mobile flow
      const isWebLandingRoute = firstSegment === "web";
      if (isWebLandingRoute) {
        if (user) {
          router.replace(user.hasCompletedOnboarding === false ? "/onboarding" : "/(tabs)");
        } else {
          router.replace("/login");
        }
      } else if (!user && !inAuthGroup) {
        router.replace("/login");
      } else if (user) {
        if (user.hasCompletedOnboarding === false) {
          if (!isOnboarding) {
            router.replace("/onboarding");
          }
        } else {
          if (inAuthGroup || isOnboarding) {
            router.replace("/(tabs)");
          }
        }
      }
    }
  }, [user, authLoading, fontsLoaded, segments]);

  if (!fontsLoaded || authLoading) return <View style={{ flex: 1, backgroundColor: "#F7F8FA" }} />;

  const stackScreens = (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.bg, paddingBottom: Platform.OS === 'ios' ? 0 : insets.bottom } }}>
      <Stack.Screen name="(tabs)" options={{ contentStyle: { paddingBottom: 0 } }} />
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
      <Stack.Screen name="add-circle" options={{ presentation: "card" }} />
      <Stack.Screen name="edit-pet" options={{ presentation: "card" }} />
      <Stack.Screen name="ask" options={{ presentation: "card" }} />
      <Stack.Screen name="user/followers" options={{ presentation: "card" }} />
      <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
      <Stack.Screen name="login" options={{ presentation: "card" }} />
      <Stack.Screen name="signup" options={{ presentation: "card" }} />
      <Stack.Screen name="otp-verify" options={{ presentation: "card" }} />
      <Stack.Screen name="forgot-password" options={{ presentation: "card" }} />
    </Stack>
  );

  return (
    <LanguageProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: tokens.bg }}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={dark ? "light" : "dark"} />
          <LocationSync />
          {showSideNav ? (
            // Desktop / tablet: ambient backdrop + a centred 3-column cluster so the
            // sidebar sits flush against the feed (no left gap) with balanced margins.
            <View style={{ flex: 1, backgroundColor: tokens.bg }}>
              <AmbientBackground />
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flex: 1,
                    width: "100%",
                    maxWidth: showRightRail ? '100%' : '100%',
                    flexDirection: "row",

                  }}
                >
                  <View style={{ backgroundColor:'white' }}>
                    <SideNav />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    {stackScreens}
                  </View>
                  {showRightRail && (
                    <View style={{ width: 320, flexShrink: 0, borderLeftWidth: 1, borderLeftColor: tokens.border }}>
                      <RightRail />
                    </View>
                  )}
                </View>
              </View>
            </View>
          ) : (
            stackScreens
          )}
          <ToastHost />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </LanguageProvider>
  );
}
