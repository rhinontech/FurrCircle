import React, { useState, useCallback, useMemo } from "react";
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
  Megaphone,
} from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { userNotificationsApi, type AppNotification, type NotificationCategory } from "@/services/users/notificationsApi";
import { navigateFromNotification } from "@/services/users/notificationRouting";

const TYPE_META: Record<string, { icon: any; accent: string; bg: string; bgDark: string }> = {
  appointment: { icon: CalendarDays, accent: "#0ea5e9", bg: "#eff6ff", bgDark: "#0c1a3a" },
  event: { icon: Heart, accent: "#ec4899", bg: "#fdf2f8", bgDark: "#2a0a1a" },
  reminder: { icon: ShieldCheck, accent: "#10b981", bg: "#ecfdf5", bgDark: "#002b12" },
  adoption: { icon: Heart, accent: "#ef4444", bg: "#fff1f2", bgDark: "#31111a" },
  campaign: { icon: Megaphone, accent: "#7c3aed", bg: "#f5f3ff", bgDark: "#241038" },
  general: { icon: Info, accent: "#6366f1", bg: "#eef2ff", bgDark: "#1a1a3a" },
};

const getTypeMeta = (notification: AppNotification) => TYPE_META[notification.type] || TYPE_META[notification.category] || TYPE_META.general;

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

const TABS: Array<{ key: NotificationCategory; label: string }> = [
  { key: "activity", label: "Activity" },
  { key: "campaign", label: "Campaigns" },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    markNotifsRead,
    refreshNotifCount,
    activityUnreadCount,
    campaignUnreadCount,
    notificationVersion,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<NotificationCategory>("activity");
  const [activityNotifications, setActivityNotifications] = useState<AppNotification[]>([]);
  const [campaignNotifications, setCampaignNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const [activity, campaign] = await Promise.all([
        userNotificationsApi.list("activity"),
        userNotificationsApi.list("campaign"),
      ]);
      setActivityNotifications(activity);
      setCampaignNotifications(campaign);
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
    }, [fetchNotifications, notificationVersion])
  );

  const notifications = activeTab === "activity" ? activityNotifications : campaignNotifications;
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const hasUnread = unreadNotifications.length > 0;
  const unreadForTab = activeTab === "activity" ? activityUnreadCount : campaignUnreadCount;

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markNotifsRead(activeTab);
    if (activeTab === "activity") {
      setActivityNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } else {
      setCampaignNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
    await refreshNotifCount();
    setMarkingAll(false);
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await userNotificationsApi.markRead(notification.id);
      if (notification.category === "activity") {
        setActivityNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      } else {
        setCampaignNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      }
      await refreshNotifCount();
    }

    navigateFromNotification(router, notification);
  };

  const emptyCopy = useMemo(() => (
    activeTab === "activity"
      ? {
          title: "No activity yet",
          body: "Appointments, adoptions, reminders, and other product updates will appear here.",
        }
      : {
          title: "No campaigns yet",
          body: "Feature launches, event promotions, and company updates will appear here.",
        }
  ), [activeTab]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
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

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", backgroundColor: colors.bgSubtle, borderRadius: 14, padding: 4 }}>
          {TABS.map((tab) => {
            const selected = activeTab === tab.key;
            const badge = tab.key === "activity" ? activityUnreadCount : campaignUnreadCount;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 11,
                  borderRadius: 10,
                  backgroundColor: selected ? colors.bgCard : "transparent",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: selected ? colors.textPrimary : colors.textMuted }}>
                  {tab.label}
                </Text>
                {badge > 0 && (
                  <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: selected ? colors.brand : colors.border, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>{badge > 99 ? "99+" : badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

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
              Mark {activeTab} read
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
                  {emptyCopy.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 }}>
                  {emptyCopy.body}
                </Text>
              </View>
            ) : (
              notifications.map((notification) => {
                const meta = getTypeMeta(notification);
                const Icon = meta.icon;
                const iconBg = isDark ? meta.bgDark : meta.bg;

                return (
                  <Pressable
                    key={notification.id}
                    onPress={() => handleOpenNotification(notification)}
                    style={{
                      backgroundColor: colors.bgCard,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: notification.isRead ? colors.border : colors.brand + "40",
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "flex-start",
                      opacity: notification.isRead ? 0.82 : 1,
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
                      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
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
                      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 19 }}>
                        {notification.message}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {notifications.length > 0 && (
              <View style={{ marginTop: 8, padding: 20, borderRadius: 18, backgroundColor: colors.bgSubtle }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Bell size={18} color={colors.brand} />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>
                    {unreadForTab > 0 ? `${unreadForTab} unread` : "All caught up"}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>
                  {activeTab === "activity"
                    ? "Transactional product updates appear here."
                    : "Company announcements and feature campaigns appear here."}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
