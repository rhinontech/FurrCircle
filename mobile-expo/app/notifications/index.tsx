import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  ChevronLeft,
  Bell,
  CalendarDays,
  Heart,
  ShieldCheck,
  CheckCheck,
  Info,
} from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { userNotificationsApi, type AppNotification } from "@/services/users/notificationsApi";

const TYPE_META: Record<string, { icon: any; accent: string; bg: string; bgDark: string }> = {
  appointment: { icon: CalendarDays, accent: "#0ea5e9", bg: "#eff6ff", bgDark: "#0c1a3a" },
  event: { icon: Heart, accent: "#ec4899", bg: "#fdf2f8", bgDark: "#2a0a1a" },
  reminder: { icon: ShieldCheck, accent: "#10b981", bg: "#ecfdf5", bgDark: "#002b12" },
  general: { icon: Info, accent: "#6366f1", bg: "#eef2ff", bgDark: "#1a1a3a" },
};

const getTypeMeta = (type: string) => TYPE_META[type] || TYPE_META.general;

const formatRelativeTime = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { markNotifsRead, refreshNotifCount } = useNotifications();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await userNotificationsApi.list();
      setNotifications(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markNotifsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await refreshNotifCount();
    setMarkingAll(false);
  };

  const handleMarkRead = async (id: string) => {
    await userNotificationsApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await refreshNotifCount();
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const hasUnread = unreadNotifications.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: "700",
            color: colors.textPrimary,
            textAlign: "center",
            marginRight: 40,
          }}
        >
          Notifications
        </Text>
      </View>

      {/* Mark all read button */}
      {hasUnread && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 8, alignItems: "flex-end" }}>
          <Pressable
            onPress={handleMarkAllRead}
            disabled={markingAll}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.bgSubtle,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {markingAll ? (
              <ActivityIndicator size={14} color={colors.brand} />
            ) : (
              <CheckCheck size={14} color={colors.brand} />
            )}
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.brand }}>
              Mark all read
            </Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              tintColor={colors.brand}
            />
          }
        >
          <View style={{ gap: 12 }}>
            {notifications.length === 0 ? (
              <View
                style={{
                  padding: 40,
                  borderRadius: 20,
                  backgroundColor: colors.bgCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colors.bgSubtle,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell size={28} color={colors.textMuted} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
                  No notifications yet
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textMuted,
                    textAlign: "center",
                    lineHeight: 19,
                  }}
                >
                  Appointment updates, event bookings, and other alerts will appear here.
                </Text>
              </View>
            ) : (
              notifications.map((notification) => {
                const meta = getTypeMeta(notification.type);
                const Icon = meta.icon;
                const iconBg = isDark ? meta.bgDark : meta.bg;

                return (
                  <Pressable
                    key={notification.id}
                    onPress={() => !notification.isRead && handleMarkRead(notification.id)}
                    style={{
                      backgroundColor: colors.bgCard,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: notification.isRead ? colors.border : colors.brand + "40",
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "flex-start",
                      opacity: notification.isRead ? 0.8 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: iconBg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={22} color={meta.accent} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 15,
                            fontWeight: notification.isRead ? "600" : "700",
                            color: colors.textPrimary,
                            lineHeight: 20,
                          }}
                          numberOfLines={2}
                        >
                          {notification.title}
                        </Text>
                        <View style={{ minWidth: 58, alignItems: "flex-end", flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                          <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
                            {formatRelativeTime(notification.createdAt)}
                          </Text>
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              marginTop: 5,
                              backgroundColor: notification.isRead ? "transparent" : colors.brand,
                            }}
                          />
                        </View>
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.textSecondary,
                          marginTop: 6,
                          lineHeight: 19,
                        }}
                      >
                        {notification.message}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {notifications.length > 0 && (
              <View
                style={{
                  marginTop: 8,
                  padding: 20,
                  borderRadius: 18,
                  backgroundColor: colors.bgSubtle,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Bell size={18} color={colors.brand} />
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}
                  >
                    {hasUnread ? `${unreadNotifications.length} unread` : "All caught up"}
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}
                >
                  Appointment updates, event bookings, and alerts appear here.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
