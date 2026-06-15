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
import { glassSurface } from "../src/components/ui/Glass";
import { PageContainer } from "../src/components/PageContainer";
import { useState, useCallback } from "react";
import { userApi } from "../services/user/userApi";
import { notificationApi } from "../services/notification/notificationApi";
import type { AppNotification } from "../services/notification/notificationApi";
import { useNotificationStore } from "../src/lib/notification-store";
import { navigateForNotification } from "../src/lib/notification-nav";
import { Ionicons } from "@expo/vector-icons";

// ─── Type → visual config ─────────────────────────────────────────────────────
// Solid colour icon circles, lovable-style: coloured disc + white glyph.

type IonName = keyof typeof Ionicons.glyphMap;
type NotifMeta = { icon: IonName; accent: string; fg?: string };

const TYPE_META: Record<string, NotifMeta> = {
  like:            { icon: "heart",              accent: colors.coral },
  comment:         { icon: "chatbubble",         accent: colors.primary },
  follow:          { icon: "person-add",         accent: "#a855f7" },
  follow_request:  { icon: "person-add",         accent: colors.sunshine, fg: colors.foreground },
  playdate:        { icon: "paw",                accent: colors.pinky },
  breed:           { icon: "heart-circle",       accent: "#f472b6" },
  adoption:        { icon: "home",               accent: colors.success },
  event:           { icon: "calendar",           accent: "#7c3aed" },
  review:          { icon: "star",               accent: colors.sunshine, fg: colors.foreground },
  question_upvote: { icon: "thumbs-up",          accent: "#8b5cf6" },
  question_answer: { icon: "chatbubbles",        accent: "#0ea5e9" },
  reminder:        { icon: "time",               accent: "#10b981" },
  vaccine:         { icon: "shield-checkmark",   accent: "#10b981" },
  medication:      { icon: "medkit",             accent: "#0ea5e9" },
  appointment:     { icon: "calendar",           accent: "#0ea5e9" },
  campaign:        { icon: "megaphone",          accent: "#7c3aed" },
  general:         { icon: "information-circle", accent: "#6366f1" },
};

const getMeta = (type: string): NotifMeta =>
  TYPE_META[type] || TYPE_META.general;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRelTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  return `${d}d`;
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
    navigateForNotification(n, router);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  // Merge realtime WebSocket notifications at the top (deduplicated)
  const restIds = new Set(notifications.map((n) => n.id));
  const newRealtime = realtimeNotifs.filter((n) => !restIds.has(n.id));
  const mergedNotifications = [...newRealtime, ...notifications];

  const hasUnread = mergedNotifications.some(n => !n.isRead);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <PageContainer>
      <View style={styles.container}>
        <ScreenHeader title="Notifications" />

        {hasUnread && (
          <View style={styles.markAllRow}>
            <TouchableOpacity
              onPress={handleMarkAllRead}
              disabled={markingAll}
              style={[styles.markAllBtn, glassSurface(tk)]}
              activeOpacity={0.8}
            >
              {markingAll
                ? <ActivityIndicator size={14} color={colors.primary} />
                : <Ionicons name="checkmark-done" size={14} color={colors.primary} />
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
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {/* ── Follow Requests ─────────────────────────────────────────── */}
            {pendingRequests.length > 0 && (
              <>
                <Text style={[styles.sectionText, { color: tk.textMuted }]}>FOLLOW REQUESTS</Text>
                {pendingRequests.map(r => (
                  <View key={r.id} style={[styles.card, glassSurface(tk)]}>
                    <Avatar
                      source={r.followerUser?.avatar_url ? { uri: r.followerUser.avatar_url } : require("../src/assets/doodle-puppy.png")}
                      name={r.followerUser?.name}
                      size={44}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardBody, { color: tk.text }]}>
                        <Text style={[styles.cardTitle, { color: tk.text }]}>{r.followerUser?.name || "Someone"} </Text>
                        requested to follow you
                      </Text>
                      <View style={styles.btnRow}>
                        <TouchableOpacity onPress={() => handleAccept(r.followerId)} style={[styles.btn, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.btnText, { color: "#fff" }]}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleReject(r.followerId)} style={[styles.btn, { backgroundColor: tk.glassChip }]}>
                          <Text style={[styles.btnText, { color: tk.text }]}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* ── Notifications List ───────────────────────────────────────── */}
            {mergedNotifications.map(n => (
              <NotifCard key={n.id} n={n} tk={tk} onPress={() => handleTap(n)} />
            ))}

            {/* ── Empty state ──────────────────────────────────────────────── */}
            {pendingRequests.length === 0 && mergedNotifications.length === 0 && (
              <View style={[styles.emptyBox, glassSurface(tk)]}>
                <View style={[styles.emptyIcon, { backgroundColor: tk.glassChip }]}>
                  <Ionicons name="notifications-outline" size={28} color={tk.textMuted} />
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
    </PageContainer>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NotifCard({ n, tk, onPress }: { n: AppNotification; tk: any; onPress: () => void }) {
  const meta = getMeta(n.type);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, glassSurface(tk)]}
    >
      {/* Solid colour icon disc */}
      <View style={styles.iconWrap}>
        <View style={[styles.iconCircle, { backgroundColor: meta.accent }]}>
          <Ionicons name={meta.icon} size={20} color={meta.fg ?? "#fff"} />
        </View>
        {!n.isRead && <View style={[styles.dotBadge, { backgroundColor: meta.accent, borderColor: tk.bg }]} />}
      </View>

      {/* Content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.cardTitle, { color: tk.text, flex: 1 }, n.isRead && styles.cardTitleRead]}
            numberOfLines={2}
          >
            {n.title}
          </Text>
          <Text style={[styles.time, { color: tk.textMuted }]}>{formatRelTime(n.createdAt)}</Text>
        </View>
        {!!n.message && (
          <Text style={[styles.cardBody, { color: tk.textMuted }]} numberOfLines={2}>
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
  markAllRow:   { paddingHorizontal: 20, paddingBottom: 4 },
  markAllBtn:   { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  markAllText:  { fontFamily: "Poppins_600SemiBold", fontSize: 12 },

  // Section label
  sectionText:  { fontFamily: "Poppins_600SemiBold", fontSize: 11, letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },

  // Notification card (lovable-style: rounded card, icon disc, title + time)
  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  iconWrap:    { position: "relative" },
  iconCircle:  { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  dotBadge:    { position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },

  rowTop:      { flexDirection: "row", alignItems: "baseline", gap: 8 },
  cardTitle:   { fontFamily: "Poppins_700Bold", fontSize: 15, lineHeight: 21 },
  cardTitleRead: { fontFamily: "Poppins_600SemiBold" },
  cardBody:    { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 19 },
  time:        { fontSize: 11, fontFamily: "Inter_400Regular", flexShrink: 0 },

  // Follow request buttons
  btnRow:      { flexDirection: "row", gap: 8, marginTop: 8 },
  btn:         { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  btnText:     { fontFamily: "Poppins_700Bold", fontSize: 12 },

  // Empty state
  emptyBox:    { marginTop: 8, borderRadius: 20, padding: 32, alignItems: "center", gap: 10 },
  emptyIcon:   { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle:  { fontFamily: "Poppins_700Bold", fontSize: 16 },
  emptyBody:   { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, textAlign: "center" },
});
