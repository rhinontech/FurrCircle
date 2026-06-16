import { useState, useCallback, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { ArrowUp, MessageCircle, Share2, ShieldAlert, Trash2 } from "../../src/components/ui/icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { ShareSheet } from "../../src/components/ShareSheet";
import { Avatar } from "../../src/components/Avatar";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useAuthStore } from "../../src/lib/auth-store";
import { questionApi } from "../../services/community/questionApi";
import { useRouter } from "expo-router";
import { threads as dummyThreads } from "../../src/lib/demo-data";
import { socketService } from "../../services/socket/socketService";

const formatRelTime = (iso?: string): string => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function ThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tk = useTokens();
  const { user } = useAuthStore();
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [upvoteInit, setUpvoteInit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [questionData, setQuestionData] = useState<any>(null);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
    useEffect(() => {
      const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
        setKeyboardVisible(true);
      });
      const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardVisible(false);
      });
  
      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }, []);

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
    Promise.all([
      questionApi.getQuestionById(id).catch(() => null),
      questionApi.getAnswers(id).catch(() => [])
    ]).then(([qData, answersData]) => {
      if (qData) {
        setQuestionData(qData);
        setUpvoteCount(qData.upvotes || 0);
        setUpvoted(!!qData.hasVoted);
      }
      setAnswers(answersData || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id, dummy]));

  // Listen to socket events in real-time
  useEffect(() => {
    if (!id || dummy) return;

    const unsubVote = socketService.on<{ questionId: string; upvotes: number }>(
      "question:vote",
      ({ questionId, upvotes }) => {
        if (questionId === id) {
          setUpvoteCount(upvotes);
        }
      }
    );

    const unsubAnswer = socketService.on<{ questionId: string; answer: any; answerCount: number }>(
      "question:answer:new",
      ({ questionId, answer, answerCount }) => {
        if (questionId === id) {
          setAnswers((prev) => {
            if (prev.some((a) => a.id === answer.id)) return prev;
            return [answer, ...prev];
          });
        }
      }
    );

    return () => {
      unsubVote();
      unsubAnswer();
    };
  }, [id, dummy]);

  // The question is passed via route params or we parse it
  const { title, body, tags, askerName, time, upvotes, hasVoted: hasVotedParam, questionUserId } = useLocalSearchParams<any>();

  const isOwner = !dummy && user?.id && (questionData?.userId || questionUserId) && user.id === (questionData?.userId || questionUserId);

  const handleDelete = () => {
    Alert.alert(
      "Delete Question",
      "Delete this question and all its answers? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await questionApi.deleteQuestion(id!);
              router.back();
            } catch (err: any) {
              setDeleting(false);
              Alert.alert("Error", err?.response?.data?.message || "Failed to delete.");
            }
          },
        },
      ]
    );
  };

  const displayTitle = questionData?.title || title || dummy?.title || "Question";
  const displayBody = questionData?.body || body || dummy?.body || "";
  const displayTags = questionData?.tags ? (Array.isArray(questionData.tags) ? questionData.tags.join(", ") : questionData.tags) : (tags || dummy?.tag || "");
  const displayAsker = questionData?.author?.name || askerName || dummy?.asker || "Someone";
  const displayTime = questionData?.createdAt ? formatRelTime(questionData.createdAt) : (time || dummy?.time || "");
  const displayUpvotes = Number(upvotes || dummy?.upvotes || 0);

  // Initialise upvote count + voted state once from params (only on first render, if no backend questionData is loaded yet)
  useEffect(() => {
    if (!upvoteInit && !questionData) {
      setUpvoteCount(displayUpvotes);
      // hasVotedParam is "1" (voted) or "0" / undefined (not voted)
      setUpvoted(hasVotedParam === "1");
      setUpvoteInit(true);
    }
  }, [displayUpvotes, hasVotedParam, upvoteInit, questionData]);

  const handleUpvote = async () => {
    if (dummy) {
      // Optimistic local toggle for demo data
      setUpvoted(v => !v);
      setUpvoteCount(c => upvoted ? Math.max(0, c - 1) : c + 1);
      return;
    }
    // Optimistic update
    const newVoted = !upvoted;
    setUpvoted(newVoted);
    setUpvoteCount(c => newVoted ? c + 1 : Math.max(0, c - 1));
    try {
      const result = await questionApi.upvoteQuestion(id!);
      // Sync with actual server values
      setUpvoted(result.voted);
      setUpvoteCount(result.upvotes);
    } catch {
      // Revert on failure
      setUpvoted(!newVoted);
      setUpvoteCount(c => newVoted ? Math.max(0, c - 1) : c + 1);
    }
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}>
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
                <TouchableOpacity onPress={handleUpvote} style={[styles.voteGroup, { backgroundColor: tk.card, borderColor: upvoted ? colors.coral : tk.border, borderWidth: 1 }]}>
                  <ArrowUp size={16} color={upvoted ? colors.coral : tk.text} />
                  <Text style={[styles.voteCount, { color: upvoted ? colors.coral : tk.text }]}>
                    {upvoteCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <MessageCircle size={16} color={tk.textMuted} />
                  <Text style={[styles.actionText, { color: tk.textMuted }]}>{answers.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShareOpen(true)} style={styles.shareBtn}>
                  <Share2 size={20} color={tk.text} />
                </TouchableOpacity>
                {isOwner && (
                  <TouchableOpacity onPress={handleDelete} disabled={deleting} style={{ marginLeft: 4, opacity: deleting ? 0.4 : 1 }}>
                    {deleting
                      ? <ActivityIndicator size="small" color={colors.coral} />
                      : <Trash2 size={18} color={colors.coral} />}
                  </TouchableOpacity>
                )}
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
      {/* Share Sheet */}
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        threadId={id}
      />
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
  answerCard: { borderRadius: 16, padding: 16 },
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
