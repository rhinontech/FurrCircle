import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { userCommunityApi } from '@/services/users/communityApi';
import { useAuth } from './AuthContext';

// expo-notifications is NOT used — it was removed from Expo Go in SDK 53.
// Badge count is powered by polling + AsyncStorage only.

const SEEN_KEY = 'chat_last_seen'; // { [chatId]: lastMessageTimestamp }
const POLL_INTERVAL = 30_000;

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

      setUnreadCount(newCount);
    } catch {
      // silently fail — don't disrupt the app
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

    pollChats();
    pollTimer.current = setInterval(pollChats, POLL_INTERVAL);

    const sub = AppState.addEventListener('change', (nextState) => {
      appState.current = nextState;
      if (nextState === 'active') pollChats();
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
