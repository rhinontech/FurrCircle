import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Users, Plus, ThumbsUp, MessageCircle, ChevronRight, Share2 } from "../../src/components/ui/icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { ShareSheet } from "../../src/components/ShareSheet";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useAuthStore } from "../../src/lib/auth-store";
import { circleApi } from "../../services/community/circleApi";
import { questionApi } from "../../services/community/questionApi";
import { useState, useCallback, useEffect } from "react";

const CATEGORY_COLORS: Record<string, string> = {
  dogs: "rgba(255,107,107,0.15)",
  cats: "rgba(255,111,207,0.15)",
  rescue: "rgba(76,175,80,0.15)",
  health: "rgba(37,99,235,0.1)",
  training: "rgba(255,217,61,0.3)",
  general: "rgba(120,120,180,0.15)",
};

export default function CommunityDetail() {
  const { slug, refresh } = useLocalSearchParams<{ slug: string; refresh?: string }>();
  const router = useRouter();
  const tk = useTokens();
  const { user } = useAuthStore();

  const [circle, setCircle] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [circleData, questionsData] = await Promise.all([
        circleApi.getCircleById(slug),
        questionApi.getQuestions({ circleId: slug }),
      ]);
      setCircle(circleData);
      // Initialise each question with hasVoted from server
      setQuestions((questionsData || []).map((q: any) => ({ ...q, hasVoted: !!q.hasVoted })));
    } catch (err) {
      console.error("Failed to load circle:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (refresh) {
      load();
    }
  }, [refresh]);

  const handleJoinLeave = async () => {
    if (!circle) return;
    setJoining(true);
    try {
      if (circle.isJoined) {
        await circleApi.leaveCircle(circle.id);
        setCircle((prev: any) => ({ ...prev, isJoined: false, memberCount: prev.memberCount - 1 }));
      } else {
        await circleApi.joinCircle(circle.id);
        setCircle((prev: any) => ({ ...prev, isJoined: true, memberCount: prev.memberCount + 1 }));
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Action failed.");
    } finally {
      setJoining(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    // Optimistic toggle immediately
    setQuestions(prev => prev.map(q =>
      q.id === questionId
        ? { ...q, hasVoted: !q.hasVoted, upvotes: q.hasVoted ? Math.max(0, (q.upvotes || 1) - 1) : (q.upvotes || 0) + 1 }
        : q
    ));
    try {
      const result = await questionApi.upvoteQuestion(questionId);
      // Sync with real server values
      setQuestions(prev => prev.map(q =>
        q.id === questionId ? { ...q, upvotes: result.upvotes, hasVoted: result.voted } : q
      ));
    } catch {
      // Revert optimistic update on failure
      setQuestions(prev => prev.map(q =>
        q.id === questionId
          ? { ...q, hasVoted: !q.hasVoted, upvotes: q.hasVoted ? (q.upvotes || 0) + 1 : Math.max(0, (q.upvotes || 1) - 1) }
          : q
      ));
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <View style={{ flex: 1, backgroundColor: tk.bg }}>
          <ScreenHeader title="Circle" />
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </PageContainer>
    );
  }

  if (!circle) {
    return (
      <PageContainer>
        <View style={{ flex: 1, backgroundColor: tk.bg }}>
          <ScreenHeader title="Circle" />
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
            <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 16, color: tk.text }}>Circle not found</Text>
          </View>
        </View>
      </PageContainer>
    );
  }

  const coverBg = CATEGORY_COLORS[circle.category] || "rgba(37,99,235,0.1)";

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader
          title={circle.name}
          right={
            <TouchableOpacity onPress={() => setShareOpen(true)} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: tk.card }}>
              <Share2 size={20} color={tk.text} />
            </TouchableOpacity>
          }
        />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Cover */}
          <View style={[styles.cover, { backgroundColor: coverBg }]}>
            {circle.coverImage ? (
              <Image source={{ uri: circle.coverImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
                <Users size={72} color={colors.primary} strokeWidth={1.5} />
              </View>
            )}
          </View>

          {/* Info card */}
          <View style={[styles.info, { backgroundColor: tk.card }]}>
            <Text style={[styles.circleName, { color: tk.text }]}>{circle.name}</Text>
            {circle.category && (
              <View style={[styles.categoryBadge, { backgroundColor: coverBg }]}>
                <Text style={[styles.categoryText, { color: colors.primary }]}>{circle.category.charAt(0).toUpperCase() + circle.category.slice(1)}</Text>
              </View>
            )}
            <View style={styles.membersRow}>
              <Users size={14} color={tk.textMuted} />
              <Text style={[styles.membersText, { color: tk.textMuted }]}>
                {circle.memberCount >= 1000 ? `${(circle.memberCount / 1000).toFixed(1)}k` : circle.memberCount} members
              </Text>
            </View>
            {circle.description ? (
              <Text style={[styles.about, { color: tk.text }]}>{circle.description}</Text>
            ) : null}
            <TouchableOpacity
              onPress={handleJoinLeave}
              disabled={joining}
              style={[styles.joinBtn, circle.isJoined && styles.joinBtnLeave]}
              activeOpacity={0.85}
            >
              {joining
                ? <ActivityIndicator size="small" color={circle.isJoined ? tk.textMuted : colors.white} />
                : <Text style={[styles.joinBtnText, circle.isJoined && { color: tk.textMuted }]}>
                    {circle.isJoined ? "Leave Circle" : "Join Circle"}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          {/* Discussions */}
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: tk.text }]}>Discussions</Text>
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/ask", params: { circleId: circle.id, circleName: circle.name } })}
              style={styles.askBtn}
            >
              <Plus size={14} color={colors.primary} />
              <Text style={styles.askBtnText}>Ask</Text>
            </TouchableOpacity>
          </View>

          {questions.length === 0 ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: "center" }}>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted }}>No discussions yet. Be the first to ask!</Text>
            </View>
          ) : (
            questions.map((q: any) => (
              <TouchableOpacity
                key={q.id}
                style={[styles.threadCard, { backgroundColor: tk.card }]}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: "/thread/[id]",
                  params: {
                    id: q.id,
                    title: q.title,
                    body: q.body || "",
                    tags: q.tags?.[0] || "",
                    askerName: q.author?.name || "Someone",
                    time: q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "",
                    upvotes: q.upvotes || 0,
                    hasVoted: q.hasVoted ? "1" : "0",
                    questionUserId: q.userId || q.author?.id || "",
                  },
                })}
              >
                {q.tags?.[0] && (
                  <View style={styles.threadTag}>
                    <Text style={styles.threadTagText}>{q.tags[0].toUpperCase()}</Text>
                  </View>
                )}
                <Text style={[styles.threadTitle, { color: tk.text }]} numberOfLines={2}>{q.title}</Text>
                {q.body ? <Text style={[styles.threadBody, { color: tk.textMuted }]} numberOfLines={2}>{q.body}</Text> : null}
                <View style={styles.threadFooter}>
                  <TouchableOpacity onPress={(e) => { (e as any).stopPropagation?.(); handleUpvote(q.id); }} style={styles.threadAction}>
                    <ThumbsUp size={13} color={q.hasVoted ? colors.primary : tk.textMuted} fill={q.hasVoted ? colors.primary : "none"} />
                    <Text style={[styles.threadMeta, { color: q.hasVoted ? colors.primary : tk.textMuted, fontFamily: q.hasVoted ? "Poppins_600SemiBold" : "Inter_400Regular" }]}>{q.upvotes} upvotes</Text>
                  </TouchableOpacity>
                  <View style={styles.threadAction}>
                    <MessageCircle size={13} color={tk.textMuted} />
                    <Text style={[styles.threadMeta, { color: tk.textMuted }]}>{q.answerCount || 0} replies</Text>
                  </View>
                  {q.author?.name && (
                    <Text style={[styles.threadMeta, { color: tk.textMuted, marginLeft: "auto" }]}>by {q.author.name.split(" ")[0]}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}

        </ScrollView>
      </View>
      {/* Share Sheet */}
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        circleId={slug}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cover: { width: "100%", aspectRatio: 16 / 9, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  info: { borderRadius: 24, margin: 16, padding: 20 },
  circleName: { fontFamily: "Poppins_700Bold", fontSize: 22 },
  categoryBadge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  categoryText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  membersRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  membersText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  about: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginTop: 10 },
  joinBtn: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 12, alignItems: "center" },
  joinBtnLeave: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary + "66" },
  joinBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: colors.white },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  askBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  askBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.primary },
  threadCard: { borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 10 },
  threadTag: { alignSelf: "flex-start", backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  threadTagText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.coral },
  threadTitle: { fontFamily: "Poppins_700Bold", fontSize: 14, lineHeight: 20 },
  threadBody: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 18 },
  threadFooter: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  threadAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  threadMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
