import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Image, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, RefreshControl, Share } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { Heart, MessageCircle, Share2, Bookmark, Calendar, Plus, X, ArrowRight, PawPrint, ImagePlus, Instagram, CheckCircle, Shield, Users } from "@/components/ui/IconCompat";
import { useRouter } from "expo-router";
import StatusChip from "../../components/ui/StatusChip";
import { useTheme } from "../../contexts/ThemeContext";
import EventCard from "../../components/ui/EventCard";
import { useAuth } from "../../contexts/AuthContext";
import { userCommunityApi } from "@/services/users/communityApi";
import { pickAndUploadImage } from "@/services/uploadApi";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';

const postCategories = ["General", "Health", "Adoption", "Training", "Nutrition", "Lost & Found"];
const feedCategories = ["All", "Events", "Health", "Adoption", "Training", "Nutrition"];

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

const formatEvents = (eventsData: any[]) =>
  (eventsData || []).map((event: any) => {
    const date = new Date(event.date);
    return {
      ...event,
      month: date.toLocaleString("default", { month: "short" }).toUpperCase(),
      day: date.getDate().toString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
  });

export default function CommunityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [newPostText, setNewPostText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [createdPostData, setCreatedPostData] = useState<any>(null);

  const fetchCommunity = async () => {
    try {
      const data = await userCommunityApi.getCommunityData();
      setPosts(data.feed);
      setEvents(formatEvents(data.events));
    } catch (error) {
      console.error("Error fetching community data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommunity();
  };

  const handlePickPostImage = async () => {
    try {
      setUploadingImage(true);
      const url = await pickAndUploadImage('posts', { aspect: [4, 3], allowsEditing: true });
      if (url) setSelectedImage(url);
    } catch (error: any) {
      Alert.alert("Upload failed", error.message || "Could not upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePost = async () => {
    if (!newPostText.trim()) return;
    setSubmitting(true);
    try {
      await userCommunityApi.createPost({
        content: newPostText.trim(),
        category: selectedCategory,
        imageUrl: selectedImage || undefined
      });
      setIsCreateModalVisible(false);
      setNewPostText("");
      setSelectedImage(null);
      await fetchCommunity();
      
      // If auto-sync is NOT enabled on backend, we could still show the prompt
      // but if it IS enabled, the backend will handle it automatically.
      if (!user?.instagramSyncEnabled) {
        setCreatedPostData({ 
          content: newPostText.trim(), 
          category: selectedCategory, 
          imageUrl: selectedImage 
        });
        setShowSharePrompt(true);
      } else {
        // Success feedback already provided by post creation
        Alert.alert("Success", "Post created and shared to Instagram!");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await userCommunityApi.togglePostLike(postId);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const likes = res.liked
            ? [...post.likes, { userId: user?.id }]
            : post.likes.filter((like: any) => like.userId !== user?.id);
          const updated = { ...post, likes };
          if (selectedPost?.id === postId) setSelectedPost(updated);
          return updated;
        })
      );
    } catch (error) {
      console.error("Error toggling like", error);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const res = await userCommunityApi.togglePostSave(postId);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const savedBy = res.saved
            ? [...(post.savedBy || []), user?.id]
            : (post.savedBy || []).filter((savedUserId: string) => savedUserId !== user?.id);
          const updated = { ...post, savedBy };
          if (selectedPost?.id === postId) setSelectedPost(updated);
          return updated;
        })
      );
    } catch (error) {
      console.error("Error saving post", error);
    }
  };

  const handleShare = async (post: any) => {
    try {
      const res = await userCommunityApi.sharePost(post.id);
      await Share.share({
        message: `${post.author?.name || "FurrCircle member"} posted in ${post.category}: ${post.content}`
      });
      setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, shareCount: res.shareCount } : item)));
    } catch (error) {
      console.error("Error sharing post", error);
    }
  };

  const handleToggleSync = async () => {
    if (!user?.instagramUserId) {
      setShowSharePrompt(true);
      return;
    }
    
    try {
      await userCommunityApi.toggleInstagramSync();
      await refreshUser();
    } catch (error: any) {
      Alert.alert("Sync Failed", error.message || "Could not update preference.");
    }
  };

  const handleConfirmSync = async () => {
    try {
      setSubmitting(true);
      // NOTE: In a real app, you would use Facebook SDK here to get the short-lived token
      const mockShortLivedToken = "EAAbwZA..."; 
      
      await userCommunityApi.connectInstagram(mockShortLivedToken);
      await refreshUser(); // Refresh user state from backend
      setShowSharePrompt(false);
      Alert.alert("Success", "Instagram account synced! Your posts will now be shared automatically.");
    } catch (error: any) {
      Alert.alert("Connection Failed", error.message || "Could not link Instagram account.");
    } finally {
      setSubmitting(false);
    }
  };

  const openComments = (post: any) => {
    setSelectedPost(post);
    setCommentText("");
    setIsCommentModalVisible(true);
  };

  const handleAddComment = async () => {
    if (!selectedPost || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await userCommunityApi.addPostComment(selectedPost.id, commentText.trim());
      setPosts((prev) => prev.map((post) => (post.id === selectedPost.id ? { ...post, comments: [...(post.comments || []), res.comment] } : post)));
      setSelectedPost((prev: any) => (prev ? { ...prev, comments: [...(prev.comments || []), res.comment] } : prev));
      setCommentText("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const isPostLiked = (postLikes: any[]) => postLikes.some((like: any) => like.userId === user?.id);
  const isPostSaved = (savedBy: string[] = []) => savedBy.includes(String(user?.id || ""));

  const filteredPosts = useMemo(
    () => (activeCategory === "All" ? posts : posts.filter((post) => post.category === activeCategory)),
    [activeCategory, posts]
  );

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textPrimary }}>Community</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {feedCategories.map((category) => (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: activeCategory === category ? colors.brand : colors.bgSubtle }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: activeCategory === category ? "#fff" : colors.textMuted }}>{category}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {(activeCategory === "All" || activeCategory === "Events") && (
            <View style={{ marginBottom: 32 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Upcoming Events</Text>
                {events.length > 0 && (
                  <Pressable onPress={() => router.push("/community/events" as any)}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.brand }}>See All</Text>
                  </Pressable>
                )}
              </View>
              {events.length === 0 ? (
                <View style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard, borderRadius: 16, paddingVertical: 22, paddingHorizontal: 18, alignItems: "center" }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <Calendar size={22} color={colors.brand} strokeWidth={1.8} />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>Stay tuned</Text>
                  <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 13, textAlign: "center" }}>New community events will appear here soon.</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={294}
                  decelerationRate="fast"
                  snapToAlignment="start"
                  style={{ marginHorizontal: -20 }}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                >
                  {events.map((event) => (
                    <EventCard key={event.id} {...event} onPress={() => router.push(`/community/events/${event.id}` as any)} />
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 16 }}>
            {activeCategory === "Events" ? "Past Events" : "Recent Posts"}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 16 }}>
            {activeCategory === "Events" && (
              <View style={{ paddingVertical: 40, alignItems: "center", opacity: 0.5 }}>
                <Calendar size={48} color={colors.textMuted} strokeWidth={1} />
                <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14 }}>No past events found</Text>
              </View>
            )}
            {activeCategory !== "Events" && filteredPosts.length === 0 && (
              <View style={{ paddingVertical: 40, alignItems: "center", opacity: 0.5 }}>
                <MessageCircle size={48} color={colors.textMuted} strokeWidth={1} />
                <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14 }}>No posts found for this category</Text>
              </View>
            )}
            {activeCategory !== "Events" && filteredPosts.map((post) => (
              <Pressable
                key={post.id}
                onPress={() => router.push(`/community/posts/${post.id}` as any)}
                style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  {post.author?.avatar_url ? (
                    <Image source={{ uri: post.author.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                      <PawPrint size={20} color={colors.brand} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>{post.author?.name || "User"}</Text>
                      <StatusChip label={post.author?.role?.toUpperCase() || "MEMBER"} variant="info" />
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{timeAgo(post.createdAt)} · {post.category}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 20, marginBottom: 12 }} numberOfLines={4}>
                  {post.content}
                </Text>
                {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={{ width: "100%", height: 176, borderRadius: 12, marginBottom: 12 }} resizeMode="cover" />}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 18, paddingTop: 4 }}>
                  <Pressable onPress={(event) => { event.stopPropagation(); handleLike(post.id); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Heart size={18} color={isPostLiked(post.likes) ? "#f43f5e" : colors.textMuted} fill={isPostLiked(post.likes) ? "#f43f5e" : "transparent"} />
                    <Text style={{ fontSize: 12, fontWeight: "500", color: isPostLiked(post.likes) ? "#f43f5e" : colors.textMuted }}>{post.likes?.length || 0}</Text>
                  </Pressable>
                  <Pressable onPress={(event) => { event.stopPropagation(); openComments(post); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <MessageCircle size={18} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted }}>{post.comments?.length || 0}</Text>
                  </Pressable>
                  {/* <Pressable onPress={(event) => { event.stopPropagation(); handleShare(post); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Share2 size={18} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted }}>{post.shareCount || 0}</Text>
                  </Pressable> */}
                  <Pressable onPress={(event) => { event.stopPropagation(); handleSave(post.id); }} style={{ marginLeft: "auto" }}>
                    <Bookmark size={18} color={isPostSaved(post.savedBy) ? colors.brand : colors.textMuted} fill={isPostSaved(post.savedBy) ? colors.brand : "transparent"} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
      </ScrollView>

      <Pressable
        onPress={() => setIsCreateModalVisible(true)}
        style={{ position: "absolute", bottom: 20, right: 20, zIndex: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", shadowColor: colors.brand, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 }}
      >
        <Plus size={24} color="#fff" strokeWidth={3} />
      </Pressable>

      <Modal visible={isCreateModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: "88%" }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24, paddingBottom: 34 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>Create New Post</Text>
                <Pressable onPress={() => setIsCreateModalVisible(false)} style={{ padding: 4 }}>
                  <X size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 12, textTransform: "uppercase" }}>Select Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18, marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
                {postCategories.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: selectedCategory === category ? colors.brand : colors.bgSubtle, borderWidth: 1, borderColor: selectedCategory === category ? colors.brand : colors.border }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: selectedCategory === category ? "#fff" : colors.textPrimary }}>{category}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 12, textTransform: "uppercase" }}>Add Image</Text>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 18, alignItems: "center" }}>
                <Pressable
                  onPress={selectedImage ? () => setSelectedImage(null) : handlePickPostImage}
                  disabled={uploadingImage}
                  style={{ width: 88, height: 88, borderRadius: 16, borderWidth: 1, borderColor: !selectedImage ? colors.brand : colors.border, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center", overflow: "hidden" }}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={colors.brand} />
                  ) : (
                    <>
                      <ImagePlus size={20} color={colors.textMuted} />
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, marginTop: 6 }}>No image</Text>
                    </>
                  )}
                </Pressable>
                {selectedImage ? (
                  <View style={{ width: 88, height: 88, borderRadius: 16, overflow: "hidden", borderWidth: 2, borderColor: colors.brand }}>
                    <Image source={{ uri: selectedImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  </View>
                ) : (
                  <Pressable
                    onPress={handlePickPostImage}
                    disabled={uploadingImage}
                    style={{ flex: 1, height: 88, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color={colors.brand} />
                    ) : (
                      <>
                        <ImagePlus size={18} color={colors.brand} />
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.brand }}>{uploadingImage ? "Uploading..." : "Pick from Library"}</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>

              {/* Social Sync Toggle */}
              <View style={{ marginTop: 12, backgroundColor: colors.bgSubtle, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#E1306C15", alignItems: "center", justifyContent: "center" }}>
                    <Instagram size={20} color="#E1306C" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>Post to Instagram</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>Automatically sync this post</Text>
                  </View>
                </View>
                <Pressable 
                  onPress={handleToggleSync}
                  style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: user?.instagramSyncEnabled ? colors.brand : colors.border, padding: 2 }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", alignSelf: user?.instagramSyncEnabled ? "flex-end" : "flex-start" }} />
                </Pressable>
              </View>

              <TextInput
                placeholder="What's on your mind? Share tips, ask questions, or post updates..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={newPostText}
                onChangeText={setNewPostText}
                style={{ fontSize: 16, color: colors.textPrimary, textAlignVertical: "top", minHeight: 180, padding: 16, backgroundColor: colors.bgSubtle, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}
              />

              <Pressable
                onPress={handlePost}
                disabled={submitting}
                style={{ marginTop: 24, backgroundColor: colors.brand, borderRadius: 16, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Post to Community</Text>
                    <ArrowRight size={18} color="#fff" />
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={isCommentModalVisible} animationType="slide" transparent onRequestClose={() => setIsCommentModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "75%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Comments</Text>
              <Pressable onPress={() => setIsCommentModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              {(selectedPost?.comments || []).length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: "center", opacity: 0.55 }}>
                  <MessageCircle size={36} color={colors.textMuted} />
                  <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 14 }}>No comments yet</Text>
                </View>
              ) : (
                (selectedPost?.comments || []).map((comment: any) => (
                  <View key={comment.id} style={{ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle || colors.border }}>
                    {comment.author?.avatar_url ? (
                      <Image source={{ uri: comment.author.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                        <PawPrint size={16} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{comment.author?.name || "Member"}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>{timeAgo(comment.createdAt)}</Text>
                      </View>
                      <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 4, lineHeight: 20 }}>{comment.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TextInput
                placeholder="Write a comment..."
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                style={{ minHeight: 56, maxHeight: 120, padding: 14, backgroundColor: colors.bgSubtle, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, textAlignVertical: "top" }}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Instagram Share Prompt Modal - Premium Meta-style Design */}
      <Modal visible={showSharePrompt} animationType="slide" transparent onRequestClose={() => setShowSharePrompt(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)" }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: "92%" }}>
              <View style={{ padding: 24 }}>
                <Pressable onPress={() => setShowSharePrompt(false)} style={{ alignSelf: "flex-start", padding: 8, marginLeft: -8 }}>
                  <X size={24} color={colors.textPrimary} />
                </Pressable>
                
                <View style={{ alignItems: "center", marginTop: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Cross-Platform Sharing</Text>
                  <Text style={{ fontSize: 26, fontWeight: "800", color: colors.textPrimary, textAlign: "center", marginBottom: 32 }}>Unlock sharing to Instagram</Text>
                  
                  {/* Accounts Center Visual */}
                  <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 24, padding: 32, width: "100%", alignItems: "center", marginBottom: 40, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textMuted, marginBottom: 20 }}>FurrCircle Sync</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                      <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: colors.brand, padding: 2, backgroundColor: colors.bg }}>
                        {user?.avatar_url ? (
                          <Image source={{ uri: user.avatar_url }} style={{ width: "100%", height: "100%", borderRadius: 30 }} />
                        ) : (
                          <View style={{ width: "100%", height: "100%", borderRadius: 30, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                            <PawPrint size={24} color={colors.brand} />
                          </View>
                        )}
                        <View style={{ position: "absolute", bottom: -4, right: -4, backgroundColor: colors.brand, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.bgCard }}>
                          <PawPrint size={10} color="#fff" />
                        </View>
                      </View>
                      
                      <View style={{ width: 30, height: 2, backgroundColor: colors.border, borderRadius: 1 }} />
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border }} />
                      <View style={{ width: 30, height: 2, backgroundColor: colors.border, borderRadius: 1 }} />

                      <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: "#E1306C", padding: 2, backgroundColor: colors.bg }}>
                        <LinearGradient
                          colors={['#833ab4', '#fd1d1d', '#fcb045']}
                          style={{ width: "100%", height: "100%", borderRadius: 30, alignItems: "center", justifyContent: "center" }}
                        >
                          <Instagram size={32} color="#fff" />
                        </LinearGradient>
                        <View style={{ position: "absolute", bottom: -4, right: -4, backgroundColor: "#E1306C", width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.bgCard }}>
                          <Instagram size={10} color="#fff" />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Feature List */}
                  <View style={{ width: "100%", gap: 24, paddingHorizontal: 4 }}>
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                        <ImagePlus size={22} color={colors.brand} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>Share your pet moments</Text>
                        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 2, lineHeight: 20 }}>Easily share your community posts and photos to Instagram Stories with one tap.</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                        <Shield size={22} color={colors.brand} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>You're in control</Text>
                        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 2, lineHeight: 20 }}>Choose what to share and when. Your FurrCircle data is never shared without permission.</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                        <Users size={22} color={colors.brand} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>Grow your pack</Text>
                        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 2, lineHeight: 20 }}>Reach more pet lovers across platforms and grow the community together.</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: "100%", marginTop: 40, gap: 12 }}>
                    <Pressable 
                      onPress={handleConfirmSync} 
                      disabled={submitting}
                      style={{ width: "100%", borderRadius: 18, overflow: "hidden" }}
                    >
                      <LinearGradient
                        colors={['#0064e0', '#0064e0']} // Meta-style blue button
                        style={{ paddingVertical: 18, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                      >
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Confirm & Sync Instagram</Text>}
                      </LinearGradient>
                    </Pressable>

                    <Pressable 
                      onPress={() => setShowSharePrompt(false)}
                      style={{ width: "100%", paddingVertical: 18, alignItems: "center", borderRadius: 18, backgroundColor: colors.bgSubtle }}
                    >
                      <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 16 }}>Not Now</Text>
                    </Pressable>
                  </View>

                  <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: 20, paddingHorizontal: 20, lineHeight: 18 }}>
                    By confirming, you agree to share your content from FurrCircle to Instagram. See our <Text style={{ color: colors.brand, fontWeight: "600" }}>Privacy Policy</Text> for more info.
                  </Text>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
