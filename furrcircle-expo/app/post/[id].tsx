import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react-native";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Avatar } from "../../src/components/Avatar";
import { posts, sampleComments } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";

const commentImgs: Record<string, any> = {
  "Aanya P.":         require("../../src/assets/doodle-cat.png"),
  "Mehul S.":         require("../../src/assets/doodle-birthday.png"),
  "Indie Dogs India": require("../../src/assets/doodle-group.png"),
  "Priya M.":         require("../../src/assets/doodle-walk.png"),
};

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = posts.find((p) => p.id === id) ?? posts[0];
  const tk = useTokens();

  return (
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title={post.pet} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.imageWrapper, { backgroundColor: post.tintColor }]}>
          <Image source={post.image} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}><Heart size={26} color={tk.text} /><Text style={[styles.actionCount, { color: tk.text }]}>{post.likes}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><MessageCircle size={26} color={tk.text} /><Text style={[styles.actionCount, { color: tk.text }]}>{post.comments}</Text></TouchableOpacity>
          <TouchableOpacity><Send size={26} color={tk.text} /></TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: "auto" }}><Bookmark size={26} color={tk.text} /></TouchableOpacity>
        </View>

        <Text style={[styles.caption, { color: tk.text }]}><Text style={styles.bold}>{post.pet} </Text>{post.caption}</Text>
        <Text style={styles.tags}>{post.tags.map((t) => `#${t}`).join("  ")}</Text>

        <Text style={[styles.commentsTitle, { color: tk.text }]}>Comments</Text>
        {sampleComments.map((c) => (
          <View key={c.id} style={styles.comment}>
            <Avatar source={commentImgs[c.author]} name={c.author} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.commentAuthor, { color: tk.text }]}>{c.author}</Text>
              <Text style={[styles.commentBody, { color: tk.textMuted }]}>{c.body}</Text>
            </View>
            <Text style={[styles.commentLikes, { color: tk.textMuted }]}>♡ {c.likes}</Text>
          </View>
        ))}

        <View style={styles.replyBar}>
          <TextInput placeholder="Add a comment…" placeholderTextColor={tk.textMuted}
            style={[styles.replyInput, { backgroundColor: tk.card, color: tk.text }]} />
          <TouchableOpacity style={styles.sendBtn}><Send size={18} color="#fff" /></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrapper: { margin: 16, borderRadius: 20, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
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
