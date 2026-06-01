import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Avatar } from "../src/components/Avatar";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useState, useCallback } from "react";
import { userApi } from "../services/user/userApi";
import { notificationApi } from "../services/notification/notificationApi";
import type { AppNotification } from "../services/notification/notificationApi";
import { useNotificationStore } from "../src/lib/notification-store";
import {
  Heart, MessageCircle, UserPlus, Bell, Clock, Calendar,
  CheckCheck, ShieldCheck, Megaphone, Info,
} from "lucide-react-native";

// ─── Type → visual config ─────────────────────────────────────────────────────

type NotifMeta = { Icon: any; accent: string; bg: string };

const TYPE_META: Record<string, NotifMeta> = {
  like:           { Icon: Heart,          accent: colors.coral,    bg: "rgba(255,107,107,0.12)" },
  comment:        { Icon: MessageCircle,  accent: colors.primary,  bg: "rgba(37,99,235,0.10)"  },
  follow:         { Icon: UserPlus,       accent: "#a855f7",       bg: "rgba(168,85,247,0.12)" },
  follow_request: { Icon: UserPlus,       accent: colors.sunshine, bg: "rgba(255,193,7,0.12)"  },
  reminder:       { Icon: Clock,          accent: "#10b981",       bg: "rgba(16,185,129,0.12)" },
  vaccine:        { Icon: ShieldCheck,    accent: "#10b981",       bg: "rgba(16,185,129,0.12)" },
  medication:     { Icon: ShieldCheck,    accent: "#0ea5e9",       bg: "rgba(14,165,233,0.12)" },
  appointment:    { Icon: Calendar,       accent: "#0ea5e9",       bg: "rgba(14,165,233,0.10)" },
  campaign:       { Icon: Megaphone,      accent: "#7c3aed",       bg: "rgba(124,58,237,0.10)" },
  general:        { Icon: Info,           accent: "#6366f1",       bg: "rgba(99,102,241,0.10)" },
};

const getMeta = (type: string): NotifMeta =>
  TYPE_META[type] || TYPE_META.general;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRelTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const tk = useTokens();
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Real-time notifications prepended from WebSocket
  const realtimeNotifs = useNotificationStore((s) => s.realtimeNotifs);
  const setUnreadCounts = useNotificationStore((s) => s.setUnreadCounts);
  const clearUnread = useNotificationStore((s) => s.clearUnread);
  const resetRealtimeNotifs = useNotificationStore((s) => s.resetRealtimeNotifs);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [notifs, requests, counts] = await Promise.all([
        notificationApi.listNotifications("activity"),
        userApi.getPendingFollowRequests(),
        notificationApi.getUnreadCounts(),
      ]);
      setNotifications(notifs);
      setPendingRequests(requests);
      // Sync REST counts into global store so badge stays accurate
      setUnreadCounts(counts);
      // Once we've fetched the full REST list, clear the realtime prepend
      // buffer (they're now included in the REST response)
      resetRealtimeNotifs();
    } catch (e) {
      console.error("[Notifications] fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  // ── Follow request actions ────────────────────────────────────────────────────

  const handleAccept = async (followerId: string) => {
    try {
      await userApi.acceptFollowRequest(followerId);
      setPendingRequests(rs => rs.filter(r => r.followerId !== followerId));
    } catch (e) { console.error(e); }
  };

  const handleReject = async (followerId: string) => {
    try {
      await userApi.rejectFollowRequest(followerId);
      setPendingRequests(rs => rs.filter(r => r.followerId !== followerId));
    } catch (e) { console.error(e); }
  };

  // ── Mark all read ─────────────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead("activity");
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
      // Also zero out the global badge counter
      clearUnread();
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Tap notification ─────────────────────────────────────────────────────────

  const handleTap = async (n: AppNotification) => {
    if (!n.isRead) {
      notificationApi.markRead(n.id).catch(() => {});
      setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }

    const p = n.actionPayload || {};
    switch (n.actionType) {
      case "profile":
        if (p.id) router.push(`/u/${p.id}` as any);
        break;
      case "like":
      case "comment":
        if (p.postId) router.push(`/post/${p.postId}` as any);
        break;
      case "reminder":
        // Navigate to care/today screen which shows reminders
        router.push("/today" as any);
        break;
      case "appointment_detail":
        if (p.appointmentId) router.push({ pathname: "/book", params: { id: p.appointmentId } });
        break;
      default:
        break;
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  // Merge realtime WebSocket notifications at the top (deduplicated)
  const restIds = new Set(notifications.map((n) => n.id));
  const newRealtime = realtimeNotifs.filter((n) => !restIds.has(n.id));
  const mergedNotifications = [...newRealtime, ...notifications];

  const hasUnread = mergedNotifications.some(n => !n.isRead);

  // ── Section grouping ─────────────────────────────────────────────────────────
  // Group reminder notifications separately from social activity

  const reminderNotifs = mergedNotifications.filter(n =>
    ["reminder", "vaccine", "medication"].includes(n.type)
  );
  const activityNotifs = mergedNotifications.filter(n =>
    !["reminder", "vaccine", "medication"].includes(n.type)
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Notifications" />

      {hasUnread && (
        <View style={[styles.markAllRow, { borderBottomColor: tk.border }]}>
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markingAll}
            style={[styles.markAllBtn, { backgroundColor: tk.card, borderColor: tk.border }]}
            activeOpacity={0.8}
          >
            {markingAll
              ? <ActivityIndicator size={14} color={colors.primary} />
              : <CheckCheck size={14} color={colors.primary} />
            }
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* ── Follow Requests ─────────────────────────────────────────── */}
          {pendingRequests.length > 0 && (
            <>
              <SectionLabel label="Follow Requests" tk={tk} />
              {pendingRequests.map(r => (
                <View key={r.id} style={[styles.row, { backgroundColor: tk.card, borderBottomColor: tk.border }]}>
                  <View style={styles.iconWrap}>
                    <Avatar
                      source={r.followerUser?.avatar_url ? { uri: r.followerUser.avatar_url } : require("../src/assets/doodle-puppy.png")}
                      name={r.followerUser?.name}
                      size={46}
                    />
                    <View style={[styles.dotBadge, { backgroundColor: colors.sunshine }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.body, { color: tk.text }]}>
                      <Text style={styles.bold}>{r.followerUser?.name || "Someone"} </Text>
                      requested to follow you
                    </Text>
                    <View style={styles.btnRow}>
                      <TouchableOpacity onPress={() => handleAccept(r.followerId)} style={[styles.btn, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.btnText, { color: "#fff" }]}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleReject(r.followerId)} style={[styles.btn, { backgroundColor: tk.border }]}>
                        <Text style={[styles.btnText, { color: tk.text }]}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ── Reminders ────────────────────────────────────────────────── */}
          {reminderNotifs.length > 0 && (
            <>
              <SectionLabel label="Reminders" tk={tk} />
              {reminderNotifs.map(n => (
                <NotifRow key={n.id} n={n} tk={tk} onPress={() => handleTap(n)} />
              ))}
            </>
          )}

          {/* ── Activity (like / comment / follow / appointment) ─────────── */}
          {activityNotifs.length > 0 && (
            <>
              <SectionLabel label="Activity" tk={tk} />
              {activityNotifs.map(n => (
                <NotifRow key={n.id} n={n} tk={tk} onPress={() => handleTap(n)} />
              ))}
            </>
          )}

          {/* ── Empty state ──────────────────────────────────────────────── */}
          {pendingRequests.length === 0 && mergedNotifications.length === 0 && (
            <View style={[styles.emptyBox, { backgroundColor: tk.card, borderColor: tk.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: tk.border }]}>
                <Bell size={28} color={tk.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: tk.text }]}>No notifications yet</Text>
              <Text style={[styles.emptyBody, { color: tk.textMuted }]}>
                Likes, comments, follows, reminders, and appointments will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label, tk }: { label: string; tk: any }) {
  return (
    <View style={[styles.sectionLabel, { borderBottomColor: tk.border }]}>
      <Text style={[styles.sectionText, { color: tk.textMuted }]}>{label}</Text>
    </View>
  );
}

function NotifRow({ n, tk, onPress }: { n: AppNotification; tk: any; onPress: () => void }) {
  const meta = getMeta(n.type);
  const Icon = meta.Icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.row,
        {
          backgroundColor: n.isRead ? tk.card : (tk.card + (tk.card.length === 7 ? "f0" : "")),
          borderBottomColor: tk.border,
          borderLeftWidth: n.isRead ? 0 : 3,
          borderLeftColor: n.isRead ? "transparent" : meta.accent,
        },
      ]}
    >
      {/* Icon badge */}
      <View style={[styles.iconWrap]}>
        <View style={[styles.iconBadge, { backgroundColor: meta.bg }]}>
          <Icon size={20} color={meta.accent} />
        </View>
        {!n.isRead && <View style={[styles.dotBadge, { backgroundColor: meta.accent }]} />}
      </View>

      {/* Content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.rowTop}>
          <Text style={[styles.body, { color: tk.text, flex: 1 }]} numberOfLines={2}>
            <Text style={n.isRead ? styles.body : styles.bold}>{n.title}</Text>
          </Text>
          <Text style={[styles.meta, { color: tk.textMuted }]}>{formatRelTime(n.createdAt)}</Text>
        </View>
        {!!n.message && (
          <Text style={[styles.subMsg, { color: tk.textMuted }]} numberOfLines={2}>
            {n.message}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1 },
  center:       { flex: 1, alignItems: "center", justifyContent: "center" },

  // Mark all row
  markAllRow:   { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  markAllBtn:   { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  markAllText:  { fontFamily: "Poppins_600SemiBold", fontSize: 12 },

  // Section label
  sectionLabel: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  sectionText:  { fontFamily: "Poppins_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },

  // Notification row
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  iconWrap:    { position: "relative" },
  iconBadge:   { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dotBadge:    { position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: "#fff" },

  rowTop:      { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  body:        { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  bold:        { fontFamily: "Poppins_700Bold" },
  subMsg:      { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  meta:        { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, flexShrink: 0 },

  // Follow request buttons
  btnRow:      { flexDirection: "row", gap: 8, marginTop: 8 },
  btn:         { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  btnText:     { fontFamily: "Poppins_700Bold", fontSize: 12 },

  // Empty state
  emptyBox:    { margin: 20, borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  emptyIcon:   { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle:  { fontFamily: "Poppins_700Bold", fontSize: 16 },
  emptyBody:   { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, textAlign: "center" },
});
