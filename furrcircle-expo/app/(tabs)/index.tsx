import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Modal, Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { Heart, MessageCircle, Send, Bookmark, Plus, Bell, Search } from "lucide-react-native";
import { useState } from "react";
import { posts, type Post } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { Avatar } from "../../src/components/Avatar";
import { useTokens, useThemeStore } from "../../src/lib/theme-store";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [composeOpen, setComposeOpen] = useState(false);
  const tk = useTokens();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tk.bg }]}>
      <FeedHeader />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}>
        <StoryRail />
        <View style={styles.feedList}>
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </View>
      </ScrollView>

      <TouchableOpacity onPress={() => setComposeOpen(true)} style={styles.fab} activeOpacity={0.85}>
        <Plus size={28} color="#fff" strokeWidth={2.4} />
      </TouchableOpacity>

      <ComposeSheet open={composeOpen} onClose={() => setComposeOpen(false)} />
    </View>
  );
}

function FeedHeader() {
  const router = useRouter();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);

  const logoSource = dark
    ? require("../../src/assets/furrcircle_dark_logo.png")
    : require("../../src/assets/furrcircle_light_logo.png");

  return (
    <View style={[styles.header, { backgroundColor: tk.bg }]}>
      <View>
        <Image
          source={logoSource}
          style={styles.logoImg}
          resizeMode="contain"
        />
        <Text style={[styles.subtitle, { color: tk.textMuted }]}>Today's circle, picked for Moona</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={() => router.push("/chat")} style={[styles.iconBtn, { backgroundColor: tk.card }]}>
          <MessageCircle size={20} color={tk.text} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/notifications")} style={[styles.iconBtn, { backgroundColor: tk.card }]}>
          <Bell size={20} color={tk.text} strokeWidth={2} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const stories = [
  { label: "Your reel", isYou: true, tintColor: "rgba(26,26,46,0.09)", img: null },
  { label: "Moona", tintColor: "rgba(255,107,107,0.2)", img: require("../../src/assets/doodle-boy-dog.png") },
  { label: "Mochi", tintColor: "rgba(37,99,235,0.12)", img: require("../../src/assets/doodle-cat.png") },
  { label: "Kobi", tintColor: "rgba(255,217,61,0.35)", img: require("../../src/assets/doodle-birthday.png") },
  { label: "Biscuit", tintColor: "rgba(255,111,207,0.2)", img: require("../../src/assets/doodle-puppy.png") },
  { label: "Rocky", tintColor: "rgba(76,175,80,0.18)", img: require("../../src/assets/doodle-rescue.png") },
];

function StoryRail() {
  const router = useRouter();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={styles.storyRail}
      contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 14 }}>
      {stories.map((s) => (
        <TouchableOpacity key={s.label} onPress={() => router.push("/reels")} style={styles.storyItem} activeOpacity={0.8}>
          <View style={[styles.storyRing, s.isYou ? (dark ? { backgroundColor: tk.border } : styles.storyRingGray) : styles.storyRingGradient]}>
            <View style={[styles.storyInner, { backgroundColor: s.isYou ? (dark ? "rgba(240,240,255,0.08)" : "rgba(26,26,46,0.05)") : s.tintColor, borderColor: tk.bg }]}>
              {s.isYou
                ? <Plus size={20} color={tk.textMuted} />
                : <Image source={s.img!} style={styles.storyImg} resizeMode="contain" />
              }
            </View>
          </View>
          <Text style={[styles.storyLabel, { color: tk.text }]} numberOfLines={1}>{s.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const tk = useTokens();
  return (
    <View style={[styles.card, { backgroundColor: tk.card }]}>
      <View style={styles.cardHeader}>
        <Avatar source={post.avatar} name={post.pet} size={44} />
        <View style={styles.cardMeta}>
          <Text style={[styles.petName, { color: tk.text }]}>{post.pet}</Text>
          <Text style={[styles.petOwner, { color: tk.textMuted }]}>by {post.owner} · {post.time}</Text>
        </View>
        {post.type === "rescue" && <View style={[styles.typeBadge, { backgroundColor: colors.success }]}><Text style={styles.typeBadgeText}>RESCUE</Text></View>}
        {post.type === "milestone" && <View style={[styles.typeBadge, { backgroundColor: colors.pinky }]}><Text style={styles.typeBadgeText}>MILESTONE</Text></View>}
      </View>

      <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.9}
        style={[styles.imageWrapper, { backgroundColor: post.tintColor }]}>
        <Image source={post.image} style={styles.postImage} />
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}><Heart size={24} color={tk.text} /><Text style={[styles.actionCount, { color: tk.text }]}>{post.likes}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}><MessageCircle size={24} color={tk.text} /><Text style={[styles.actionCount, { color: tk.text }]}>{post.comments}</Text></TouchableOpacity>
        <TouchableOpacity><Send size={24} color={tk.text} /></TouchableOpacity>
        <TouchableOpacity style={{ marginLeft: "auto" }}><Bookmark size={24} color={tk.text} /></TouchableOpacity>
      </View>

      <Text style={[styles.caption, { color: tk.text }]}>
        <Text style={styles.captionBold}>{post.pet} </Text>{post.caption}
      </Text>
      <Text style={styles.tags}>{post.tags.map((t) => `#${t}`).join("  ")}</Text>
    </View>
  );
}

const composeOptions = [
  { label: "New Post", desc: "Share a photo of your pet", tintColor: "rgba(255,107,107,0.15)", to: "/compose" as const },
  { label: "New Reel", desc: "Quick video moment", tintColor: "rgba(37,99,235,0.1)", to: "/reels" as const },
  { label: "Ask the Community", desc: "Get help from pet parents", tintColor: "rgba(255,217,61,0.3)", to: "/ask" as const },
  { label: "Add Memory", desc: "Save to Moona's vault", tintColor: "rgba(255,111,207,0.15)", to: "/memory" as const },
];

function ComposeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const tk = useTokens();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: tk.card }]}>
          <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />
          <Text style={[styles.sheetTitle, { color: tk.text }]}>Create</Text>
          {composeOptions.map((o) => (
            <TouchableOpacity key={o.label} onPress={() => { onClose(); router.push(o.to); }}
              style={[styles.sheetRow, { backgroundColor: tk.bg }]} activeOpacity={0.8}>
              <View style={[styles.sheetIcon, { backgroundColor: o.tintColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetRowTitle, { color: tk.text }]}>{o.label}</Text>
                <Text style={[styles.sheetRowDesc, { color: tk.textMuted }]}>{o.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, paddingTop:10 },
  logoImg: { width: 120, height: 50, alignSelf: "flex-start" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -4, marginLeft: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  notifDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral },
  storyRail: { flexGrow: 0 },
  storyItem: { alignItems: "center", width: 64, gap: 6 },
  storyRing: { width: 64, height: 64, borderRadius: 32, padding: 3 },
  storyRingGray: { backgroundColor: "rgba(26,26,46,0.15)" },
  storyRingGradient: { backgroundColor: colors.coral },
  storyInner: { flex: 1, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#F7F8FA", overflow: "hidden" },
  storyImg: { width: "90%", height: "90%" },
  storyLabel: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: colors.foreground + "bb", textAlign: "center" },
  feedList: { gap: 20, paddingHorizontal: 16, marginTop: 12, width: "100%" },
  card: { borderRadius: 24, alignSelf: "stretch", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 0, gap: 10 },
  cardMeta: { flex: 1 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 14, lineHeight: 20 },
  petOwner: { fontSize: 11, fontFamily: "Inter_400Regular" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: "#fff" },
  imageWrapper: { width: "92%", alignSelf: "center", aspectRatio: 1, marginTop: 12, marginBottom: 4, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  postImage: { width: "80%", height: "80%" },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  caption: { paddingHorizontal: 16, paddingTop: 8, fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular" },
  captionBold: { fontFamily: "Poppins_700Bold" },
  tags: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4, fontSize: 12, fontFamily: "Poppins_600SemiBold", color: colors.primary },
  fab: { position: "absolute", bottom: 16, right: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 16, opacity: 0.2 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, paddingHorizontal: 4, marginBottom: 12 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 16, padding: 16, marginBottom: 8 },
  sheetIcon: { width: 48, height: 48, borderRadius: 16 },
  sheetRowTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  sheetRowDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
