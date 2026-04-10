import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';
import { userCommunityApi } from '@/services/users/communityApi';
import { useAuth } from './AuthContext';

const SEEN_KEY = 'chat_last_seen'; // { [chatId]: lastMessageTimestamp }
const POLL_INTERVAL = 30_000; // 30 seconds

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationContextValue {
  unreadCount: number;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  markAllRead: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  };

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

  const pollChats = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const chats = await userCommunityApi.getChats();
      const seenMap = await getSeenMap();
      let newCount = 0;
      const newMessages: { chatTitle: string; text: string }[] = [];

      for (const chat of chats) {
        const lastMsg = chat.lastMessage;
        if (!lastMsg) continue;
        const lastSeenAt = seenMap[chat.id];
        const lastMsgAt = lastMsg.createdAt || lastMsg.created_at || '';
        if (!lastMsgAt) continue;

        if (!lastSeenAt || new Date(lastMsgAt) > new Date(lastSeenAt)) {
          // Only count/notify if there's a new message we haven't seen
          if (lastSeenAt) {
            // We have a previous seen time, this is truly new
            newMessages.push({
              chatTitle: chat.title || chat.otherParticipants?.[0]?.name || 'New message',
              text: lastMsg.text || 'Sent a message',
            });
          }
          newCount++;
        }
      }

      setUnreadCount(newCount);

      // Fire local notifications for truly new messages (only when app is in background)
      if (appState.current !== 'active' && newMessages.length > 0) {
        for (const msg of newMessages) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: msg.chatTitle,
              body: msg.text,
              sound: true,
            },
            trigger: null,
          });
        }
      }
    } catch {
      // silently fail — don't disrupt the app if polling fails
    }
  }, [isLoggedIn]);

  const markAllRead = useCallback(async () => {
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
      setUnreadCount(0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      if (pollTimer.current) clearInterval(pollTimer.current);
      return;
    }

    requestPermissions();
    pollChats();
    pollTimer.current = setInterval(pollChats, POLL_INTERVAL);

    const sub = AppState.addEventListener('change', (nextState) => {
      appState.current = nextState;
      if (nextState === 'active') {
        // Refresh when app comes to foreground
        pollChats();
      }
    });

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      sub.remove();
    };
  }, [isLoggedIn, pollChats]);

  return (
    <NotificationContext.Provider value={{ unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
