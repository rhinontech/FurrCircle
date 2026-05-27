import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ArrowUp, ArrowDown, MessageCircle, Share2, ShieldAlert } from "lucide-react-native";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { threads } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";

const answers = [
  { author: "Dr. Kavya Rao", role: "Verified Vet", body: "If she's still refusing food after 24 hours, that's a vet visit — cats can get hepatic lipidosis fast. In the meantime, try a tiny piece of plain boiled chicken to test appetite.", upvotes: 142, time: "2h", verified: true },
  { author: "Mehul S.", role: "Cat parent", body: "Mine did this when I switched her bowl. Try the previous bowl + the previous spot. Sometimes it's that silly.", upvotes: 67, time: "1h", verified: false },
  { author: "Priya M.", role: "First-Time Owners", body: "Hydration first — even if she's drinking, add a wet food slurry. Worked for us during a stressful move.", upvotes: 31, time: "40m", verified: false },
];

export default function ThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tk = useTokens();
  const thread = threads.find((t) => t.id === id) ?? threads[0];

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Discussion" />
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Thread question */}
          <View style={styles.article}>
            <View style={styles.tagWrap}>
              <Text style={styles.tagText}>{thread.tag.toUpperCase()}</Text>
            </View>
            <Text style={[styles.title, { color: tk.text }]}>{thread.title}</Text>
            <Text style={[styles.body, { color: tk.text + "CC" }]}>{thread.body}</Text>
            <Text style={[styles.askerLine, { color: tk.textMuted }]}>
              Asked by <Text style={{ fontFamily: "Poppins_700Bold", color: tk.text }}>{thread.asker}</Text> · {thread.time}
            </Text>

            {/* Health warning */}
            {thread.isHealth && (
              <View style={[styles.warningBox, { backgroundColor: tk.card, borderColor: tk.border, borderWidth: 1 }]}>
                <ShieldAlert size={16} color={colors.coral} style={{ marginTop: 1 }} />
                <Text style={[styles.warningText, { color: tk.text + "CC" }]}>
                  Community advice is not a substitute for a vet. For emergencies, find care now.
                </Text>
              </View>
            )}

            {/* Vote + action row */}
            <View style={[styles.actionRow, { borderTopColor: tk.border, borderBottomColor: tk.border }]}>
              <View style={[styles.voteGroup, { backgroundColor: tk.card, borderColor: tk.border, borderWidth: 1 }]}>
                <TouchableOpacity><ArrowUp size={16} color={tk.text} /></TouchableOpacity>
                <Text style={[styles.voteCount, { color: tk.text }]}>{thread.upvotes}</Text>
                <TouchableOpacity><ArrowDown size={16} color={tk.textMuted} /></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.actionBtn}>
                <MessageCircle size={16} color={tk.textMuted} />
                <Text style={[styles.actionText, { color: tk.textMuted }]}>{thread.answers}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareBtn}>
                <Share2 size={20} color={tk.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Top answers */}
          <Text style={[styles.answersTitle, { color: tk.text }]}>Top answers</Text>
          <View style={styles.answersWrap}>
            {answers.map((a, i) => (
              <View key={i} style={[styles.answerCard, { backgroundColor: tk.card, borderColor: tk.border, borderWidth: 1 }]}>
                <View style={styles.answerHeader}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary + "26" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.answerAuthor, { color: tk.text }]}>{a.author}</Text>
                    <Text style={[styles.answerRole, { color: tk.textMuted }]}>{a.role} · {a.time}</Text>
                  </View>
                  {a.verified && (
                    <View style={styles.vetBadge}>
                      <Text style={styles.vetBadgeText}>VET</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.answerBody, { color: tk.text + "D9" }]}>{a.body}</Text>
                <View style={styles.answerFooter}>
                  <View style={[styles.answerVoteGroup, { backgroundColor: tk.bg, borderColor: tk.border, borderWidth: 1 }]}>
                    <ArrowUp size={13} color={tk.text} />
                    <Text style={[styles.answerVoteCount, { color: tk.text }]}>{a.upvotes}</Text>
                  </View>
                  <TouchableOpacity>
                    <Text style={[styles.replyBtn, { color: tk.textMuted }]}>Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Fixed reply bar */}
        <View style={[styles.replyBar, { backgroundColor: tk.card, borderTopColor: tk.border }]}>
          <View style={[styles.replyInputWrap, { backgroundColor: tk.bg, borderColor: tk.border, borderWidth: 1 }]}>
            <TextInput
              placeholder="Add an answer…"
              placeholderTextColor={tk.textMuted}
              style={[styles.replyInput, { color: tk.text }]}
            />
            <TouchableOpacity>
              <Text style={styles.postBtn}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  article: { paddingHorizontal: 20, paddingTop: 4 },
  tagWrap: { alignSelf: "flex-start", backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  tagText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.coral },
  title: { fontFamily: "Poppins_700Bold", fontSize: 20, lineHeight: 28, marginBottom: 10 },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 10 },
  askerLine: { fontSize: 12, fontFamily: "Inter_400Regular" },
  warningBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "rgba(255,217,61,0.25)", borderRadius: 16, padding: 12, marginTop: 14 },
  warningText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 12, marginTop: 14 },
  voteGroup: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  voteCount: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  shareBtn: { marginLeft: "auto" },
  answersTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, paddingHorizontal: 24, marginTop: 20, marginBottom: 12 },
  answersWrap: { paddingHorizontal: 20, gap: 14 },
  answerCard: { borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  answerHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  answerAuthor: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.foreground, lineHeight: 18 },
  answerRole: { fontSize: 11, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  vetBadge: { backgroundColor: colors.success, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  vetBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.white },
  answerBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  answerFooter: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 12 },
  answerVoteGroup: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  answerVoteCount: { fontFamily: "Poppins_700Bold", fontSize: 12, color: colors.foreground },
  replyBtn: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  replyBar: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  replyInputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  replyInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  postBtn: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.primary },
});
