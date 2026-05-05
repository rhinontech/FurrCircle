import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
// Dynamically require to prevent crash on Line 4 in Expo Go
const getNotifications = () => {
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
};
const Notifications = getNotifications();
import Constants from 'expo-constants';
import { io, type Socket } from 'socket.io-client';
import { useRouter } from 'expo-router';
import { userCommunityApi } from '@/services/users/communityApi';
import { userNotificationsApi, type NotificationCategory, type NotificationCounts } from '@/services/users/notificationsApi';
import { navigateFromNotification } from '@/services/users/notificationRouting';
const getMessaging = () => {
  if (Constants.appOwnership === 'expo') return null;
  try {
    return require('@react-native-firebase/messaging').default;
  } catch {
    return null;
  }
};
import { registerForPushNotificationsAsync } from '@/services/fcmService';
import { getApiRootUrl } from '@/services/api';
import { useAuth } from './AuthContext';

// Only set the handler if we are not in Expo Go or if explicitly supported
if (Constants.appOwnership !== 'expo' && Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const SEEN_KEY = 'chat_last_seen';
const INSTALLATION_KEY = 'notification_installation_id';
const POLL_INTERVAL = 30_000;

interface NotificationContextValue {
  activityUnreadCount: number;
  campaignUnreadCount: number;
  chatUnreadCount: number;
  notifUnreadCount: number;
  unreadCount: number;
  pushEnabled: boolean;
  marketingEnabled: boolean;
  notificationVersion: number;
  markChatsRead: () => Promise<void>;
  markNotifsRead: (category?: NotificationCategory) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshNotifCount: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
  setPushNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setMarketingEnabled: (enabled: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  activityUnreadCount: 0,
  campaignUnreadCount: 0,
  chatUnreadCount: 0,
  notifUnreadCount: 0,
  unreadCount: 0,
  pushEnabled: false,
  marketingEnabled: true,
  notificationVersion: 0,
  markChatsRead: async () => {},
  markNotifsRead: async () => {},
  markAllRead: async () => {},
  refreshNotifCount: async () => {},
  refreshPreferences: async () => {},
  setPushNotificationsEnabled: async () => {},
  setMarketingEnabled: async () => {},
});

const getInstallationId = async () => {
  const existing = await AsyncStorage.getItem(INSTALLATION_KEY);
  if (existing) return existing;
  const next = `install_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(INSTALLATION_KEY, next);
  return next;
};

const getExpoProjectId = () =>
  (Constants.expoConfig?.extra as any)?.eas?.projectId
  || (Constants as any).easConfig?.projectId
  || (Constants.expoConfig as any)?.extra?.projectId
  || null;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [activityUnreadCount, setActivityUnreadCount] = useState(0);
  const [campaignUnreadCount, setCampaignUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabledState] = useState(true);
  const [notificationVersion, setNotificationVersion] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);
  const socketRef = useRef<Socket | null>(null);
  const responseListenerRef = useRef<any>(null);
  const lastProcessedNotifId = useRef<string | null>(null);
  const [pendingNotification, setPendingNotification] = useState<any>(null);

  const getSeenMap = async (): Promise<Record<string, string>> => {
    try {
      const raw = await AsyncStorage.getItem(SEEN_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveSeenMap = async (map: Record<string, string>) => {
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(map));
  };

  const refreshChatCount = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const chats = await userCommunityApi.getChats();
      const seenMap = await getSeenMap();
      let newCount = 0;
      for (const chat of chats) {
        const lastMsg = chat.lastMessage;
        if (!lastMsg) continue;
        const lastSeenAt = seenMap[chat.id];
        const lastMsgAt = lastMsg.createdAt || lastMsg.created_at || '';
        if (!lastMsgAt) continue;
        if (!lastSeenAt || new Date(lastMsgAt) > new Date(lastSeenAt)) {
          newCount++;
        }
      }
      setChatUnreadCount(newCount);
    } catch {
      // silent
    }
  }, [isLoggedIn]);

  const applyCounts = useCallback((counts: NotificationCounts) => {
    setActivityUnreadCount(counts.activity ?? 0);
    setCampaignUnreadCount(counts.campaign ?? 0);
  }, []);

  const refreshNotifCount = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      applyCounts(await userNotificationsApi.getUnreadCounts());
    } catch {
      // silent
    }
  }, [applyCounts, isLoggedIn]);

  const refreshPreferences = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const prefs = await userNotificationsApi.getPreferences();
      setMarketingEnabledState(prefs.marketingEnabled !== false);
    } catch {
      // silent
    }
  }, [isLoggedIn]);

  const syncPushPreference = useCallback(async () => {
    if (!isLoggedIn || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;

    try {
      if (!Notifications) return;
      const settings = await Notifications.getPermissionsAsync();
      const enabled = settings.granted || settings.ios?.status === 3; // 3 is PROVISIONAL
      setPushEnabled(enabled);
    } catch {
      setPushEnabled(false);
    }
  }, [isLoggedIn]);

  const registerDevice = useCallback(async (enabled: boolean) => {
    if (!isLoggedIn || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;

    try {
      const installationId = await getInstallationId();
      let expoPushToken: string | null = null;

      if (enabled && Notifications) {
        let settings = await Notifications.getPermissionsAsync();
        if (!settings.granted) {
          settings = await Notifications.requestPermissionsAsync();
        }

        enabled = settings.granted;
        if (enabled) {
          expoPushToken = await registerForPushNotificationsAsync();
          enabled = !!expoPushToken;
        }
      }

      await userNotificationsApi.registerDevice({
        installationId,
        expoPushToken,
        platform: Platform.OS,
        pushEnabled: enabled,
      });

      setPushEnabled(enabled);
    } catch {
      setPushEnabled(false);
    }
  }, [isLoggedIn]);

  const pollAll = useCallback(async () => {
    if (!isLoggedIn) return;
    await Promise.allSettled([
      refreshChatCount(), 
      refreshNotifCount(), 
      refreshPreferences(), 
      syncPushPreference(),
      registerDevice(true) // Ensure device is registered/updated periodically
    ]);
  }, [isLoggedIn, refreshChatCount, refreshNotifCount, refreshPreferences, syncPushPreference, registerDevice]);

  const markChatsRead = useCallback(async () => {
    try {
      const chats = await userCommunityApi.getChats();
      const seenMap: Record<string, string> = {};
      for (const chat of chats) {
        const lastMsg = chat.lastMessage;
        if (lastMsg) {
          seenMap[chat.id] = lastMsg.createdAt || lastMsg.created_at || new Date().toISOString();
        }
      }
      await saveSeenMap(seenMap);
      setChatUnreadCount(0);
    } catch {
      setChatUnreadCount(0);
    }
  }, []);

  const markNotifsRead = useCallback(async (category?: NotificationCategory) => {
    try {
      await userNotificationsApi.markAllRead(category);
      if (!category || category === 'activity') setActivityUnreadCount(0);
      if (!category || category === 'campaign') setCampaignUnreadCount(0);
    } finally {
      await refreshNotifCount();
    }
  }, [refreshNotifCount]);

  const markAllRead = useCallback(async () => {
    await Promise.allSettled([markChatsRead(), markNotifsRead()]);
  }, [markChatsRead, markNotifsRead]);

  const setPushNotificationsEnabled = useCallback(async (enabled: boolean) => {
    await registerDevice(enabled);
  }, [registerDevice]);

  const setMarketingEnabled = useCallback(async (enabled: boolean) => {
    await userNotificationsApi.updatePreferences({ marketingEnabled: enabled });
    setMarketingEnabledState(enabled);
  }, []);

  const handleResponse = useCallback((response: any) => {
    const rawData = response.notification?.request?.content?.data || {};
    
    // Robust data extraction: iOS/FCM sometimes nests data under a 'data' or 'body' key
    // or stringifies the entire payload.
    let data = { ...rawData };
    
    // Deep merge from common nested keys
    ['data', 'body', 'notification', 'aps'].forEach(key => {
      if (rawData[key] && typeof rawData[key] === 'object') {
        data = { ...data, ...rawData[key] };
      }
      // Handle cases where these keys might be stringified JSON
      if (typeof rawData[key] === 'string' && rawData[key].startsWith('{')) {
        try { data = { ...data, ...JSON.parse(rawData[key]) }; } catch {}
      }
    });

    // Also check for FCM flattened keys (e.g. "gcm.notification.actionType")
    Object.keys(rawData).forEach(key => {
      if (key.includes('.')) {
        const simpleKey = key.split('.').pop();
        if (simpleKey && !(simpleKey in data)) {
          data[simpleKey] = rawData[key];
        }
      }
    });

    // Log for debugging
    console.log('[NotificationContext] Handling response data:', JSON.stringify(data, null, 2));

    let actionPayload = data.actionPayload;
    if (typeof actionPayload === 'string' && actionPayload.startsWith('{')) {
      try {
        actionPayload = JSON.parse(actionPayload);
      } catch (e) {
        console.warn('[NotificationContext] Failed to parse actionPayload string', e);
      }
    }

    // On iOS, sometimes the navigation needs a tiny delay to ensure the router is fully ready 
    // during a cold start, though usually handled by the provider mount timing.
    const navigate = () => {
      navigateFromNotification(router, {
        actionType: typeof data.actionType === 'string' ? data.actionType : null,
        actionPayload: typeof actionPayload === 'object' && actionPayload ? actionPayload as Record<string, unknown> : null,
        relatedId: typeof data.relatedId === 'string' ? data.relatedId : (data.id ? String(data.id) : undefined),
      });
    };

    if (Platform.OS === 'ios') {
      // iOS often needs a longer delay on cold start to ensure the router is ready
      setTimeout(navigate, 500);
    } else {
      navigate();
    }
  }, [router]);

  useEffect(() => {
    // 1. Handle notification that opened the app (Cold Start)
    const handleColdStart = async () => {
      if (!Notifications) return;
      const response = await Notifications.getLastNotificationResponseAsync();
      if (!response) return;

      const id = response.notification.request.identifier;
      // GUARD: Prevent double-fires from cold start catch-up
      if (id && id === lastProcessedNotifId.current) return;
      if (id) lastProcessedNotifId.current = id;

      console.log('[NotificationContext] Cold start notification detected:', id);
      handleResponse(response);
    };

    handleColdStart();
  }, [handleResponse]);

  useEffect(() => {
    if (Notifications) {
      // 2. Listen for clicks while the app is in foreground/background
      responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    }

    const messaging = getMessaging();
    
    let unsubscribeForeground: () => void = () => {};
    
    if (messaging) {
      try {
        unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
          if (Notifications) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: remoteMessage.notification?.title || '',
                body: remoteMessage.notification?.body || '',
                data: remoteMessage.data || {},
              },
              trigger: null,
            });
          }
        });
      } catch (e) {
        console.warn("Firebase messaging error", e);
      }
    }

    return () => {
      responseListenerRef.current?.remove();
      unsubscribeForeground();
    };
  }, [router]);

  useEffect(() => {
    if (!isLoggedIn || !user?.token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(getApiRootUrl(), {
      auth: { token: user.token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('notification:counts', (counts: NotificationCounts) => {
      applyCounts(counts);
    });
    socket.on('notification:new', () => {
      setNotificationVersion((value) => value + 1);
      refreshNotifCount().catch(() => {});
    });
    socket.on('chat:unread', () => {
      refreshChatCount().catch(() => {});
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [applyCounts, isLoggedIn, refreshChatCount, refreshNotifCount, user?.token]);

  useEffect(() => {
    if (!isLoggedIn) {
      setChatUnreadCount(0);
      setActivityUnreadCount(0);
      setCampaignUnreadCount(0);
      setPushEnabled(false);
      setMarketingEnabledState(true);
      if (pollTimer.current) clearInterval(pollTimer.current);
      return;
    }

    // Trigger immediate sync on login
    pollAll();
    
    pollTimer.current = setInterval(pollAll, POLL_INTERVAL);

    const sub = AppState.addEventListener('change', (nextState) => {
      appState.current = nextState;
      if (nextState === 'active') pollAll();
    });

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      sub.remove();
    };
  }, [isLoggedIn, pollAll]);

  const notifUnreadCount = activityUnreadCount + campaignUnreadCount;
  const unreadCount = chatUnreadCount + notifUnreadCount;

  return (
    <NotificationContext.Provider value={{
      activityUnreadCount,
      campaignUnreadCount,
      chatUnreadCount,
      notifUnreadCount,
      unreadCount,
      pushEnabled,
      marketingEnabled,
      notificationVersion,
      markChatsRead,
      markNotifsRead,
      markAllRead,
      refreshNotifCount,
      refreshPreferences,
      setPushNotificationsEnabled,
      setMarketingEnabled,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
