import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react-native";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Avatar } from "../../src/components/Avatar";
import { posts, sampleComments } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { ShareSheet } from "../../src/components/ShareSheet";

const commentImgs: Record<string, any> = {
  "Aanya P.":         require("../../src/assets/doodle-cat.png"),
  "Mehul S.":         require("../../src/assets/doodle-birthday.png"),
  "Indie Dogs India": require("../../src/assets/doodle-group.png"),
  "Priya M.":         require("../../src/assets/doodle-walk.png"),
};

const authorHandles: Record<string, string> = {
  "Aanya P.": "aanya",
  "Mehul S.": "mehul",
  "Indie Dogs India": "indiedogs",
  "Priya M.": "priya",
};

export default function PostDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = posts.find((p) => p.id === id) ?? posts[0];
  const tk = useTokens();
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title={post.pet} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
        <View style={[styles.imageWrapper, { backgroundColor: post.tintColor }]}>
          <Image source={post.image} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}><Heart size={26} color={tk.text} /><Text style={[styles.actionCount, { color: tk.text }]}>{post.likes}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><MessageCircle size={26} color={tk.text} /><Text style={[styles.actionCount, { color: tk.text }]}>{post.comments}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setShareOpen(true)}><Send size={26} color={tk.text} /></TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: "auto" }}><Bookmark size={26} color={tk.text} /></TouchableOpacity>
        </View>

        <Text style={[styles.caption, { color: tk.text }]}><Text style={styles.bold}>{post.pet} </Text>{post.caption}</Text>
        <Text style={styles.tags}>{post.tags.map((t) => `#${t}`).join("  ")}</Text>

        <Text style={[styles.commentsTitle, { color: tk.text }]}>Comments</Text>
        {sampleComments.map((c) => {
          const handle = authorHandles[c.author] || c.author.toLowerCase().replace(/[^a-z0-9]/g, "");
          return (
            <View key={c.id} style={styles.comment}>
              <TouchableOpacity onPress={() => router.push(`/user/${handle}`)} activeOpacity={0.7}>
                <Avatar source={commentImgs[c.author]} name={c.author} size={36} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text 
                  onPress={() => router.push(`/user/${handle}`)}
                  style={[styles.commentAuthor, { color: tk.text }]}
                >
                  {c.author}
                </Text>
                <Text style={[styles.commentBody, { color: tk.textMuted }]}>{c.body}</Text>
              </View>
              <Text style={[styles.commentLikes, { color: tk.textMuted }]}>♡ {c.likes}</Text>
            </View>
          );
        })}

        <View style={styles.replyBar}>
          <TextInput placeholder="Add a comment…" placeholderTextColor={tk.textMuted}
            style={[styles.replyInput, { backgroundColor: tk.card, color: tk.text }]} />
          <TouchableOpacity style={styles.sendBtn}><Send size={18} color="#fff" /></TouchableOpacity>
        </View>
      </ScrollView>
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} postId={post.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrapper: { width: "92%", alignSelf: "center", aspectRatio: 1, marginTop: 12, marginBottom: 8, borderRadius: 20, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "80%", height: "80%" },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  caption: { paddingHorizontal: 16, paddingTop: 10, fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
  bold: { fontFamily: "Poppins_700Bold" },
  tags: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, fontSize: 12, color: colors.primary, fontFamily: "Poppins_600SemiBold" },
  commentsTitle: { paddingHorizontal: 16, fontFamily: "Poppins_700Bold", fontSize: 16, marginBottom: 12 },
  comment: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  commentAuthor: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  commentBody: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  commentLikes: { fontSize: 12, fontFamily: "Inter_400Regular", paddingTop: 4 },
  replyBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  replyInput: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
