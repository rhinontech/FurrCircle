import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, TextInput, ActivityIndicator, Alert, Share, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, PawPrint } from "lucide-react-native";
import StatusChip from "../../../components/ui/StatusChip";
import { useTheme } from "../../../contexts/ThemeContext";
import { api } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

function timeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "just now";
}

export default function CommunityPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const fetchPost = async () => {
    if (!id) return;
    try {
      const data = await api.get(`/community/posts/${id}`);
      setPost(data);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load post.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const isPostLiked = (postLikes: any[]) => postLikes.some((like: any) => like.userId === user?.id);
  const isPostSaved = (savedBy: string[] = []) => savedBy.includes(String(user?.id || ""));

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await api.post(`/community/posts/${post.id}/like`);
      setPost((prev: any) => {
        if (!prev) return prev;
        const likes = res.liked
          ? [...prev.likes, { userId: user?.id }]
          : prev.likes.filter((like: any) => like.userId !== user?.id);
        return { ...prev, likes };
      });
    } catch (error) {
      console.error("Error toggling like", error);
    }
  };

  const handleSave = async () => {
    if (!post) return;
    try {
      const res = await api.post(`/community/posts/${post.id}/save`);
      setPost((prev: any) => {
        if (!prev) return prev;
        const savedBy = res.saved
          ? [...(prev.savedBy || []), user?.id]
          : (prev.savedBy || []).filter((savedUserId: string) => savedUserId !== user?.id);
        return { ...prev, savedBy };
      });
    } catch (error) {
      console.error("Error saving post", error);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      const res = await api.post(`/community/posts/${post.id}/share`);
      await Share.share({
        message: `${post.author?.name || "PawsHub member"} posted in ${post.category}: ${post.content}`,
      });
      setPost((prev: any) => (prev ? { ...prev, shareCount: res.shareCount } : prev));
    } catch (error) {
      console.error("Error sharing post", error);
    }
  };

  const handleAddComment = async () => {
    if (!post || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await api.post(`/community/posts/${post.id}/comment`, { text: commentText.trim() });
      setPost((prev: any) => (prev ? { ...prev, comments: [...(prev.comments || []), res.comment] } : prev));
      setCommentText("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>Post Details</Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
              {post.author?.avatar_url ? (
                <Image source={{ uri: post.author.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                  <PawPrint size={20} color={colors.brand} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>{post.author?.name || "Member"}</Text>
                  <StatusChip label={post.author?.role?.toUpperCase() || "MEMBER"} variant="info" />
                </View>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>
                  {timeAgo(post.createdAt)} - {post.category}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 15, color: colors.textPrimary, lineHeight: 24 }}>{post.content}</Text>

            {post.imageUrl ? (
              <Image source={{ uri: post.imageUrl }} style={{ width: "100%", height: 220, borderRadius: 16, marginTop: 16 }} resizeMode="cover" />
            ) : null}

            <View style={{ flexDirection: "row", alignItems: "center", gap: 18, paddingTop: 18 }}>
              <Pressable onPress={handleLike} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Heart size={18} color={isPostLiked(post.likes) ? "#f43f5e" : colors.textMuted} fill={isPostLiked(post.likes) ? "#f43f5e" : "transparent"} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: isPostLiked(post.likes) ? "#f43f5e" : colors.textMuted }}>
                  {post.likes?.length || 0}
                </Text>
              </Pressable>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MessageCircle size={18} color={colors.textMuted} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>{post.comments?.length || 0}</Text>
              </View>
              <Pressable onPress={handleShare} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Share2 size={18} color={colors.textMuted} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>{post.shareCount || 0}</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={{ marginLeft: "auto" }}>
                <Bookmark size={18} color={isPostSaved(post.savedBy) ? colors.brand : colors.textMuted} fill={isPostSaved(post.savedBy) ? colors.brand : "transparent"} />
              </Pressable>
            </View>
          </View>

          <View style={{ marginTop: 18, backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 14 }}>Comments</Text>

            {(post.comments || []).length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textMuted }}>No comments yet.</Text>
            ) : (
              <View style={{ gap: 14 }}>
                {(post.comments || []).map((comment: any) => (
                  <View key={comment.id} style={{ paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle || colors.border }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{comment.author?.name || "Member"}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{timeAgo(comment.createdAt)}</Text>
                    <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 8, lineHeight: 20 }}>{comment.text}</Text>
                  </View>
                ))}
              </View>
            )}

            <TextInput
              placeholder="Write a comment..."
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              style={{ minHeight: 56, maxHeight: 120, marginTop: 16, padding: 14, backgroundColor: colors.bgSubtle, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, textAlignVertical: "top" }}
            />
            <Pressable
              onPress={handleAddComment}
              disabled={commentSubmitting}
              style={{ marginTop: 12, backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 14, alignItems: "center", opacity: commentSubmitting ? 0.7 : 1 }}
            >
              {commentSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Post Comment</Text>}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
