import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { userCommunityApi } from '@/services/users/communityApi';
import { userNotificationsApi } from '@/services/users/notificationsApi';
import { useAuth } from './AuthContext';

// expo-notifications is NOT used — it was removed from Expo Go in SDK 53.
// Badge count is powered by polling + AsyncStorage only.

const SEEN_KEY = 'chat_last_seen'; // { [chatId]: lastMessageTimestamp }
const POLL_INTERVAL = 30_000;

interface NotificationContextValue {
  /** Unread chat messages — used for Community tab badge */
  chatUnreadCount: number;
  /** Unread system notifications (appointments, events, etc.) */
  notifUnreadCount: number;
  /** Sum of chat + system notifications */
  unreadCount: number;
  markChatsRead: () => Promise<void>;
  markNotifsRead: () => Promise<void>;
  /** Mark everything read */
  markAllRead: () => Promise<void>;
  refreshNotifCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  chatUnreadCount: 0,
  notifUnreadCount: 0,
  unreadCount: 0,
  markChatsRead: async () => {},
  markNotifsRead: async () => {},
  markAllRead: async () => {},
  refreshNotifCount: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

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

  const pollAll = useCallback(async () => {
    if (!isLoggedIn) return;

    // Poll chats
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
      // silently fail — don't disrupt the app
    }

    // Poll system notifications
    try {
      const count = await userNotificationsApi.getUnreadCount();
      setNotifUnreadCount(count);
    } catch {
      // silently fail
    }
  }, [isLoggedIn]);

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

  const markNotifsRead = useCallback(async () => {
    try {
      await userNotificationsApi.markAllRead();
      setNotifUnreadCount(0);
    } catch {
      setNotifUnreadCount(0);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    await Promise.allSettled([markChatsRead(), markNotifsRead()]);
  }, [markChatsRead, markNotifsRead]);

  const refreshNotifCount = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const count = await userNotificationsApi.getUnreadCount();
      setNotifUnreadCount(count);
    } catch {
      // silently fail
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setChatUnreadCount(0);
      setNotifUnreadCount(0);
      if (pollTimer.current) clearInterval(pollTimer.current);
      return;
    }

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

  const unreadCount = chatUnreadCount + notifUnreadCount;

  return (
    <NotificationContext.Provider value={{
      chatUnreadCount,
      notifUnreadCount,
      unreadCount,
      markChatsRead,
      markNotifsRead,
      markAllRead,
      refreshNotifCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
