import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, Alert, Modal, Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Share2, MapPin, Grid3x3, Bookmark, Bone, Play, MoreVertical, ShieldOff, Flag, ChevronRight, X, Check } from "../../src/components/ui/icons";
import { PageContainer } from "../../src/components/PageContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { ShareSheet } from "../../src/components/ShareSheet";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useAuthStore } from "../../src/lib/auth-store";
import { useLanguage } from "../../src/lib/language-context";
import { userApi } from "../../services/user/userApi";
import { feedApi } from "../../services/community/feedApi";
import { chatApi } from "../../services/chat/chatApi";
import { blockApi } from "../../services/user/blockApi";
import { Video, ResizeMode } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBreakpoint } from "../../src/lib/breakpoints";
const puppy = require("../../src/assets/doodle-puppy.png");
const tabs = ["Posts", "Pets", "Saved"] as const;
const tabIcons = { Posts: Grid3x3, Pets: Bone, Saved: Bookmark };

function StatItem({ n, l, tk, onPress }: { n: string; l: string; tk: any; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.statItem} onPress={onPress} activeOpacity={onPress ? 0.6 : 1} disabled={!onPress}>
      <Text style={[styles.statNum, { color: tk.text }]}>{n}</Text>
      <Text style={[styles.statLabel, { color: tk.textMuted }]}>{l}</Text>
    </TouchableOpacity>
  );
}

export default function UserProfileScreen() {
  const { t } = useLanguage();
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const tk = useTokens();
  const { user: me } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { isTablet } = useBreakpoint();

  const [tab, setTab] = useState<(typeof tabs)[number]>("Posts");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportStep, setReportStep] = useState(1);
  const [shareOpen, setShareOpen] = useState(false);

  // Tab data
  const [posts, setPosts] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handle || "");
  const isOwnProfile = me?.username === handle || (isUUID && me?.id === handle) || (userProfile && me?.username === userProfile.username);

  const handleFollowToggle = async () => {
    if (!userProfile) return;
    try {
      if (userProfile.followStatus === "none") {
        const res = await userApi.followUser(userProfile.id);
        setUserProfile({ ...userProfile, followStatus: res.status });
      } else {
        await userApi.unfollowUser(userProfile.id);
        setUserProfile({ ...userProfile, followStatus: "none", followersCount: userProfile.followersCount - 1 });
      }
    } catch (err) {
      console.error("Failed to toggle follow", err);
    }
  };

  const handleMessage = async () => {
    if (!userProfile) return;
    try {
      const conv = await chatApi.startChat(userProfile.id);
      router.push({ pathname: '/chat', params: { id: conv.id } });
    } catch (err) {
      console.error("Failed to start chat", err);
    }
  };

  const handleBlockUser = () => {
    setMenuOpen(false);
    const userDisplay = userProfile?.username || handle;
    Alert.alert(
      t("blockUserTitle").replace("{username}", userDisplay),
      t("blockUserDesc"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("blockAction"),
          style: "destructive",
          onPress: async () => {
            setIsBlocking(true);
            try {
              await blockApi.blockUser(userProfile.id);
              // Update local state to show blocked screen
              setUserProfile({ ...userProfile, isBlocked: true, canViewContent: false, avatar_url: null });
            } catch (err: any) {
              Alert.alert(t("error"), err.message || t("failedToBlockUser"));
            } finally {
              setIsBlocking(false);
            }
          },
        },
      ]
    );
  };

  const handleReportUser = () => {
    setMenuOpen(false);
    setReportStep(1);
    setReportModalOpen(true);
  };

  const handleSelectReason = async (reason: string) => {
    if (!userProfile?.id) {
      Alert.alert(t("error"), t("couldNotIdentifyUserReport"));
      return;
    }

    try {
      await feedApi.reportUser(userProfile.id, reason);
      setReportStep(2);
    } catch (err: any) {
      Alert.alert(t("error"), err?.response?.data?.message || t("failedToSubmitReport"));
    }
  };

  const handleUnblockUser = async () => {
    try {
      await blockApi.unblockUser(userProfile.id);
      // Reload the profile
      const data = await userApi.getUserProfile(handle as string);
      setUserProfile(data);
    } catch (err: any) {
      Alert.alert(t("error"), err.message || t("failedToUnblockUser"));
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!handle) return;
      setLoading(true);
      userApi.getUserProfile(handle as string)
        .then(data => {
          setUserProfile(data);
          setLoading(false);

          // Fetch posts and saved posts using resolved username / check ownership
          setLoadingTab(true);
          const isOwn = me?.username === data.username || me?.id === data.id;
          const postsPromise = isOwn ? feedApi.getMyPosts() : feedApi.getUserPosts(data.username);

          postsPromise
            .then(setPosts)
            .catch(() => setPosts([]))
            .finally(() => setLoadingTab(false));

          if (isOwn) {
            feedApi.getSavedPosts().then(setSaved).catch(() => setSaved([]));
          }
        })
        .catch(err => {
          console.error("Failed to load profile:", err);
          setLoading(false);
        });
    }, [handle, me?.username, me?.id])
  );

  const gridData = tab === "Posts" ? posts : tab === "Saved" ? saved : [];

  return (
    <PageContainer noAmbient={true}>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader
          title={userProfile?.username ? `@${userProfile.username}` : (isUUID ? t("profile") : `@${handle}`)}
          right={
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setShareOpen(true)}
                style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: tk.card }}
              >
                <Share2 size={20} color={tk.text} />
              </TouchableOpacity>
              {!isOwnProfile && (
                <TouchableOpacity
                  onPress={() => setMenuOpen(true)}
                  style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: tk.card }}
                >
                  <MoreVertical size={20} color={tk.text} />
                </TouchableOpacity>
              )}
            </View>
          }
        />

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : userProfile?.isBlocked ? (
          /* ── Blocked State ── */
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(239,68,68,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <ShieldOff size={36} color="#EF4444" />
            </View>
            <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 20, color: tk.text, marginBottom: 8 }}>
              {t("accountNotAvailable")}
            </Text>
            {userProfile.iBlockedThem ? (
              <>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted, textAlign: "center", lineHeight: 22 }}>
                  {t("blockedUserMessage").replace("{username}", handle || "")}
                </Text>
                <TouchableOpacity
                  onPress={handleUnblockUser}
                  style={{ marginTop: 24, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, borderWidth: 1.5, borderColor: "#EF4444" }}
                >
                  <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 14, color: "#EF4444" }}>{t("unblockAction")}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted, textAlign: "center", lineHeight: 22 }}>
                {t("cantViewProfile")}
              </Text>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
            {/* Profile card */}
            <View style={styles.px5}>
              <View style={[styles.profileCard, { backgroundColor: tk.card }]}>
                {/* Avatar + stats */}
                <View style={styles.profileTop}>
                  <View style={styles.avatarWrap}>
                    <Image
                      source={userProfile?.avatar_url ? { uri: userProfile.avatar_url } : puppy}
                      style={styles.avatarImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.statsRow}>
                    <StatItem n={(posts.length || userProfile?.postCount || 0).toString()} l={t("postsLabel")} tk={tk} />
                    <StatItem n={(userProfile?.followersCount || 0).toString()} l={t("followersLabel")} tk={tk} onPress={() => userProfile?.id && router.push({ pathname: "/user/followers", params: { userId: userProfile.id, type: "followers", title: t("followersLabel") } })} />
                    <StatItem n={(userProfile?.followingCount || 0).toString()} l={t("followingLabel")} tk={tk} onPress={() => userProfile?.id && router.push({ pathname: "/user/followers", params: { userId: userProfile.id, type: "following", title: t("followingLabel") } })} />
                  </View>
                </View>

                {/* Name + bio */}
                <Text style={[styles.displayName, { color: tk.text }]}>{userProfile?.name || handle}</Text>
                {userProfile?.bio && <Text style={[styles.bio, { color: tk.textMuted }]}>{userProfile.bio}</Text>}
                <View style={styles.locationRow}>
                  <MapPin size={12} color={tk.textMuted} />
                  <Text style={[styles.locationText, { color: tk.textMuted }]}>{userProfile?.city || t("unknownLocation")}</Text>
                </View>

                {/* Action buttons */}
                <View style={styles.actionRow}>
                  {userProfile?.followStatus === "self" && (
                    <TouchableOpacity onPress={() => router.push("/edit-profile")} style={[styles.editProfileBtn, { backgroundColor: tk.text + "15" }]}>
                      <Text style={[styles.editProfileBtnText, { color: tk.text }]}>{t("editProfile")}</Text>
                    </TouchableOpacity>
                  )}
                  {userProfile?.followStatus === "none" && (
                    <TouchableOpacity onPress={handleFollowToggle} style={[styles.editProfileBtn, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.editProfileBtnText, { color: colors.white }]}>{t("follow")}</Text>
                    </TouchableOpacity>
                  )}
                  {userProfile?.followStatus === "pending" && (
                    <TouchableOpacity onPress={handleFollowToggle} style={[styles.editProfileBtn, { backgroundColor: tk.card, borderWidth: 1, borderColor: tk.border }]}>
                      <Text style={[styles.editProfileBtnText, { color: tk.text }]}>{t("requested")}</Text>
                    </TouchableOpacity>
                  )}
                  {userProfile?.followStatus === "accepted" && (
                    <>
                      <TouchableOpacity onPress={handleFollowToggle} style={[styles.editProfileBtn, { backgroundColor: tk.card, borderWidth: 1, borderColor: tk.border }]}>
                        <Text style={[styles.editProfileBtnText, { color: tk.text }]}>{t("following")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleMessage} style={[styles.editProfileBtn, { backgroundColor: tk.card, borderWidth: 1, borderColor: tk.border }]}>
                        <Text style={[styles.editProfileBtnText, { color: tk.text }]}>{t("messageLabel")}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Private state */}
            {userProfile && !userProfile.canViewContent ? (
              <View style={{ alignItems: "center", justifyContent: "center", marginTop: 40, padding: 20 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.foreground + "0A", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Bookmark size={32} color={tk.textMuted} />
                </View>
                <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 18, color: tk.text }}>{t("accountIsPrivate")}</Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted, marginTop: 4, textAlign: "center" }}>{t("followToSeePosts")}</Text>
              </View>
            ) : (
              <>
                {/* Pets rail */}
                {(userProfile?.pets || []).length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsScroll} contentContainerStyle={styles.petsContent}>
                    {userProfile.pets.map((p: any) => (
                      <TouchableOpacity key={p.id} onPress={() => router.replace(isOwnProfile ? { pathname: "/pet", params: { id: p.id } } : { pathname: "/p/[id]", params: { id: p.id } })} style={[styles.petChip, { backgroundColor: tk.card }]}>
                        <View style={styles.petAvatar}>
                          {p.avatar_url
                            ? <Image source={{ uri: p.avatar_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                            : <Image source={puppy} style={styles.petAvatarImg} />}
                        </View>
                        <Text style={[styles.petName, { color: tk.text }]}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Tabs — only show Saved for own profile */}
                <View style={[styles.tabsRow, { borderBottomColor: tk.border }]}>
                  {tabs
                    .filter(tItem => tItem !== "Saved" || isOwnProfile)
                    .map((tItem) => {
                      const Icon = tabIcons[tItem];
                      const active = tab === tItem;
                      return (
                        <TouchableOpacity key={tItem} onPress={() => setTab(tItem)} style={styles.tabItem}>
                          <Icon size={16} color={active ? colors.primary : tk.textMuted} />
                          <Text style={[styles.tabText, { color: active ? colors.primary : tk.textMuted }]}>
                            {tItem === "Posts" ? t("postsLabel") : (tItem === "Pets" ? t("pets") : t("saved"))}
                          </Text>
                          {active && <View style={styles.tabActiveBar} />}
                        </TouchableOpacity>
                      );
                    })}
                </View>

                {/* Grid */}
                {tab === "Pets" ? (
                  // Pets tab — large cards
                  <View style={styles.petsGrid}>
                    {(userProfile?.pets || []).map((p: any, i: number) => (
                      <TouchableOpacity key={p.id} onPress={() => router.replace(isOwnProfile ? { pathname: "/pet", params: { id: p.id } } : { pathname: "/p/[id]", params: { id: p.id } })} style={[styles.petGridCard, { backgroundColor: i % 2 === 0 ? "rgba(255,107,107,0.12)" : "rgba(37,99,235,0.08)" }]} activeOpacity={0.85}>
                        <View style={styles.petGridImgWrap}>
                          {p.avatar_url
                            ? <Image source={{ uri: p.avatar_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                            : <Image source={puppy} style={{ width: "70%", height: "70%" }} resizeMode="contain" />}
                        </View>
                        <Text style={[styles.petGridName, { color: tk.text }]}>{p.name}</Text>
                        <Text style={[styles.petGridBreed, { color: tk.textMuted }]}>{p.breed || p.species}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : loadingTab ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                ) : gridData.length === 0 ? (
                  <View style={{ paddingVertical: 48, alignItems: "center", paddingHorizontal: 40 }}>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted, textAlign: "center", lineHeight: 22 }}>
                      {tab === "Posts" ? t("noPostsYet") : t("noSavedPostsYet")}
                    </Text>
                  </View>
                ) : (
                  // Photo grid
                  <View style={styles.grid}>
                    {gridData.map((p: any) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => router.push(`/post/${p.id}`)}
                        style={[styles.gridItem, { backgroundColor: tk.card }]}
                        activeOpacity={0.85}
                      >
                        {p.imageUrl ? (
                          p.imageUrl.match(/\.(mp4|mov|quicktime|3gp|mpeg|avi|wmv|flv|mkv|webm)(\?|$)/i) ? (
                            <View style={{ width: "100%", height: "100%", position: "relative" }}>
                              <Video
                                source={{ uri: p.imageUrl }}
                                style={{ width: "100%", height: "100%" }}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={false}
                                isMuted={true}
                              />
                              <View style={styles.videoBadge}>
                                <Play size={12} color="#fff" fill="#fff" />
                              </View>
                            </View>
                          ) : (
                            <Image source={{ uri: p.imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                          )
                        ) : (
                          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 4 }}>
                            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 10, color: tk.textMuted, textAlign: "center" }} numberOfLines={4}>{p.content}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}
      </View>

      {/* ── 3-dot Menu Modal ── */}
      <Modal visible={menuOpen} transparent animationType={isTablet ? "fade" : "slide"} onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={[styles.menuOverlay, isTablet && styles.menuOverlayCenter]} onPress={() => setMenuOpen(false)}>
          <Pressable style={[isTablet ? styles.menuDialog : styles.menuSheet, { backgroundColor: tk.card }]} onPress={(e) => e.stopPropagation()}>
            {!isTablet && <View style={styles.menuHandle} />}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleBlockUser}
              disabled={isBlocking}
            >
              <ShieldOff size={22} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: "#EF4444" }]}>{t("blockUserLabel").replace("{username}", userProfile?.username || handle)}</Text>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: tk.border }]} />
            <TouchableOpacity style={styles.menuItem} onPress={handleReportUser}>
              <Flag size={22} color={tk.textMuted} />
              <Text style={[styles.menuItemText, { color: tk.text }]}>{t("report")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuCancelBtn, { backgroundColor: tk.bg }]}
              onPress={() => setMenuOpen(false)}
            >
              <Text style={[styles.menuCancelText, { color: tk.text }]}>{t("cancel")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Report Flow Modal */}
      <Modal visible={reportModalOpen} animationType="slide" transparent={false} onRequestClose={() => setReportModalOpen(false)}>
        <View style={[styles.reportContainer, { backgroundColor: tk.bg, paddingTop: insets.top }]}>
          {/* Header */}
          <View style={[styles.reportHeader, { borderBottomColor: tk.border }]}>
            <View style={{ width: 40 }} />
            <Text style={[styles.reportHeaderTitle, { color: tk.text }]}>{t("report")}</Text>
            <TouchableOpacity onPress={() => setReportModalOpen(false)} style={styles.reportCloseBtn}>
              <X size={24} color={tk.text} />
            </TouchableOpacity>
          </View>

          {reportStep === 1 ? (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.reportContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.reportTitle, { color: tk.text }]}>{t("whyReportingUser")}</Text>
              <Text style={[styles.reportSubtitle, { color: tk.textMuted }]}>
                {t("reportDisclaimer")}
              </Text>

              <View style={{ marginTop: 24 }}>
                {[
                  t("reasonDontLikeIt"),
                  t("reasonBullying"),
                  t("reasonSuicideSelfInjury"),
                  t("reasonViolenceHate"),
                  t("reasonRestrictedItems"),
                  t("reasonNudity"),
                  t("reasonScamSpam"),
                  t("reasonFalseInfo"),
                  t("reasonIntellectualProperty")
                ].map((reason, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.reasonRow, { borderBottomColor: tk.border }]}
                    onPress={() => handleSelectReason(reason)}
                  >
                    <Text style={[styles.reasonText, { color: tk.text }]}>{reason}</Text>
                    <ChevronRight size={20} color={tk.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successContent}>
                <View style={[styles.checkCircle, { backgroundColor: tk.border }]}>
                  <Check size={40} color={colors.primary} strokeWidth={3} />
                </View>
                <Text style={[styles.successTitle, { color: tk.text }]}>{t("thanksFeedback")}</Text>
                <Text style={[styles.successSubtitle, { color: tk.textMuted }]}>
                  {t("reportFeedbackDetail")}
                </Text>
              </View>
              
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setReportModalOpen(false)}
                >
                  <Text style={styles.doneBtnText}>{t("done")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
      {/* Share Sheet */}
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        username={userProfile?.username || handle}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px5: { paddingHorizontal: 20 },
  profileCard: { borderRadius: 24, padding: 20 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarWrap: { width: 80, height: 80, borderRadius: 40, overflow: "hidden", backgroundColor: "rgba(255,107,107,0.2)" },
  avatarImg: { width: "100%", height: "100%" },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statNum: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  displayName: { fontFamily: "Poppins_700Bold", fontSize: 20, marginTop: 14 },
  bio: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 20 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  locationText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  editProfileBtn: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 20, paddingVertical: 10 },
  editProfileBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  // Pets rail
  petsScroll: { flexGrow: 0, marginTop: 16 },
  petsContent: { paddingHorizontal: 20, gap: 10 },
  petChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 20, paddingLeft: 6, paddingRight: 16, paddingVertical: 6 },
  petAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(255,107,107,0.2)" },
  petAvatarImg: { width: "100%", height: "100%" },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  // Tabs
  tabsRow: { flexDirection: "row", borderBottomWidth: 1, marginTop: 16, paddingHorizontal: 20 },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, position: "relative" },
  tabText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  tabActiveBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary },
  // Photo grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 5, paddingTop: 4 },
  gridItem: { width: "32.5%", aspectRatio: 1, overflow: "hidden" },
  videoBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0, 0, 0, 0.45)", borderRadius: 12, padding: 5, alignItems: "center", justifyContent: "center" },
  // Pets grid
  petsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 20 },
  petGridCard: { width: "47%", borderRadius: 22, padding: 14, alignItems: "center" },
  petGridImgWrap: { width: "100%", height: 100, borderRadius: 14, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" },
  petGridName: { fontFamily: "Poppins_700Bold", fontSize: 15, marginTop: 10 },
  petGridBreed: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  // Menu modal
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  menuOverlayCenter: { justifyContent: "center", alignItems: "center" },
  menuDialog: { borderRadius: 24, padding: 24, width: 360 },
  menuSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 28 },
  menuHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#ccc", alignSelf: "center", marginBottom: 12 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  menuItemText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  menuDivider: { height: 1, marginVertical: 4 },
  menuCancelBtn: { marginTop: 12, borderRadius: 20, paddingVertical: 14, alignItems: "center" },
  menuCancelText: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  reportContainer: { flex: 1 },
  reportHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 56, paddingHorizontal: 16, borderBottomWidth: 1 },
  reportHeaderTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, textAlign: "center" },
  reportCloseBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  reportContent: { padding: 24 },
  reportTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, textAlign: "center", marginTop: 16, marginBottom: 8 },
  reportSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 18, paddingHorizontal: 16, marginBottom: 16 },
  reasonRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 0.5 },
  reasonText: { fontFamily: "Inter_400Regular", fontSize: 15, flex: 1, paddingRight: 16 },
  successContainer: { flex: 1, justifyContent: "space-between" },
  successContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, marginTop: -40 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, textAlign: "center", marginBottom: 12 },
  successSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  footer: { paddingHorizontal: 24 },
  doneBtn: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  doneBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },
});
