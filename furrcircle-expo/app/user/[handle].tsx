import { useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Share2, UserPlus, MapPin, Grid3x3, Bookmark, Bone, MessageCircle, Play } from "../../src/components/ui/icons";
import { PageContainer } from "../../src/components/PageContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { Video, ResizeMode } from "expo-av";

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

export default function PublicUserProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const tk = useTokens();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Posts");
  const [following, setFollowing] = useState(false);

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

        <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
          {/* Profile card */}
          <View style={styles.px5}>
            <View style={[styles.profileCard, { backgroundColor: tk.card }]}>
              {/* Avatar + stats */}
              <View style={styles.profileTop}>
                <View style={[styles.avatarWrap, { borderColor: tk.card }]}>
                  <Image source={boyDog} style={styles.avatarImg} resizeMode="cover" />
                </View>
                <View style={styles.statsRow}>
                  <StatItem n="48" l="Posts" tk={tk} />
                  <StatItem n="1.2k" l="Followers" tk={tk} />
                  <StatItem n="312" l="Following" tk={tk} />
                </View>
              </View>
              {/* Name + bio */}
              <Text style={[styles.displayName, { color: tk.text }]}>Goutham R.</Text>
              <Text style={[styles.bio, { color: tk.textMuted }]}>Dad to Moona 🐕 & Kobi 🐈 · positive-reinforcement believer.</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={tk.textMuted} />
                <Text style={[styles.locationText, { color: tk.textMuted }]}>Mumbai, India</Text>
              </View>
              {/* Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => setFollowing(!following)}
                  style={[styles.followBtn, following ? { backgroundColor: tk.text + "15" } : { backgroundColor: colors.primary }]}
                >
                  <UserPlus size={16} color={following ? tk.text : "#FFFFFF"} />
                  <Text style={[styles.followBtnText, { color: following ? tk.text : "#FFFFFF" }]}>
                    {following ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => router.push("/chat")} 
                  style={[styles.messageBtn, { backgroundColor: tk.text + "10" }]}
                >
                  <MessageCircle size={16} color={tk.text} />
                  <Text style={[styles.messageBtnText, { color: tk.text }]}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Pets rail */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsScroll} contentContainerStyle={styles.petsContent}>
            {pets.map((p) => (
              <TouchableOpacity
                key={p.name}
                onPress={() => router.replace(`/p/${p.name.toLowerCase()}` as any)}
                style={[styles.petChip, { backgroundColor: tk.card }]}
              >
                <View style={styles.petAvatar}>
                  <Image source={p.img} style={styles.petAvatarImg} resizeMode="cover" />
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

          {/* Post grid */}
          <View style={styles.grid}>
            {gridItems.map((g: any, i) => {
              const isVideo = typeof g.img === "string" && g.img.match(/\.(mp4|mov|quicktime|3gp|mpeg|avi|wmv|flv|mkv|webm)(\?|$)/i);
              return (
                <TouchableOpacity key={i} style={[styles.gridItem, { backgroundColor: g.tint }]}>
                  {isVideo ? (
                    <View style={{ width: "100%", height: "100%", position: "relative" }}>
                      <Video
                        source={{ uri: g.img }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isMuted={true}
                      />
                      <View style={styles.videoBadge}>
                        <Play size={12} color="#fff" fill="#fff" />
                      </View>
                    </View>
                  ) : typeof g.img === "string" ? (
                    <Image source={{ uri: g.img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <Image source={g.img} style={styles.gridImg} resizeMode="contain" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </PageContainer>
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
  profileCard: { borderRadius: 24, padding: 20 },
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
  followBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 20, paddingVertical: 10 },
  followBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  messageBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 20, paddingVertical: 10 },
  messageBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  petsScroll: { flexGrow: 0, marginTop: 16 },
  petsContent: { paddingHorizontal: 20, gap: 10 },
  petChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 20, paddingLeft: 6, paddingRight: 16, paddingVertical: 6 },
  petAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(255,107,107,0.2)" },
  petAvatarImg: { width: "100%", height: "100%" },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  tabsRow: { flexDirection: "row", borderBottomWidth: 1, marginTop: 16, paddingHorizontal: 20 },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, position: "relative" },
  tabText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  tabActiveBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.coral },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4, paddingTop: 4, gap: 4 },
  gridItem: { width: "32.5%", aspectRatio: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  gridImg: { width: "80%", height: "80%" },
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
});
