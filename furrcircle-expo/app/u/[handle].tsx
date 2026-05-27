import { useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Share2, UserPlus, MapPin, Grid3x3, Bookmark, Bone } from "lucide-react-native";
import { PageContainer } from "../../src/components/PageContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { userApi } from "../../services/user/userApi";

const boyDog = require("../../src/assets/doodle-boy-dog.png");
const puppy = require("../../src/assets/doodle-puppy.png");
const cat = require("../../src/assets/doodle-cat.png");
const group = require("../../src/assets/doodle-group.png");
const walk = require("../../src/assets/doodle-walk.png");
const birthday = require("../../src/assets/doodle-birthday.png");
const rescue = require("../../src/assets/doodle-rescue.png");

const gridItems = [
  { img: boyDog, tint: "rgba(255,107,107,0.2)" },
  { img: walk, tint: "rgba(37,99,235,0.15)" },
  { img: birthday, tint: "rgba(255,111,207,0.15)" },
  { img: group, tint: "rgba(76,175,80,0.15)" },
  { img: rescue, tint: "rgba(255,217,61,0.3)" },
  { img: cat, tint: "rgba(255,111,207,0.2)" },
  { img: puppy, tint: "rgba(255,217,61,0.3)" },
  { img: boyDog, tint: "rgba(37,99,235,0.1)" },
  { img: walk, tint: "rgba(255,107,107,0.15)" },
];

const tabs = ["Posts", "Pets", "Saved"] as const;
const tabIcons = { Posts: Grid3x3, Pets: Bone, Saved: Bookmark };

const pets = [
  { name: "Moona", img: puppy },
  { name: "Kobi", img: cat },
];

export default function UserProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const tk = useTokens();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Posts");
  const [following, setFollowing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleFollowToggle = async () => {
    if (!userProfile) return;
    try {
      if (userProfile.followStatus === 'none') {
        const res = await userApi.followUser(userProfile.id);
        setUserProfile({ ...userProfile, followStatus: res.status });
      } else {
        await userApi.unfollowUser(userProfile.id);
        setUserProfile({ ...userProfile, followStatus: 'none', followersCount: userProfile.followersCount - 1 });
      }
    } catch (err) {
      console.error('Failed to toggle follow', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (handle) {
        setLoading(true);
        userApi.getUserProfile(handle as string)
          .then(data => {
            setUserProfile(data);
            setLoading(false);
          })
          .catch(err => {
            console.error("Failed to load profile:", err);
            setLoading(false);
          });
      }
    }, [handle])
  );

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader
          title={`@${handle}`}
          right={
            <TouchableOpacity style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: tk.bg }}>
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
                <View style={[styles.avatarWrap, { borderColor: tk.card }]}>
                  <Image source={userProfile?.avatar_url ? { uri: userProfile.avatar_url } : boyDog} style={styles.avatarImg} resizeMode="cover" />
                </View>
                <View style={styles.statsRow}>
                  <StatItem n={userProfile?.postCount?.toString() || "0"} l="Posts" tk={tk} />
                  <StatItem n={userProfile?.followersCount?.toString() || "0"} l="Followers" tk={tk} />
                  <StatItem n={userProfile?.followingCount?.toString() || "0"} l="Following" tk={tk} />
                </View>
              </View>
              {/* Name + bio */}
              <Text style={[styles.displayName, { color: tk.text }]}>{userProfile?.name || handle}</Text>
              {userProfile?.bio && <Text style={[styles.bio, { color: tk.textMuted }]}>{userProfile.bio}</Text>}
              <View style={styles.locationRow}>
                <MapPin size={12} color={tk.textMuted} />
                <Text style={[styles.locationText, { color: tk.textMuted }]}>{userProfile?.city || "Location unknown"}</Text>
              </View>
              {/* Buttons */}
              <View style={styles.actionRow}>
                {userProfile?.followStatus === 'self' && (
                  <TouchableOpacity
                    onPress={() => router.push("/edit-profile")}
                    style={[styles.editProfileBtn, { backgroundColor: tk.text + "15" }]}
                  >
                    <Text style={[styles.editProfileBtnText, { color: tk.text }]}>Edit profile</Text>
                  </TouchableOpacity>
                )}
                {userProfile?.followStatus === 'none' && (
                  <TouchableOpacity onPress={handleFollowToggle} style={[styles.editProfileBtn, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.editProfileBtnText, { color: colors.white }]}>Follow</Text>
                  </TouchableOpacity>
                )}
                {userProfile?.followStatus === 'pending' && (
                  <TouchableOpacity onPress={handleFollowToggle} style={[styles.editProfileBtn, { backgroundColor: tk.card, borderWidth: 1, borderColor: tk.border }]}>
                    <Text style={[styles.editProfileBtnText, { color: tk.text }]}>Requested</Text>
                  </TouchableOpacity>
                )}
                {userProfile?.followStatus === 'accepted' && (
                  <TouchableOpacity onPress={handleFollowToggle} style={[styles.editProfileBtn, { backgroundColor: tk.card, borderWidth: 1, borderColor: tk.border }]}>
                    <Text style={[styles.editProfileBtnText, { color: tk.text }]}>Following</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Private state */ }
          {userProfile && !userProfile.canViewContent ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 20 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.foreground + "0A", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Bookmark size={32} color={tk.textMuted} />
              </View>
              <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 18, color: tk.text }}>This account is private</Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted, marginTop: 4, textAlign: 'center' }}>Follow this account to see their photos and videos.</Text>
            </View>
          ) : (
            <>
              {/* Pets rail */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsScroll} contentContainerStyle={styles.petsContent}>
                {userProfile?.pets?.map((p: any) => (
                  <TouchableOpacity key={p.id} onPress={() => router.push({ pathname: "/pet", params: { id: p.id } })} style={[styles.petChip, { backgroundColor: tk.card }]}>
                    <View style={styles.petAvatar}>
                      <Image source={p.avatar_url ? { uri: p.avatar_url } : puppy} style={styles.petAvatarImg} resizeMode="cover" />
                    </View>
                    <Text style={[styles.petName, { color: tk.text }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Tabs */}
              <View style={[styles.tabsRow, { borderBottomColor: tk.border }]}>
                {tabs.map((t) => {
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

              {/* Post grid */ }
              <View style={styles.grid}>
                {gridItems.map((g, i) => (
                  <TouchableOpacity key={i} style={[styles.gridItem, { backgroundColor: g.tint }]}>
                    <Image source={g.img} style={styles.gridImg} resizeMode="contain" />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
        )}
      </View >
    </PageContainer >
  );
  }

  function StatItem({ n, l, tk }: { n: string; l: string; tk: any }) {
    return (
      <View style={styles.statItem}>
        <Text style={[styles.statNum, { color: tk.text }]}>{n}</Text>
        <Text style={[styles.statLabel, { color: tk.textMuted }]}>{l}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1 },
    px5: { paddingHorizontal: 20 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
    backArrow: { fontSize: 20, color: colors.foreground, fontFamily: "Poppins_600SemiBold" },
    headerHandle: { fontFamily: "Poppins_700Bold", fontSize: 16 },
    profileCard: { borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
    profileTop: { flexDirection: "row", alignItems: "center", gap: 16 },
    avatarWrap: { width: 80, height: 80, borderRadius: 40, overflow: "hidden", backgroundColor: "rgba(255,107,107,0.2)", borderWidth: 4, borderColor: colors.white },
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
    petsScroll: { flexGrow: 0, marginTop: 16 },
    petsContent: { paddingHorizontal: 20, gap: 10 },
    petChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 20, paddingLeft: 6, paddingRight: 16, paddingVertical: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
    petAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(255,107,107,0.2)" },
    petAvatarImg: { width: "100%", height: "100%" },
    petName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
    tabsRow: { flexDirection: "row", borderBottomWidth: 1, marginTop: 16, paddingHorizontal: 20 },
    tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, position: "relative" },
    tabText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
    tabActiveBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.coral },
    grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4, paddingTop: 4, gap: 4 },
    gridItem: { width: "32.5%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
    gridImg: { width: "80%", height: "80%" },
  });
