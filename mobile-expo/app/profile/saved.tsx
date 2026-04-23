import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  ChevronLeft,
  Star,
  MapPin,
  Phone,
  Bookmark,
  Stethoscope,
  Heart,
  MessageCircle,
  Share2,
  X,
  PawPrint,
} from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userDiscoverApi } from "../../services/users/discoverApi";
import { userCommunityApi } from "../../services/users/communityApi";
import StatusChip from "../../components/ui/StatusChip";

function timeAgo(date?: string) {
  if (!date) return "";
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

export default function SavedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"vets" | "posts">("vets");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Vets State
  const [vets, setVets] = useState<any[]>([]);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  // Posts State
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      if (activeTab === "vets") {
        const data = await userDiscoverApi.listSavedVets();
        setVets(data || []);
      } else {
        const feed = await userCommunityApi.listFeed();
        const savedPosts = (feed || []).filter((post: any) =>
          (post.savedBy || []).includes(String(user?.id))
        );
        setPosts(savedPosts);
      }
    } catch (e) {
      console.error("Failed to load saved data", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [activeTab])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Vets Handlers
  const handleUnsaveVet = (vet: any) => {
    Alert.alert("Remove Saved Vet", `Remove ${vet.clinic_name || vet.name} from saved vets?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setUnsavingId(vet.id);
          try {
            await userDiscoverApi.unsaveVet(vet.id);
            setVets((prev) => prev.filter((v) => v.id !== vet.id));
          } catch (e: any) {
            Alert.alert("Error", e.message || "Could not remove saved vet.");
          } finally {
            setUnsavingId(null);
          }
        },
      },
    ]);
  };

  const handleCall = async (phone?: string) => {
    if (!phone) {
      Alert.alert("Phone unavailable", "This clinic does not have a phone number.");
      return;
    }
    const url = `tel:${phone.replace(/[^\d+]/g, "")}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) Linking.openURL(url);
    else Alert.alert("Unable to call", "Calling is not supported on this device.");
  };

  // Posts Handlers
  const handleLikePost = async (postId: string) => {
    try {
      const res = await userCommunityApi.togglePostLike(postId);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const likes = res.liked
              ? [...(post.likes || []), { userId: user?.id }]
              : (post.likes || []).filter((like: any) => String(like.userId) !== String(user?.id));
            return { ...post, likes };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error toggling like", error);
    }
  };

  const handleSavePost = async (postId: string) => {
    try {
      const res = await userCommunityApi.togglePostSave(postId);
      if (!res.saved) {
        // If unsaved, remove from list in this screen
        setPosts((prev) => prev.filter((post) => post.id !== postId));
      } else {
        // This shouldn't happen often in the "Saved" tab but for safety:
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return { ...post, savedBy: [...(post.savedBy || []), String(user?.id)] };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling save", error);
    }
  };

  const handleSharePost = async (post: any) => {
    try {
      const res = await userCommunityApi.sharePost(post.id);
      await Share.share({
        message: `${post.author?.name || "FurrCircle member"} posted in ${post.category}: ${post.content}`,
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, shareCount: res.shareCount } : p))
      );
    } catch (error) {
      console.error("Error sharing post", error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await userCommunityApi.addPostComment(selectedPost.id, commentText.trim());
      const updatedPost = {
        ...selectedPost,
        comments: [...(selectedPost.comments || []), res.comment],
      };
      setSelectedPost(updatedPost);
      setPosts((prev) => prev.map((p) => (p.id === selectedPost.id ? updatedPost : p)));
      setCommentText("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>Saved</Text>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => setActiveTab("vets")}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: activeTab === "vets" ? colors.brand : colors.bgCard,
            borderWidth: 1,
            borderColor: activeTab === "vets" ? colors.brand : colors.border,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: activeTab === "vets" ? "#fff" : colors.textPrimary,
            }}
          >
            Vets
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("posts")}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: activeTab === "posts" ? colors.brand : colors.bgCard,
            borderWidth: 1,
            borderColor: activeTab === "posts" ? colors.brand : colors.border,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: activeTab === "posts" ? "#fff" : colors.textPrimary,
            }}
          >
            Posts
          </Text>
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : activeTab === "vets" ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
          }
        >
          {vets.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 }}>
              <Bookmark size={48} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
                No saved vets yet
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", paddingHorizontal: 32 }}>
                Save vets from their profile page to find them quickly later.
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/discover?category=Vets")}
                style={{
                  marginTop: 12,
                  backgroundColor: colors.brand,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Discover Vets</Text>
              </Pressable>
            </View>
          ) : (
            vets.map((vet) => (
              <View
                key={vet.id}
                style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  {vet.avatar ? (
                    <Image
                      source={{ uri: vet.avatar }}
                      style={{ width: 56, height: 56, borderRadius: 16 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: colors.bgSubtle,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Stethoscope size={24} color={colors.brand} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}
                    >
                      {vet.clinic_name || vet.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                      {vet.specialty || "General Veterinary Care"}
                    </Text>
                    {vet.rating && (
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>
                          {vet.rating}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleUnsaveVet(vet)}
                    disabled={unsavingId === vet.id}
                    style={{ padding: 8 }}
                  >
                    {unsavingId === vet.id ? (
                      <ActivityIndicator size="small" color={colors.brand} />
                    ) : (
                      <Bookmark size={20} color={colors.brand} fill={colors.brand} />
                    )}
                  </Pressable>
                </View>

                {vet.city && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 12,
                    }}
                  >
                    <MapPin size={14} color={colors.textMuted} />
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>{vet.city}</Text>
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => router.push(`/vets/${vet.id}`)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.brand,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
                      View Profile
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCall(vet.phone)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.brand + "15",
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Phone size={14} color={colors.brand} />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.brand }}>
                      Call
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
          }
        >
          {posts.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 }}>
              <Bookmark size={48} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
                No bookmarked posts
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", paddingHorizontal: 32 }}>
                Save interesting posts from the community to find them here.
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/community")}
                style={{
                  marginTop: 12,
                  backgroundColor: colors.brand,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Go to Community</Text>
              </Pressable>
            </View>
          ) : (
            posts.map((post) => (
              <Pressable
                key={post.id}
                onPress={() => router.push(`/community/posts/${post.id}`)}
                style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                {/* Post Header */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  {post.author?.avatar_url ? (
                    <Image
                      source={{ uri: post.author.avatar_url }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.bgSubtle,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PawPrint size={20} color={colors.brand} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>
                        {post.author?.name || "User"}
                      </Text>
                      <StatusChip label={post.author?.role?.toUpperCase() || "MEMBER"} variant="info" />
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      {timeAgo(post.createdAt)} · {post.category}
                    </Text>
                  </View>
                </View>

                {/* Post Content */}
                <Text
                  style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 20, marginBottom: 12 }}
                  numberOfLines={4}
                >
                  {post.content}
                </Text>

                {post.imageUrl && (
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={{ width: "100%", height: 180, borderRadius: 16, marginBottom: 12 }}
                    resizeMode="cover"
                  />
                )}

                {/* Post Actions */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 18, paddingTop: 4 }}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLikePost(post.id);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
                    {(() => {
                      const isLiked = (post.likes || []).some(
                        (l: any) => String(l.userId) === String(user?.id)
                      );
                      return (
                        <>
                          <Heart
                            size={18}
                            color={isLiked ? "#f43f5e" : colors.textMuted}
                            fill={isLiked ? "#f43f5e" : "transparent"}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "500",
                              color: isLiked ? "#f43f5e" : colors.textMuted,
                            }}
                          >
                            {post.likes?.length || 0}
                          </Text>
                        </>
                      );
                    })()}
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                      setIsCommentModalVisible(true);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
                    <MessageCircle size={18} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted }}>
                      {post.comments?.length || 0}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSharePost(post);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
                    <Share2 size={18} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted }}>
                      {post.shareCount || 0}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSavePost(post.id);
                    }}
                    style={{ marginLeft: "auto" }}
                  >
                    <Bookmark size={18} color={colors.brand} fill={colors.brand} />
                  </Pressable>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      {/* Comment Modal */}
      <Modal visible={isCommentModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
        >
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: "75%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 12,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>
                Comments
              </Text>
              <Pressable
                onPress={() => {
                  setIsCommentModalVisible(false);
                  setSelectedPost(null);
                }}
              >
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              {(selectedPost?.comments || []).length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: "center", opacity: 0.55 }}>
                  <MessageCircle size={36} color={colors.textMuted} />
                  <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 14 }}>
                    No comments yet
                  </Text>
                </View>
              ) : (
                (selectedPost?.comments || []).map((comment: any) => (
                  <View
                    key={comment.id}
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    {comment.author?.avatar_url ? (
                      <Image
                        source={{ uri: comment.author.avatar_url }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: colors.bgSubtle,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PawPrint size={16} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text
                          style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}
                        >
                          {comment.author?.name || "Member"}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {timeAgo(comment.createdAt)}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textPrimary,
                          marginTop: 4,
                          lineHeight: 20,
                        }}
                      >
                        {comment.text}
                      </Text>
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
                style={{
                  minHeight: 56,
                  maxHeight: 120,
                  padding: 14,
                  backgroundColor: colors.bgSubtle,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  textAlignVertical: "top",
                }}
              />
              <Pressable
                onPress={handleAddComment}
                disabled={commentSubmitting}
                style={{
                  marginTop: 12,
                  backgroundColor: colors.brand,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: commentSubmitting ? 0.7 : 1,
                }}
              >
                {commentSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Post Comment</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
