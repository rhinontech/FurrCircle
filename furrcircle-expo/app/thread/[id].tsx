import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { ArrowUp, MessageCircle, Share2, ShieldAlert } from "lucide-react-native";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { Avatar } from "../../src/components/Avatar";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useAuthStore } from "../../src/lib/auth-store";
import { questionApi } from "../../services/community/questionApi";
import { threads as dummyThreads } from "../../src/lib/demo-data";

export default function ThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tk = useTokens();
  const { user } = useAuthStore();
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);

  const dummy = dummyThreads.find(t => t.id === id);

  useFocusEffect(useCallback(() => {
    if (!id) return;

    if (dummy) {
      // Mock answers or empty for dummy questions
      setAnswers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    questionApi.getAnswers(id)
      .then((answersData) => {
        setAnswers(answersData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, dummy]));

  // The question is passed via route params or we parse it
  const { title, body, tags, askerName, time, upvotes } = useLocalSearchParams<any>();

  const displayTitle = title || dummy?.title || "Question";
  const displayBody = body || dummy?.body || "";
  const displayTags = tags || dummy?.tag || "";
  const displayAsker = askerName || dummy?.asker || "Someone";
  const displayTime = time || dummy?.time || "";
  const displayUpvotes = Number(upvotes || dummy?.upvotes || 0);

  const handleUpvote = async () => {
    setUpvoted(v => !v);
    if (dummy) return;
    try { await questionApi.upvoteQuestion(id!); } catch {}
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) return;

    if (dummy) {
      const newAnswer = {
        id: `dummy-a-${Date.now()}`,
        text: answerText.trim(),
        createdAt: new Date().toISOString(),
        author: {
          name: user?.name || "Demo User",
          avatar_url: user?.avatar_url || null,
          city: user?.city || "Member",
        }
      };
      setAnswers(prev => [newAnswer, ...prev]);
      setAnswerText("");
      return;
    }

    setSubmitting(true);
    try {
      const res = await questionApi.addAnswer(id!, answerText.trim());
      setAnswers(prev => [res, ...prev]);
      setAnswerText("");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to post answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const isHealth = (displayTags || "").toLowerCase().includes("health") ||
    (displayBody || "").toLowerCase().includes("eat") ||
    (displayBody || "").toLowerCase().includes("sick");

  return (
    <PageContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.container, { backgroundColor: tk.bg }]}>
          <ScreenHeader title="Discussion" />
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Thread question */}
            <View style={styles.article}>
              {displayTags ? (
                <View style={styles.tagWrap}>
                  <Text style={styles.tagText}>{String(displayTags).toUpperCase()}</Text>
                </View>
              ) : null}
              <Text style={[styles.title, { color: tk.text }]}>{displayTitle}</Text>
              {displayBody ? <Text style={[styles.body, { color: tk.text + "CC" }]}>{displayBody}</Text> : null}
              <Text style={[styles.askerLine, { color: tk.textMuted }]}>
                Asked by <Text style={{ fontFamily: "Poppins_700Bold", color: tk.text }}>{displayAsker}</Text> · {displayTime}
              </Text>

              {/* Health warning */}
              {isHealth && (
                <View style={[styles.warningBox, { backgroundColor: tk.card, borderColor: tk.border, borderWidth: 1 }]}>
                  <ShieldAlert size={16} color={colors.coral} style={{ marginTop: 1 }} />
                  <Text style={[styles.warningText, { color: tk.text + "CC" }]}>
                    Community advice is not a substitute for a vet. For emergencies, find care now.
                  </Text>
                </View>
              )}

              {/* Vote + action row */}
              <View style={[styles.actionRow, { borderTopColor: tk.border, borderBottomColor: tk.border }]}>
                <TouchableOpacity onPress={handleUpvote} style={[styles.voteGroup, { backgroundColor: tk.card, borderColor: tk.border, borderWidth: 1 }]}>
                  <ArrowUp size={16} color={upvoted ? colors.coral : tk.text} />
                  <Text style={[styles.voteCount, { color: upvoted ? colors.coral : tk.text }]}>
                    {displayUpvotes + (upvoted ? 1 : 0)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <MessageCircle size={16} color={tk.textMuted} />
                  <Text style={[styles.actionText, { color: tk.textMuted }]}>{answers.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn}>
                  <Share2 size={20} color={tk.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Answers */}
            <Text style={[styles.answersTitle, { color: tk.text }]}>
              {answers.length === 0 ? "No answers yet — be first!" : `${answers.length} answer${answers.length === 1 ? "" : "s"}`}
            </Text>

            {loading ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <View style={styles.answersWrap}>
                {answers.map((a: any, i) => (
                  <View key={a.id || i} style={[styles.answerCard, { backgroundColor: tk.card, borderColor: tk.border, borderWidth: 1 }]}>
                    <View style={styles.answerHeader}>
                      {a.author?.avatar_url ? (
                        <Image source={{ uri: a.author.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                      ) : (
                        <Avatar name={a.author?.name || "User"} size={32} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.answerAuthor, { color: tk.text }]}>{a.author?.name || "User"}</Text>
                        <Text style={[styles.answerRole, { color: tk.textMuted }]}>
                          {a.author?.city || "Member"} · {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}
                        </Text>
                      </View>
                      {a.author?.isVerified && (
                        <View style={styles.vetBadge}>
                          <Text style={styles.vetBadgeText}>VET</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.answerBody, { color: tk.text + "D9" }]}>{a.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Fixed reply bar */}
          <View style={[styles.replyBar, { backgroundColor: tk.card, borderTopColor: tk.border }]}>
            <View style={[styles.replyInputWrap, { backgroundColor: tk.bg, borderColor: tk.border, borderWidth: 1 }]}>
              <TextInput
                placeholder="Add an answer…"
                placeholderTextColor={tk.textMuted}
                value={answerText}
                onChangeText={setAnswerText}
                style={[styles.replyInput, { color: tk.text }]}
                multiline
              />
              <TouchableOpacity onPress={handleSubmitAnswer} disabled={submitting || !answerText.trim()}>
                <Text style={[styles.postBtn, { opacity: answerText.trim() ? 1 : 0.4 }]}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  answerAuthor: { fontFamily: "Poppins_700Bold", fontSize: 13, lineHeight: 18 },
  answerRole: { fontSize: 11, fontFamily: "Inter_400Regular" },
  vetBadge: { backgroundColor: colors.success, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  vetBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.white },
  answerBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  replyBar: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  replyInputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  replyInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", maxHeight: 80 },
  postBtn: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.primary },
});
