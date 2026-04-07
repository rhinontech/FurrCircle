import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, RefreshControl, Share } from "react-native";
import { Heart, MessageCircle, Share2, Bookmark, Calendar, Plus, X, ArrowRight, ShieldCheck, PawPrint, ImagePlus, Send } from "lucide-react-native";
import { useRouter } from "expo-router";
import StatusChip from "../../components/ui/StatusChip";
import { useTheme } from "../../contexts/ThemeContext";
import EventCard from "../../components/ui/EventCard";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const postCategories = ["General", "Health", "Adoption", "Training", "Nutrition", "Lost & Found"];
const feedCategories = ["All", "Events", "Health", "Adoption", "Training", "Nutrition"];
const communitySections = ["Feed", "Chats"];
const demoPostImages = [
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80"
];

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

  const [activeSection, setActiveSection] = useState("Feed");
  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [newPostText, setNewPostText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hasPendingPost, setHasPendingPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const fetchCommunity = async () => {
    try {
      const [feedData, eventsData, chatsData] = await Promise.all([
        api.get("/community/feed"),
        api.get("/community/events"),
        api.get("/community/chats")
      ]);
      setPosts(feedData || []);
      setEvents(formatEvents(eventsData || []));
      setChats(chatsData || []);
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

  const handlePost = async () => {
    if (!newPostText.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/community/posts", {
        content: newPostText.trim(),
        category: selectedCategory,
        imageUrl: selectedImage || undefined
      });
      setIsCreateModalVisible(false);
      setHasPendingPost(true);
      setNewPostText("");
      setSelectedImage(null);
      await fetchCommunity();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await api.post(`/community/posts/${postId}/like`);
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
      const res = await api.post(`/community/posts/${postId}/save`);
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
      const res = await api.post(`/community/posts/${post.id}/share`);
      await Share.share({
        message: `${post.author?.name || "PawsHub member"} posted in ${post.category}: ${post.content}`
      });
      setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, shareCount: res.shareCount } : item)));
    } catch (error) {
      console.error("Error sharing post", error);
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
      const res = await api.post(`/community/posts/${selectedPost.id}/comment`, { text: commentText.trim() });
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

          <View style={{ flexDirection: "row", backgroundColor: colors.bgSubtle, borderRadius: 18, padding: 4, marginBottom: 20 }}>
            {communitySections.map((section) => {
              const selected = activeSection === section;
              return (
                <Pressable
                  key={section}
                  onPress={() => setActiveSection(section)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: selected ? colors.bgCard : "transparent", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: selected ? colors.textPrimary : colors.textMuted }}>{section}</Text>
                </Pressable>
              );
            })}
          </View>

          {activeSection === "Feed" && hasPendingPost && (
            <View style={{ backgroundColor: colors.infoBg + "40", borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.brand + "20", flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand + "10", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={20} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>Post Under Review</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Your {selectedCategory} post is being verified by admins.</Text>
              </View>
              <Pressable onPress={() => setHasPendingPost(false)}>
                <X size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          )}

          {activeSection === "Feed" ? (
            <>
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
                    <Pressable onPress={() => router.push("/community/events" as any)}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.brand }}>See All</Text>
                    </Pressable>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
                    {events.map((event) => (
                      <EventCard key={event.id} {...event} onPress={() => router.push(`/community/events/${event.id}` as any)} />
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 16 }}>
                {activeCategory === "Events" ? "Past Events" : "Recent Posts"}
              </Text>
            </>
          ) : (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 }}>Messages & Adoption Requests</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20 }}>
                Use chat for adoption questions, foster follow-ups, and direct conversations with pet owners, shelters, and vets.
              </Text>
            </View>
          )}
        </View>

        {activeSection === "Feed" ? (
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
                  <Pressable onPress={(event) => { event.stopPropagation(); handleShare(post); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Share2 size={18} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted }}>{post.shareCount || 0}</Text>
                  </Pressable>
                  <Pressable onPress={(event) => { event.stopPropagation(); handleSave(post.id); }} style={{ marginLeft: "auto" }}>
                    <Bookmark size={18} color={isPostSaved(post.savedBy) ? colors.brand : colors.textMuted} fill={isPostSaved(post.savedBy) ? colors.brand : "transparent"} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 14 }}>
            {chats.length === 0 ? (
              <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingVertical: 40, alignItems: "center" }}>
                <MessageCircle size={42} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={{ marginTop: 14, fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>No chats yet</Text>
                <Text style={{ marginTop: 8, fontSize: 13, color: colors.textMuted, textAlign: "center", paddingHorizontal: 32, lineHeight: 20 }}>
                  Start an adoption or foster request from Discover and your conversation will appear here.
                </Text>
              </View>
            ) : (
              chats.map((chat) => {
                const partner = chat.otherParticipants?.[0] || chat.participants?.find((item: any) => item.id !== user?.id);
                const lastMessage = chat.lastMessage;
                return (
                  <Pressable
                    key={chat.id}
                    onPress={() => router.push(`/community/chat/${chat.id}` as any)}
                    style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    {partner?.avatar_url ? (
                      <Image source={{ uri: partner.avatar_url }} style={{ width: 52, height: 52, borderRadius: 18 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                        <PawPrint size={22} color={colors.brand} />
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary, flex: 1, marginRight: 8 }}>
                          {chat.title || partner?.clinic_name || partner?.name || "Conversation"}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>{lastMessage?.createdAt ? timeAgo(lastMessage.createdAt) : ""}</Text>
                      </View>
                      <Text numberOfLines={1} style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>
                        {chat.pet?.name ? `About ${chat.pet.name}` : partner?.role === "veterinarian" ? "Vet support chat" : "Direct message"}
                      </Text>
                      <Text numberOfLines={2} style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 18 }}>
                        {lastMessage?.text || "No messages yet"}
                      </Text>
                    </View>
                    <Send size={18} color={colors.brand} />
                  </Pressable>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {activeSection === "Feed" && (
        <Pressable
          onPress={() => setIsCreateModalVisible(true)}
          style={{ position: "absolute", bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", shadowColor: colors.brand, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 }}
        >
          <Plus size={24} color="#fff" strokeWidth={3} />
        </Pressable>
      )}

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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18, marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}>
                <Pressable
                  onPress={() => setSelectedImage(null)}
                  style={{ width: 88, height: 88, borderRadius: 16, borderWidth: 1, borderColor: !selectedImage ? colors.brand : colors.border, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}
                >
                  <ImagePlus size={20} color={colors.textMuted} />
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, marginTop: 6 }}>No image</Text>
                </Pressable>
                {demoPostImages.map((imageUrl) => {
                  const selected = selectedImage === imageUrl;
                  return (
                    <Pressable
                      key={imageUrl}
                      onPress={() => setSelectedImage(imageUrl)}
                      style={{ width: 88, height: 88, borderRadius: 16, overflow: "hidden", borderWidth: 2, borderColor: selected ? colors.brand : "transparent" }}
                    >
                      <Image source={{ uri: imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    </Pressable>
                  );
                })}
              </ScrollView>

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
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Submit for Verification</Text>
                    <ArrowRight size={18} color="#fff" />
                  </>
                )}
              </Pressable>
              <Text style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: colors.textMuted }}>Your post will be reviewed by our moderation team before appearing in the feed.</Text>
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
                  <View key={comment.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle || colors.border }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{comment.author?.name || "Member"}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{timeAgo(comment.createdAt)}</Text>
                    <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 8, lineHeight: 20 }}>{comment.text}</Text>
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
    </View>
  );
}

