import { useState, useCallback, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react-native";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Avatar } from "../../src/components/Avatar";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { ShareSheet } from "../../src/components/ShareSheet";
import { feedApi } from "../../services/community/feedApi";
import { useAuthStore } from "../../src/lib/auth-store";
import { posts as dummyPosts, sampleComments } from "../../src/lib/demo-data";
import { Video, ResizeMode, Audio } from "expo-av";

export default function PostDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tk = useTokens();
  const { user } = useAuthStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    }).catch(() => {});
  }, []);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const TINT: Record<string, string> = {
    dogs: "#FF6B6B22", cats: "#FF6FCF22", rescue: "#4CAF5022",
    health: "#2563EB18", training: "#FFD93D44", milestone: "#FF6FCF22",
    photo: "#FF6B6B22", reel: "#2563EB18", general: "#FFD93D22",
  };

  useFocusEffect(useCallback(() => {
    if (!id) return;

    // Check if it is a dummy post
    const dummy = dummyPosts.find(p => p.id === id);
    if (dummy) {
      setPost(dummy);
      const mappedComments = sampleComments.map(c => ({
        id: c.id,
        text: c.body,
        author: {
          name: c.author,
          avatar_url: null,
          username: c.author.toLowerCase().replace(/[^a-z0-9]/g, ""),
        }
      }));
      setComments(mappedComments);
      setIsLiked(false);
      setIsSaved(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    feedApi.getPostById(id)
      .then(data => {
        setPost(data);
        setComments(data.comments || []);
        setIsLiked((data.likes || []).some((l: any) => l.userId === user?.id));
        setIsSaved((data.savedPosts || []).some((s: any) => s.userId === user?.id));
      })
      .catch(err => { console.error(err); Alert.alert("Error", "Failed to load post."); })
      .finally(() => setLoading(false));
  }, [id, user?.id]));

  const handleLike = async () => {
    setIsLiked(v => !v);
    const isDummy = dummyPosts.some(p => p.id === id);
    if (isDummy) return;
    try { await feedApi.likePost(id!); } catch {}
  };

  const handleSave = async () => {
    setIsSaved(v => !v);
    const isDummy = dummyPosts.some(p => p.id === id);
    if (isDummy) return;
    try { await feedApi.savePost(id!); } catch {}
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    const isDummy = dummyPosts.some(p => p.id === id);
    if (isDummy) {
      const newComment = {
        id: `dummy-c-${Date.now()}`,
        text: commentText.trim(),
        author: {
          name: user?.name || "Demo User",
          avatar_url: user?.avatar_url || null,
          username: user?.username || "demo_user",
        }
      };
      setComments(prev => [...prev, newComment]);
      setCommentText("");
      return;
    }

    setSubmitting(true);
    try {
      const res = await feedApi.commentOnPost(id!, commentText.trim());
      setComments(prev => [...prev, res.comment]);
      setCommentText("");
    } catch { Alert.alert("Error", "Could not post comment."); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Post" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Post" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: "Inter_400Regular", color: tk.textMuted }}>Post not found.</Text>
        </View>
      </View>
    );
  }

  const isDummy = dummyPosts.some(p => p.id === id);
  const author = isDummy ? {
    name: post.pet,
    avatar_url: null,
    username: post.owner?.toLowerCase().replace(/[^a-z0-9]/g, ""),
  } : (post.author || {});

  const displayName = author.name || "Pet parent";
  const avatarSource = post.avatar || (author.avatar_url ? { uri: author.avatar_url } : null);
  const tintColor = TINT[(post.category || "").toLowerCase()] || "#FF6B6B22";
  const initiallyLiked = (post.likes || []).some((l: any) => l.userId === user?.id);
  const baseLikes = (post.likes || []).length;
  const likeCount = isDummy
    ? post.likes + (isLiked ? 1 : 0)
    : baseLikes + (isLiked ? (initiallyLiked ? 0 : 1) : (initiallyLiked ? -1 : 0));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title={displayName} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Author row */}
          <View style={styles.authorRow}>
            {typeof avatarSource === "number" ? (
              <Image source={avatarSource} style={styles.authorAvatar} />
            ) : avatarSource?.uri ? (
              <Image source={{ uri: avatarSource.uri }} style={styles.authorAvatar} />
            ) : (
              <Avatar name={displayName} size={44} />
            )}
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => author.username && router.push(isDummy ? `/user/${author.username}` : `/u/${author.username}`)}>
                <Text style={[styles.authorName, { color: tk.text }]}>{displayName}</Text>
              </TouchableOpacity>
              <Text style={[styles.postMeta, { color: tk.textMuted }]}>
                {post.owner ? `by ${post.owner}` : post.category ? `${post.category} · ` : ''}{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : post.time || ''}
              </Text>
            </View>
          </View>

          {/* Image */}
          {post.image ? (
            <View style={[styles.imageWrapper, { backgroundColor: post.tintColor || tintColor }]}>
              <Image source={post.image} style={styles.image} resizeMode="contain" />
            </View>
          ) : post.imageUrl ? (
            <View style={[styles.imageWrapper, { backgroundColor: tintColor }]}>
              {post.imageUrl.match(/\.(mp4|mov|quicktime|3gp|mpeg|avi|wmv|flv|mkv|webm)(\?|$)/i) ? (
                <Video
                  source={{ uri: post.imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={ResizeMode.COVER}
                  isMuted={false}
                  shouldPlay
                  useNativeControls
                />
              ) : (
                <Image source={{ uri: post.imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              )}
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
              <Heart size={26} color={isLiked ? colors.coral : tk.text} fill={isLiked ? colors.coral : "none"} />
              <Text style={[styles.actionCount, { color: tk.text }]}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <MessageCircle size={26} color={tk.text} />
              <Text style={[styles.actionCount, { color: tk.text }]}>{comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShareOpen(true)}>
              <Send size={26} color={tk.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={{ marginLeft: "auto" }}>
              <Bookmark size={26} color={isSaved ? colors.primary : tk.text} fill={isSaved ? colors.primary : "none"} />
            </TouchableOpacity>
          </View>

          {/* Caption + tags */}
          {post.caption || post.content ? (
            <Text style={[styles.caption, { color: tk.text }]}>
              <Text style={styles.bold}>{post.pet || displayName} </Text>{post.caption || post.content}
            </Text>
          ) : null}
          {post.tags ? (
            <Text style={styles.tags}>{post.tags.map((t: string) => `#${t}`).join("  ")}</Text>
          ) : post.category ? (
            <Text style={styles.tags}>#{post.category}</Text>
          ) : null}

          {/* Comments */}
          <Text style={[styles.commentsTitle, { color: tk.text }]}>Comments</Text>
          {comments.length === 0 ? (
            <Text style={{ paddingHorizontal: 16, color: tk.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>No comments yet. Be first!</Text>
          ) : (
            comments.map((c: any, i) => (
              <View key={c.id || i} style={styles.comment}>
                <TouchableOpacity onPress={() => c.author?.username && router.push(isDummy ? `/user/${c.author.username}` : `/u/${c.author.username}`)}>
                  {c.author?.avatar_url ? (
                    <Image source={{ uri: c.author.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                  ) : (
                    <Avatar name={c.author?.name || "User"} size={36} />
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.commentAuthor, { color: tk.text }]}>{c.author?.name || "User"}</Text>
                  <Text style={[styles.commentBody, { color: tk.textMuted }]}>{c.text}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Reply bar */}
        <View style={[styles.replyBar, { backgroundColor: tk.card, borderTopColor: tk.border }]}>
          <TextInput
            placeholder="Add a comment…"
            placeholderTextColor={tk.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            style={[styles.replyInput, { backgroundColor: tk.bg, color: tk.text, borderColor: tk.border }]}
          />
          <TouchableOpacity
            onPress={handleComment}
            disabled={submitting || !commentText.trim()}
            style={[styles.sendBtn, { opacity: commentText.trim() ? 1 : 0.5 }]}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} postId={post.id} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  authorAvatar: { width: 44, height: 44, borderRadius: 22 },
  authorName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  postMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  imageWrapper: { width: "92%", alignSelf: "center", aspectRatio: 1, borderRadius: 16, overflow: "hidden", marginBottom: 8, alignItems: "center", justifyContent: "center" },
  image: { width: "80%", height: "80%" },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 16, paddingVertical: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  caption: { paddingHorizontal: 16, paddingTop: 6, fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
  bold: { fontFamily: "Poppins_700Bold" },
  tags: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, fontSize: 12, color: colors.primary, fontFamily: "Poppins_600SemiBold" },
  commentsTitle: { paddingHorizontal: 16, fontFamily: "Poppins_700Bold", fontSize: 16, marginTop: 8, marginBottom: 12 },
  comment: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  commentAuthor: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  commentBody: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  replyBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  replyInput: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", borderWidth: 1 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
