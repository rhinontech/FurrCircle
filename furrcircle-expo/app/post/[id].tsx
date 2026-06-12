import { useState, useCallback, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Modal, Pressable,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, MoreVertical, ChevronRight, X, Check, Edit2, Trash2, Info, Flag } from "../../src/components/ui/icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Avatar } from "../../src/components/Avatar";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { ShareSheet } from "../../src/components/ShareSheet";
import { feedApi } from "../../services/community/feedApi";
import { useAuthStore } from "../../src/lib/auth-store";
import { posts as dummyPosts, sampleComments } from "../../src/lib/demo-data";
import { Video, ResizeMode, Audio } from "expo-av";
import { useIsFocused } from "@react-navigation/native";
import { useBreakpoint } from "../../src/lib/breakpoints";

export default function PostDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tk = useTokens();
  const { isTablet } = useBreakpoint();
  const isScreenFocused = useIsFocused();
  const { user } = useAuthStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportStep, setReportStep] = useState(1);
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

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    }).catch(() => { });
  }, []);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    if (post) {
      if (post.image) {
        try {
          const source = Image.resolveAssetSource(post.image);
          if (source && source.width && source.height) {
            setAspectRatio(source.width / source.height);
          }
        } catch (err) {
          console.warn("Failed to resolve asset source", err);
        }
      } else if (post.imageUrl && !post.imageUrl.match(/\.(mp4|mov|quicktime|3gp|mpeg|avi|wmv|flv|mkv|webm)(\?|$)/i)) {
        Image.getSize(post.imageUrl, (w, h) => {
          setAspectRatio(w / h);
        }, (err) => {
          console.warn("Failed to get image size for feed:", err);
        });
      }
    }
  }, [post]);

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
    try { await feedApi.likePost(id!); } catch { }
  };

  const handleSave = async () => {
    setIsSaved(v => !v);
    const isDummy = dummyPosts.some(p => p.id === id);
    if (isDummy) return;
    try { await feedApi.savePost(id!); } catch { }
  };

  const handleDeletePost = () => {
    setMenuOpen(false);
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await feedApi.deletePost(post.id);
              Alert.alert("Success", "Post deleted successfully.", [
                {
                  text: "OK",
                  onPress: () => {
                    router.back();
                  }
                }
              ]);
            } catch (err: any) {
              Alert.alert("Error", err?.response?.data?.message || "Could not delete post.");
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleReportUser = () => {
    setMenuOpen(false);
    setReportStep(1);
    setReportModalOpen(true);
  };

  const handleSelectReason = async (reason: string) => {
    const reportedUserId = post?.userId || post?.author?.id;
    if (!reportedUserId) {
      Alert.alert("Error", "Could not identify the user to report.");
      return;
    }

    try {
      await feedApi.reportUser(reportedUserId, reason);
      setReportStep(2);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to submit report.");
    }
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
  const isOwner = !isDummy && post?.userId === user?.id;
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}
      enabled={true}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader
          title={displayName}
          right={
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: tk.card }}>
              <MoreVertical size={20} color={tk.text} />
            </TouchableOpacity>
          }
        />
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
                <Text style={[styles.authorName, { color: tk.text }]}>
                  {author.username || "parent"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Image */}
          {post.image ? (
            <View style={[styles.imageWrapper, { backgroundColor: post.tintColor || tintColor, aspectRatio: aspectRatio || 1 }]}>
              <Image source={post.image} style={styles.image} resizeMode="contain" />
            </View>
          ) : post.imageUrl ? (
            <View style={[styles.imageWrapper, { backgroundColor: tintColor, aspectRatio: aspectRatio || 1 }]}>
              {post.imageUrl.match(/\.(mp4|mov|quicktime|3gp|mpeg|avi|wmv|flv|mkv|webm)(\?|$)/i) ? (
                <View style={{ width: "100%", height: "100%", position: "relative" }}>
                  <Video
                    source={{ uri: post.imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode={ResizeMode.CONTAIN}
                    isMuted={isMuted}
                    shouldPlay={isScreenFocused}
                    isLooping
                    useNativeControls={false}
                    onReadyForDisplay={(event) => {
                      if (event?.naturalSize) {
                        setAspectRatio(event.naturalSize.width / event.naturalSize.height);
                      }
                    }}
                    onPlaybackStatusUpdate={(status: any) => {
                      if (!status.isLoaded) {
                        setIsVideoLoading(true);
                      } else {
                        setIsVideoLoading(!status.isPlaying && (status.isBuffering || status.shouldPlay));
                      }
                    }}
                  />
                  {isVideoLoading && (
                    <View style={[StyleSheet.absoluteFillObject, { justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.15)" }]}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => setIsMuted(prev => !prev)}
                    style={styles.muteBtn}
                    activeOpacity={0.8}
                  >
                    {isMuted ? (
                      <VolumeX size={18} color="#fff" />
                    ) : (
                      <Volume2 size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <Image source={{ uri: post.imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
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

        {/* Options Menu Modal */}
        <Modal visible={menuOpen} transparent={true} animationType={isTablet ? "fade" : "slide"} onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={[styles.overlay, isTablet && styles.overlayCenter]} onPress={() => setMenuOpen(false)}>
            <View style={[isTablet ? styles.dialog : [styles.sheet, { paddingBottom: 10 + insets.bottom }], { backgroundColor: tk.card }]} onStartShouldSetResponder={() => true} onTouchEnd={(e) => e.stopPropagation()}>
              {!isTablet && <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />}
              <Text style={[styles.sheetTitle, { color: tk.text }]}>Options</Text>

              {/* Save Option */}
              <TouchableOpacity
                onPress={() => { setMenuOpen(false); handleSave(); }}
                style={[styles.sheetRow, { backgroundColor: tk.bg }]}
                activeOpacity={0.8}
              >
                <Bookmark size={20} color={isSaved ? colors.primary : tk.text} fill={isSaved ? colors.primary : "none"} />
                <Text style={[styles.sheetRowTitle, { color: tk.text }]}>
                  {isSaved ? "Remove from Saved" : "Save Post"}
                </Text>
              </TouchableOpacity>

              {isOwner ? (
                <>
                  {/* Edit Post Option */}
                  <TouchableOpacity
                    onPress={() => {
                      setMenuOpen(false);
                      router.push({
                        pathname: "/compose",
                        params: {
                          editPostId: post.id,
                          prefilledCategory: post.category || "General",
                          prefilledCaption: post.content || "",
                          prefilledImageUrl: post.imageUrl || "",
                        }
                      });
                    }}
                    style={[styles.sheetRow, { backgroundColor: tk.bg }]}
                    activeOpacity={0.8}
                  >
                    <Edit2 size={20} color={tk.text} />
                    <Text style={[styles.sheetRowTitle, { color: tk.text }]}>Edit Post</Text>
                  </TouchableOpacity>

                  {/* Delete Post Option */}
                  <TouchableOpacity
                    onPress={handleDeletePost}
                    style={[styles.sheetRow, { backgroundColor: tk.bg }]}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={20} color={colors.coral} />
                    <Text style={[styles.sheetRowTitle, { color: colors.coral }]}>Delete Post</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* About this Account Option */}
                  <TouchableOpacity
                    onPress={() => {
                      setMenuOpen(false);
                      router.push({
                        pathname: "/about-account",
                        params: {
                          username: author.username || "",
                          prefilledName: displayName,
                          prefilledAvatar: author.avatar_url || "",
                        }
                      });
                    }}
                    style={[styles.sheetRow, { backgroundColor: tk.bg }]}
                    activeOpacity={0.8}
                  >
                    <Info size={20} color={tk.text} />
                    <Text style={[styles.sheetRowTitle, { color: tk.text }]}>About this Account</Text>
                  </TouchableOpacity>

                  {/* Report Option */}
                  <TouchableOpacity
                    onPress={handleReportUser}
                    style={[styles.sheetRow, { backgroundColor: tk.bg }]}
                    activeOpacity={0.8}
                  >
                    <Flag size={20} color={colors.coral} />
                    <Text style={[styles.sheetRowTitle, { color: colors.coral }]}>Report</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => setMenuOpen(false)}
                style={[styles.sheetRow, { backgroundColor: tk.bg, marginTop: 12, justifyContent: "center", alignItems: "center" }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.sheetRowTitle, { color: tk.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Report Flow Modal */}
        <Modal visible={reportModalOpen} animationType="slide" transparent={false} onRequestClose={() => setReportModalOpen(false)}>
          <View style={[styles.reportContainer, { backgroundColor: tk.bg, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.reportHeader, { borderBottomColor: tk.border }]}>
              <View style={{ width: 40 }} />
              <Text style={[styles.reportHeaderTitle, { color: tk.text }]}>Report</Text>
              <TouchableOpacity onPress={() => setReportModalOpen(false)} style={styles.reportCloseBtn}>
                <X size={24} color={tk.text} />
              </TouchableOpacity>
            </View>

            {reportStep === 1 ? (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.reportContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.reportTitle, { color: tk.text }]}>Why are you reporting this post?</Text>
                <Text style={[styles.reportSubtitle, { color: tk.textMuted }]}>
                  Your report is anonymous. If someone is in immediate danger, call the local emergency services - don't wait.
                </Text>

                <View style={{ marginTop: 24 }}>
                  {[
                    "I just don't like it",
                    "Bullying or unwanted contact",
                    "Suicide, self-injury or eating disorders",
                    "Violence, hate or exploitation",
                    "Selling or promoting restricted items",
                    "Nudity or sexual activity",
                    "Scam, fraud or spam",
                    "False information",
                    "Intellectual property"
                  ].map((reason, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.reasonRow, { borderBottomColor: tk.border }]}
                      onPress={() => handleSelectReason(reason)}
                    >
                      <Text style={[styles.reasonText, { color: tk.text }]}>{reason}</Text>
                      <ChevronRight size={20} color={tk.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successContent}>
                  <View style={[styles.checkCircle, { backgroundColor: tk.border }]}>
                    <Check size={40} color={colors.primary} strokeWidth={3} />
                  </View>
                  <Text style={[styles.successTitle, { color: tk.text }]}>Thanks for your feedback</Text>
                  <Text style={[styles.successSubtitle, { color: tk.textMuted }]}>
                    We use these reports to show you less of this kind of content in the future.
                  </Text>
                </View>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                  <TouchableOpacity
                    style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setReportModalOpen(false)}
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>

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
  imageWrapper: { width: "92%", alignSelf: "center", borderRadius: 16, overflow: "hidden", marginBottom: 8, alignItems: "center", justifyContent: "center" },
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
  muteBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  overlayCenter: { justifyContent: "center", alignItems: "center" },
  dialog: { borderRadius: 24, padding: 24, width: 360 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 28 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12, opacity: 0.2 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, paddingHorizontal: 4, marginBottom: 8 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 12, marginBottom: 6 },
  sheetRowTitle: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  reportContainer: { flex: 1 },
  reportHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 56, paddingHorizontal: 16, borderBottomWidth: 1 },
  reportHeaderTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, textAlign: "center" },
  reportCloseBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  reportContent: { padding: 24 },
  reportTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, textAlign: "center", marginTop: 16, marginBottom: 8 },
  reportSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 18, paddingHorizontal: 16, marginBottom: 16 },
  reasonRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 0.5 },
  reasonText: { fontFamily: "Inter_400Regular", fontSize: 15, flex: 1, paddingRight: 16 },
  successContainer: { flex: 1, justifyContent: "space-between" },
  successContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, marginTop: -40 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, textAlign: "center", marginBottom: 12 },
  successSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  footer: { paddingHorizontal: 24 },
  doneBtn: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  doneBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },
});
