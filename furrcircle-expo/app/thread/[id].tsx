import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ArrowUp, MessageCircle, Send } from "lucide-react-native";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { threads, sampleComments } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";

export default function ThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tk = useTokens();
  const thread = threads.find((t) => t.id === id) ?? threads[0];

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Thread" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.question, { backgroundColor: tk.card }]}>
          <View style={[styles.tag, thread.isHealth && styles.tagHealth]}>
            <Text style={[styles.tagText, thread.isHealth && styles.tagTextHealth]}>{thread.tag.toUpperCase()}</Text>
          </View>
          <Text style={[styles.title, { color: tk.text }]}>{thread.title}</Text>
          <Text style={[styles.body, { color: tk.text + "cc" }]}>{thread.body}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.asker, { color: tk.textMuted }]}>— {thread.asker} · {thread.time}</Text>
            <View style={styles.voteBtn}>
              <ArrowUp size={16} color={colors.primary} />
              <Text style={styles.voteCount}>{thread.upvotes}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.answersTitle, { color: tk.text }]}>{thread.answers} Answers</Text>
        {sampleComments.map((c) => (
          <View key={c.id} style={styles.answer}>
            <View style={[styles.answerAvatar, { backgroundColor: tk.bg }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.answerAuthor, { color: tk.text }]}>{c.author}</Text>
              <Text style={[styles.answerBody, { color: tk.text + "cc" }]}>{c.body}</Text>
              <Text style={[styles.answerMeta, { color: tk.textMuted }]}>♡ {c.likes} · {c.time}</Text>
            </View>
          </View>
        ))}

        <View style={styles.replyBar}>
          <TextInput placeholder="Write an answer…" placeholderTextColor={tk.textMuted} style={[styles.replyInput, { backgroundColor: tk.inputBg, color: tk.text }]} />
          <TouchableOpacity style={styles.sendBtn}>
            <Send size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  question: { borderRadius: 20, margin: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  tag: { alignSelf: "flex-start", backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  tagHealth: { backgroundColor: "rgba(76,175,80,0.15)" },
  tagText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: colors.coral },
  tagTextHealth: { color: colors.success },
  title: { fontFamily: "Poppins_700Bold", fontSize: 18, color: colors.foreground, lineHeight: 26, marginBottom: 8 },
  body: { fontSize: 14, color: colors.foreground + "cc", fontFamily: "Inter_400Regular", lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  asker: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  voteBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  voteCount: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.primary },
  answersTitle: { paddingHorizontal: 16, fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.foreground, marginBottom: 12 },
  answer: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  answerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface },
  answerAuthor: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.foreground },
  answerBody: { fontSize: 13, color: colors.foreground + "cc", fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 20 },
  answerMeta: { fontSize: 11, color: colors.foreground + "88", fontFamily: "Inter_400Regular", marginTop: 4 },
  replyBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  replyInput: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
