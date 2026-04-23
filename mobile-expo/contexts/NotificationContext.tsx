import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { io, type Socket } from 'socket.io-client';
import { useRouter } from 'expo-router';
import { userCommunityApi } from '@/services/users/communityApi';
import { userNotificationsApi, type NotificationCategory, type NotificationCounts } from '@/services/users/notificationsApi';
import { navigateFromNotification } from '@/services/users/notificationRouting';
import messaging from '@react-native-firebase/messaging';
import { registerForPushNotificationsAsync } from '@/services/fcmService';
import { getApiRootUrl } from '@/services/api';
import { useAuth } from './AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);

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
      const settings = await Notifications.getPermissionsAsync();
      const enabled = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
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

      if (enabled) {
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
    await Promise.allSettled([refreshChatCount(), refreshNotifCount(), refreshPreferences(), syncPushPreference()]);
  }, [isLoggedIn, refreshChatCount, refreshNotifCount, refreshPreferences, syncPushPreference]);

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

  useEffect(() => {
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      
      let actionPayload = data.actionPayload;
      if (typeof actionPayload === 'string') {
        try {
          actionPayload = JSON.parse(actionPayload);
        } catch {
          // fallback to original if not JSON
        }
      }

      navigateFromNotification(router, {
        actionType: typeof data.actionType === 'string' ? data.actionType : null,
        actionPayload: typeof actionPayload === 'object' && actionPayload ? actionPayload as Record<string, unknown> : null,
        relatedId: typeof data.relatedId === 'string' ? data.relatedId : undefined,
      });
    });

    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || '',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data || {},
        },
        trigger: null,
      });
    });

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

    pollAll();
    registerDevice(true).catch(() => {});
    pollTimer.current = setInterval(pollAll, POLL_INTERVAL);

    const sub = AppState.addEventListener('change', (nextState) => {
      appState.current = nextState;
      if (nextState === 'active') pollAll();
    });

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      sub.remove();
    };
  }, [isLoggedIn, pollAll, registerDevice]);

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
