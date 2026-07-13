import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, Alert, FlatList, Image, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Avatar } from "../src/components/Avatar";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { glassSurface } from "../src/components/ui/Glass";
import { PageContainer } from "../src/components/PageContainer";
import { useState, useCallback, useEffect } from "react";
import { Inbox, MessageCircle, X } from "../src/components/ui/icons";
import { useLanguage } from "../src/lib/language-context";
import { adoptionApi, type AdoptionRequest } from "../services/adoption/adoptionApi";
import { matchApi } from "../services/match/matchApi";
import { chatApi } from "../services/chat/chatApi";
import { userApi } from "../services/user/userApi";
import { notificationApi } from "../services/notification/notificationApi";
import type { AppNotification } from "../services/notification/notificationApi";
import { useNotificationStore } from "../src/lib/notification-store";
import { navigateForNotification } from "../src/lib/notification-nav";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

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

const formatRelTime = (iso: string, t: any): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return t("timeNow");
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return t("timeYesterday");
  return `${d}d`;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const tk = useTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openRequests: openRequestsParam } = useLocalSearchParams<{ openRequests?: string }>();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Requests inbox states
  const [requestsVisible, setRequestsVisible] = useState(false);
  const [requestsTab, setRequestsTab] = useState<"received" | "sent" | "matches">("received");
  const [receivedRequests, setReceivedRequests] = useState<AdoptionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<AdoptionRequest[]>([]);
  const [playdateMatches, setPlaydateMatches] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const [received, sent, pMatches, bMatches] = await Promise.all([
        adoptionApi.getReceivedApplications(),
        adoptionApi.getMyApplications(),
        matchApi.getPlaydateMatches().catch(() => []),
        matchApi.getBreedMatches().catch(() => []),
      ]);
      setReceivedRequests(received);
      setSentRequests(sent);
      
      const mappedPlaydate = (pMatches || []).map((m: any) => ({ ...m, matchType: "playdate" }));
      const mappedBreed = (bMatches || []).map((m: any) => ({ ...m, matchType: "breed" }));
      const allMatches = [...mappedPlaydate, ...mappedBreed].sort(
        (a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
      );
      
      setPlaydateMatches(allMatches);
    } catch { }
    setRequestsLoading(false);
  }, []);

  const openRequests = () => {
    setRequestsVisible(true);
    loadRequests();
  };

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    setReviewingId(id);
    try {
      const updated = await adoptionApi.reviewApplication(id, status);
      setReceivedRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: updated.status, conversationId: updated.conversationId } : r))
      );
      if (status === "approved" && updated.conversationId) {
        setRequestsVisible(false);
        router.push({ pathname: "/chat", params: { id: updated.conversationId } });
      }
    } catch {
      Alert.alert(t("errorTitle"), t("failedToUpdateRequestMsg"));
    }
    setReviewingId(null);
  };

  useEffect(() => {
    if (openRequestsParam === "true") {
      openRequests();
    }
  }, [openRequestsParam]);

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
      useNotificationStore.setState(state => ({
        realtimeNotifs: state.realtimeNotifs.map(n => ({ ...n, isRead: true }))
      }));
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
      useNotificationStore.setState(state => ({
        realtimeNotifs: state.realtimeNotifs.map(x => x.id === n.id ? { ...x, isRead: true } : x)
      }));
    }

    if (
      n.actionType === "match_requests" ||
      n.actionType === "adoption_application" ||
      n.relatedType === "adoption_application" ||
      n.type === "adoption"
    ) {
      openRequests();
      return;
    }

    navigateForNotification(n, router);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  // Merge realtime WebSocket notifications at the top (deduplicated)
  const restIds = new Set(notifications.map((n) => n.id));
  const newRealtime = realtimeNotifs.filter((n) => !restIds.has(n.id));
  const mergedNotifications = [...newRealtime, ...notifications];

  const unseenNotifications = mergedNotifications.filter(n => !n.isRead);
  const seenNotifications = mergedNotifications.filter(n => n.isRead);
  const hasUnread = unseenNotifications.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <PageContainer>
      <View style={styles.container}>
        <ScreenHeader
          title={showHistory ? t("historyTitle") : t("notificationsTitle")}
          onBack={showHistory ? () => setShowHistory(false) : undefined}
          right={showHistory ? null : (
            <TouchableOpacity onPress={openRequests} style={[styles.inboxBtn, glassSurface(tk)]} activeOpacity={0.75}>
              <Inbox size={20} color={tk.text} strokeWidth={2} />
              <Text style={[styles.inboxBtnText, { color: tk.text }]}>{t("requestsBtn")}</Text>
            </TouchableOpacity>
          )}
        />

        {!showHistory && hasUnread && (
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
              <Text style={[styles.markAllText, { color: colors.primary }]}>{t("markAllReadBtn")}</Text>
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
            showsVerticalScrollIndicator={false}
          >
            {/* ── Unseen Notification View ───────────────────────────────── */}
            {!showHistory && (
              <>
                {/* ── Follow Requests ─────────────────────────────────────────── */}
                {pendingRequests.length > 0 && (
                  <>
                    <Text style={[styles.sectionText, { color: tk.textMuted }]}>{t("followRequestsHeader")}</Text>
                    {pendingRequests.map(r => (
                      <View key={r.id} style={[styles.card, glassSurface(tk)]}>
                        <Avatar
                          source={r.followerUser?.avatar_url ? { uri: r.followerUser.avatar_url } : require("../src/assets/doodle-puppy.png")}
                          name={r.followerUser?.name}
                          size={44}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardBody, { color: tk.text }]}>
                            <Text style={[styles.cardTitle, { color: tk.text }]}>{r.followerUser?.name || t("someoneFallback")} </Text>
                            {t("requestedToFollowYou")}
                          </Text>
                          <View style={styles.btnRow}>
                            <TouchableOpacity onPress={() => handleAccept(r.followerId)} style={[styles.btn, { backgroundColor: colors.primary }]}>
                              <Text style={[styles.btnText, { color: "#fff" }]}>{t("acceptAction")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleReject(r.followerId)} style={[styles.btn, { backgroundColor: tk.glassChip }]}>
                              <Text style={[styles.btnText, { color: tk.text }]}>{t("rejectAction")}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </>
                )}

                {/* ── Notifications List ───────────────────────────────────────── */}
                {unseenNotifications.map(n => (
                  <NotifCard key={n.id} n={n} tk={tk} onPress={() => handleTap(n)} t={t} />
                ))}

                {/* ── Empty state ──────────────────────────────────────────────── */}
                {pendingRequests.length === 0 && unseenNotifications.length === 0 && (
                  <View style={[styles.emptyBox, glassSurface(tk)]}>
                    <View style={[styles.emptyIcon, { backgroundColor: tk.glassChip }]}>
                      <Ionicons name="notifications-outline" size={28} color={tk.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: tk.text }]}>{t("allCaughtUpTitle")}</Text>
                    <Text style={[styles.emptyBody, { color: tk.textMuted }]}>
                      {t("noNewNotifications")}
                    </Text>
                  </View>
                )}

                {/* ── History Icon Link at bottom of unseen list ────────────── */}
                <View style={styles.historyToggleContainer}>
                  <TouchableOpacity
                    onPress={() => setShowHistory(true)}
                    style={[styles.historyToggleBtn, glassSurface(tk)]}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="history" size={20} color={colors.primary} />
                    <Text style={[styles.historyToggleText, { color: tk.text }]}>{t("viewHistoryBtn")}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Seen Notification View (History) ───────────────────────── */}
            {showHistory && (
              <>
                {/* ── Notifications List ───────────────────────────────────────── */}
                {seenNotifications.map(n => (
                  <NotifCard key={n.id} n={n} tk={tk} onPress={() => handleTap(n)} t={t} />
                ))}

                {/* ── Empty state ──────────────────────────────────────────────── */}
                {seenNotifications.length === 0 && (
                  <View style={[styles.emptyBox, glassSurface(tk)]}>
                    <View style={[styles.emptyIcon, { backgroundColor: tk.glassChip }]}>
                      <MaterialCommunityIcons name="history" size={28} color={tk.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: tk.text }]}>{t("noHistoryTitle")}</Text>
                    <Text style={[styles.emptyBody, { color: tk.textMuted }]}>
                      {t("noHistoryBody")}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}

        <Modal visible={requestsVisible} animationType="slide" transparent={true} presentationStyle="overFullScreen" onRequestClose={() => setRequestsVisible(false)}>
          <View style={styles.reqModalOverlay}>
            <View style={[styles.reqModal, { backgroundColor: tk.bg, paddingTop: Platform.OS === 'web' ? 20 : insets.top }]}>
            {/* Modal header */}
            <View style={styles.reqHeader}>
              <Text style={[styles.reqTitle, { color: tk.text }]}>{t("inboxTitle")}</Text>
              <TouchableOpacity onPress={() => setRequestsVisible(false)} style={[styles.reqCloseBtn, glassSurface(tk)]}>
                <X size={18} color={tk.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Received / Sent / Matches tabs */}
            <View style={[styles.reqTabs, glassSurface(tk)]}>
              {(["received", "sent", "matches"] as const).map((tabItem) => {
                const pendingCount = receivedRequests.filter((r) => r.status === "pending").length;
                const label = tabItem === "received" ? t("receivedTab") : tabItem === "sent" ? t("sentTab") : t("matchesTab");
                const badge = tabItem === "received" && pendingCount > 0
                  ? ` (${pendingCount})`
                  : tabItem === "matches" && playdateMatches.length > 0
                    ? ` (${playdateMatches.length})`
                    : "";
                return (
                  <TouchableOpacity
                    key={tabItem}
                    onPress={() => setRequestsTab(tabItem)}
                    style={[styles.reqTab, requestsTab === tabItem && { backgroundColor: tk.text }]}
                  >
                    <Text style={[styles.reqTabText, { color: requestsTab === tabItem ? tk.bg : tk.textMuted }]}>
                      {label}{badge}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {requestsLoading ? (
              <View style={styles.reqLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : requestsTab === "matches" ? (
              <FlatList
                data={playdateMatches}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.reqList}
                ListEmptyComponent={
                  <View style={styles.reqEmpty}>
                    <Text style={[styles.reqEmptyText, { color: tk.textMuted }]}>
                      {t("noMatchesMessage")}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const petImg = item.pet?.avatar_url ? { uri: item.pet.avatar_url } : null;
                  const isBreed = item.matchType === "breed";
                  return (
                    <View style={[styles.reqCard, glassSurface(tk)]}>
                      <View style={styles.reqCardImgWrap}>
                        {petImg ? (
                          <Image source={petImg} style={styles.reqCardImg} />
                        ) : (
                          <View style={[styles.reqCardImg, { backgroundColor: tk.glassBorder, alignItems: "center", justifyContent: "center" }]}>
                            <Text style={{ fontSize: 28 }}>🐾</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.reqCardBody}>
                        <View style={styles.reqCardTop}>
                          <Text style={[styles.reqCardPetName, { color: tk.text }]}>{item.pet?.name || "Pet"}</Text>
                          <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
                            <View style={[styles.reqStatusBadge, { backgroundColor: colors.success + "22", borderColor: colors.success }]}>
                              <Text style={[styles.reqStatusText, { color: colors.success }]}>{t("matchedStatus")}</Text>
                            </View>
                            <View style={[styles.reqStatusBadge, { backgroundColor: isBreed ? colors.primary + "22" : colors.sunshine + "22", borderColor: isBreed ? colors.primary : colors.sunshine }]}>
                              <Text style={[styles.reqStatusText, { color: isBreed ? colors.primary : colors.sunshine }]}>
                                {isBreed ? t("breedStatus") : t("playdateStatus")}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={[styles.reqCardMeta, { color: tk.textMuted }]}>
                          {item.myPet?.name ? `${item.myPet.name} & ${item.pet?.name || "Pet"}` : item.pet?.breed || item.pet?.species || (isBreed ? "Breed" : "Playdate")}
                          {item.owner?.name ? ` · with ${item.owner.name}` : ""}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setRequestsVisible(false);
                            if (item.conversationId) {
                              router.push({ pathname: "/chat", params: { id: item.conversationId } });
                            } else {
                              router.push("/chat");
                            }
                          }}
                          style={[styles.reqOpenChatBtn, { backgroundColor: colors.primary }]}
                          activeOpacity={0.85}
                        >
                          <MessageCircle size={15} color="#fff" strokeWidth={2.5} />
                          <Text style={styles.reqOpenChatBtnText}>{t("openChatBtn")}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            ) : (
              <FlatList
                data={requestsTab === "received" ? receivedRequests : sentRequests}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.reqList}
                ListEmptyComponent={
                  <View style={styles.reqEmpty}>
                    <Text style={[styles.reqEmptyText, { color: tk.textMuted }]}>
                      {requestsTab === "received" ? t("noRequestsReceived") : t("noRequestsSent")}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isReceived = requestsTab === "received";
                  const petImg = item.pet?.avatar_url ? { uri: item.pet.avatar_url } : null;
                  const applicantImg = item.applicant?.avatar_url ? { uri: item.applicant.avatar_url } : null;
                  const statusColor = item.status === "approved" ? colors.success : item.status === "rejected" ? colors.coral : colors.sunshine;
                  return (
                    <View style={[styles.reqCard, glassSurface(tk)]}>
                      {/* Pet image */}
                      <View style={styles.reqCardImgWrap}>
                        {petImg ? (
                          <Image source={petImg} style={styles.reqCardImg} />
                        ) : (
                          <View style={[styles.reqCardImg, { backgroundColor: tk.glassBorder, alignItems: "center", justifyContent: "center" }]}>
                            <Text style={{ fontSize: 28 }}>🐾</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.reqCardBody}>
                        <View style={styles.reqCardTop}>
                          <Text style={[styles.reqCardPetName, { color: tk.text }]}>{item.pet?.name || t("petFallback")}</Text>
                          <View style={[styles.reqStatusBadge, { backgroundColor: statusColor + "22", borderColor: statusColor }]}>
                            <Text style={[styles.reqStatusText, { color: statusColor }]}>
                              {item.status === "approved"
                                ? t("approvedStatus")
                                : item.status === "rejected"
                                  ? t("rejectedStatus")
                                  : item.status === "pending"
                                    ? t("pendingStatus")
                                    : (item.status as string).charAt(0).toUpperCase() + (item.status as string).slice(1)
                              }
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.reqCardMeta, { color: tk.textMuted }]}>
                          {item.type === "adoption"
                            ? t("adoptionLabel")
                            : item.type === "foster"
                              ? t("fosterLabel")
                              : (item.type as string).charAt(0).toUpperCase() + (item.type as string).slice(1)
                          } · {isReceived
                            ? t("fromLabel").replace("{name}", item.applicant?.name || item.applicantName || t("someoneFallback"))
                            : t("toLabel").replace("{name}", item.pet?.owner?.name || t("ownerFallback"))
                          }
                        </Text>

                        {/* Applicant avatar row (received view) */}
                        {isReceived && applicantImg && (
                          <View style={styles.reqApplicantRow}>
                            <Image source={applicantImg} style={styles.reqApplicantAvatar} />
                            <Text style={[styles.reqApplicantCity, { color: tk.textMuted }]}>
                              {item.applicant?.city || ""}
                            </Text>
                          </View>
                        )}

                        {/* Action buttons for received + pending */}
                        {isReceived && item.status === "pending" && (
                          <View style={styles.reqActions}>
                            <TouchableOpacity
                              onPress={() => handleReview(item.id, "rejected")}
                              disabled={reviewingId === item.id}
                              style={[styles.reqActionBtn, { borderColor: colors.coral }]}
                            >
                              {reviewingId === item.id ? (
                                <ActivityIndicator size="small" color={colors.coral} />
                              ) : (
                                <Text style={[styles.reqActionBtnText, { color: colors.coral }]}>{t("declineAction")}</Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleReview(item.id, "approved")}
                              disabled={reviewingId === item.id}
                              style={[styles.reqActionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                            >
                              {reviewingId === item.id ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={[styles.reqActionBtnText, { color: "#fff" }]}>{t("acceptAndChatAction")}</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* Open Chat button — all approved requests (both tabs) */}
                        {item.status === "approved" && (
                          <TouchableOpacity
                            onPress={async () => {
                              setRequestsVisible(false);
                              if (item.conversationId) {
                                router.push({ pathname: "/chat", params: { id: item.conversationId } });
                              } else {
                                try {
                                  const recipientId = requestsTab === "received"
                                    ? item.applicantId
                                    : item.ownerId;
                                  
                                  if (recipientId) {
                                    const conv = await chatApi.startChat(recipientId);
                                    router.push({ pathname: "/chat", params: { id: conv.id } });
                                  } else {
                                    router.push("/chat");
                                  }
                                } catch (err) {
                                  console.error("Failed to start/open chat:", err);
                                  router.push("/chat");
                                }
                              }
                            }}
                            style={[styles.reqOpenChatBtn, { backgroundColor: colors.primary }]}
                            activeOpacity={0.85}
                          >
                            <MessageCircle size={15} color="#fff" strokeWidth={2.5} />
                            <Text style={styles.reqOpenChatBtnText}>{t("openChatBtn")}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
          </View>
        </Modal>
      </View>
    </PageContainer>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NotifCard({ n, tk, onPress, t }: { n: AppNotification; tk: any; onPress: () => void; t: any }) {
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
          <Text style={[styles.time, { color: tk.textMuted }]}>{formatRelTime(n.createdAt, t)}</Text>
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

  // Header inbox button
  inboxBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inboxBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },

  // Requests Modal
  reqModalOverlay: {
    flex: 1,
    ...Platform.select({
      web: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
      }
    })
  },
  reqModal: { 
    flex: 1, 
    paddingTop: 20,
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: 680,
        maxHeight: '90%',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      }
    })
  },
  reqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  reqTitle: { fontFamily: "Poppins_700Bold", fontSize: 24 },
  reqCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reqTabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
  },
  reqTab: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 20 },
  reqTabText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  reqLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
  reqList: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  reqEmpty: { alignItems: "center", paddingTop: 60 },
  reqEmptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  reqCard: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  reqCardImgWrap: { width: 72, height: 72, borderRadius: 16, overflow: "hidden" },
  reqCardImg: { width: 72, height: 72 },
  reqCardBody: { flex: 1, gap: 4 },
  reqCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reqCardPetName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  reqStatusBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reqStatusText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  reqCardMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  reqApplicantRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  reqApplicantAvatar: { width: 20, height: 20, borderRadius: 10 },
  reqApplicantCity: { fontFamily: "Inter_400Regular", fontSize: 11 },
  reqActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  reqActionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  reqActionBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  reqChatBtn: { marginTop: 6 },
  reqChatBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  reqOpenChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 9,
  },
  reqOpenChatBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },

  // History Toggle Button
  historyToggleContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  historyToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  historyToggleText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});
