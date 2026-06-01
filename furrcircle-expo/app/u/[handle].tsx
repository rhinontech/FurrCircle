import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Share2, MapPin, Grid3x3, Bookmark, Bone, Play } from "lucide-react-native";
import { PageContainer } from "../../src/components/PageContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useAuthStore } from "../../src/lib/auth-store";
import { userApi } from "../../services/user/userApi";
import { feedApi } from "../../services/community/feedApi";
import { chatApi } from "../../services/chat/chatApi";
import { Video, ResizeMode } from "expo-av";

const GRID_SIZE = (Dimensions.get("window").width - 12) / 3;
const puppy = require("../../src/assets/doodle-puppy.png");
const tabs = ["Posts", "Pets", "Saved"] as const;
const tabIcons = { Posts: Grid3x3, Pets: Bone, Saved: Bookmark };

function StatItem({ n, l, tk }: { n: string; l: string; tk: any }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statNum, { color: tk.text }]}>{n}</Text>
      <Text style={[styles.statLabel, { color: tk.textMuted }]}>{l}</Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const tk = useTokens();
  const { user: me } = useAuthStore();

  const [tab, setTab] = useState<(typeof tabs)[number]>("Posts");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab data
  const [posts, setPosts] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  const isOwnProfile = me?.username === handle;

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

  useFocusEffect(
    useCallback(() => {
      if (!handle) return;
      setLoading(true);
      userApi.getUserProfile(handle as string)
        .then(data => { setUserProfile(data); setLoading(false); })
        .catch(err => { console.error("Failed to load profile:", err); setLoading(false); });

      // Load posts (own or other)
      setLoadingTab(true);
      const postsPromise = isOwnProfile ? feedApi.getMyPosts() : feedApi.getUserPosts(handle);
      postsPromise
        .then(setPosts)
        .catch(() => setPosts([]))
        .finally(() => setLoadingTab(false));

      // Load saved only for own profile
      if (isOwnProfile) {
        feedApi.getSavedPosts().then(setSaved).catch(() => setSaved([]));
      }
    }, [handle, isOwnProfile])
  );

  const gridData = tab === "Posts" ? posts : tab === "Saved" ? saved : [];

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader
          title={`@${handle}`}
          right={
            <TouchableOpacity style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: tk.card }}>
              <Share2 size={20} color={tk.text} />
            </TouchableOpacity>
          }
        />

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
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
                    <StatItem n={(posts.length || userProfile?.postCount || 0).toString()} l="Posts" tk={tk} />
                    <StatItem n={(userProfile?.followersCount || 0).toString()} l="Followers" tk={tk} />
                    <StatItem n={(userProfile?.followingCount || 0).toString()} l="Following" tk={tk} />
                  </View>
                </View>

                {/* Name + bio */}
                <Text style={[styles.displayName, { color: tk.text }]}>{userProfile?.name || handle}</Text>
                {userProfile?.bio && <Text style={[styles.bio, { color: tk.textMuted }]}>{userProfile.bio}</Text>}
                <View style={styles.locationRow}>
                  <MapPin size={12} color={tk.textMuted} />
                  <Text style={[styles.locationText, { color: tk.textMuted }]}>{userProfile?.city || "Location unknown"}</Text>
                </View>

                {/* Action buttons */}
                <View style={styles.actionRow}>
                  {userProfile?.followStatus === "self" && (
                    <TouchableOpacity onPress={() => router.push("/edit-profile")} style={[styles.editProfileBtn, { backgroundColor: tk.text + "15" }]}>
                      <Text style={[styles.editProfileBtnText, { color: tk.text }]}>Edit profile</Text>
                    </TouchableOpacity>
                  )}
                  {userProfile?.followStatus === "none" && (
                    <TouchableOpacity onPress={handleFollowToggle} style={[styles.editProfileBtn, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.editProfileBtnText, { color: colors.white }]}>Follow</Text>
                    </TouchableOpacity>
                  )}
                  {userProfile?.followStatus === "pending" && (
                    <TouchableOpacity onPress={handleFollowToggle} style={[styles.editProfileBtn, { backgroundColor: tk.card, borderWidth: 1, borderColor: tk.border }]}>
                      <Text style={[styles.editProfileBtnText, { color: tk.text }]}>Requested</Text>
                    </TouchableOpacity>
                  )}
                  {userProfile?.followStatus === "accepted" && (
                    <>
                      <TouchableOpacity onPress={handleFollowToggle} style={[styles.editProfileBtn, { backgroundColor: tk.card, borderWidth: 1, borderColor: tk.border }]}>
                        <Text style={[styles.editProfileBtnText, { color: tk.text }]}>Following</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleMessage} style={[styles.editProfileBtn, { backgroundColor: tk.card, borderWidth: 1, borderColor: tk.border }]}>
                        <Text style={[styles.editProfileBtnText, { color: tk.text }]}>Message</Text>
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
                <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 18, color: tk.text }}>This account is private</Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted, marginTop: 4, textAlign: "center" }}>Follow this account to see their posts.</Text>
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
                          {(p.isAdoptionOpen || p.isFosterOpen) && (
                            <View style={{ position: "absolute", top: 0, right: 0, left: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
                              <Text style={{ color: colors.white, fontSize: 8, fontFamily: "Poppins_700Bold" }}>
                                {p.isAdoptionOpen && p.isFosterOpen ? "ADOPT/FOSTER" : p.isAdoptionOpen ? "ADOPT" : "FOSTER"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.petName, { color: tk.text }]}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Tabs — only show Saved for own profile */}
                <View style={[styles.tabsRow, { borderBottomColor: tk.border }]}>
                  {tabs
                    .filter(t => t !== "Saved" || isOwnProfile)
                    .map((t) => {
                      const Icon = tabIcons[t];
                      const active = tab === t;
                      return (
                        <TouchableOpacity key={t} onPress={() => setTab(t)} style={styles.tabItem}>
                          <Icon size={16} color={active ? colors.coral : tk.textMuted} />
                          <Text style={[styles.tabText, { color: active ? colors.coral : tk.textMuted }]}>{t}</Text>
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
                      <TouchableOpacity key={p.id} onPress={() => router.push({ pathname: "/pet", params: { id: p.id } })} style={[styles.petGridCard, { backgroundColor: i % 2 === 0 ? "rgba(255,107,107,0.12)" : "rgba(37,99,235,0.08)" }]} activeOpacity={0.85}>
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
                      {tab === "Posts" ? "No posts yet." : "No saved posts yet."}
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
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px5: { paddingHorizontal: 20 },
  profileCard: { borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
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
  petChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 20, paddingLeft: 6, paddingRight: 16, paddingVertical: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  petAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(255,107,107,0.2)" },
  petAvatarImg: { width: "100%", height: "100%" },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  // Tabs
  tabsRow: { flexDirection: "row", borderBottomWidth: 1, marginTop: 16, paddingHorizontal: 20 },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, position: "relative" },
  tabText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  tabActiveBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.coral },
  // Photo grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2, paddingTop: 2 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, overflow: "hidden" },
  videoBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: 12,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  // Pets grid
  petsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 20 },
  petGridCard: { width: "47%", borderRadius: 22, padding: 14, alignItems: "center" },
  petGridImgWrap: { width: "100%", height: 100, borderRadius: 14, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" },
  petGridName: { fontFamily: "Poppins_700Bold", fontSize: 15, marginTop: 10 },
  petGridBreed: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
