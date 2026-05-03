import React, { useEffect, useRef, useState } from "react";
import { View, Image, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, RefreshControl, Share, FlatList } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { Heart, MessageCircle, Bookmark, Plus, X, ArrowRight, PawPrint, ImagePlus } from "@/components/ui/IconCompat";
import { useRouter } from "expo-router";
import StatusChip from "../../components/ui/StatusChip";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userCommunityApi, type FeedTab, type StoryGroup, type MyStoryResponse } from "@/services/users/communityApi";
import { pickAndUploadImage } from "@/services/uploadApi";
import StoriesBar from "@/components/community/StoriesBar";
import StoryViewer from "@/components/community/StoryViewer";
import StoryCreateSheet from "@/components/community/StoryCreateSheet";

const postCategories = ["General", "Health", "Adoption", "Training", "Nutrition", "Lost & Found"];
const FEED_TABS: { key: FeedTab; label: string }[] = [
  { key: "for_you", label: "For You" },
  { key: "trending", label: "Trending" },
  { key: "nearby", label: "Nearby" },
];

type TabState = { posts: any[]; page: number; hasMore: boolean; loading: boolean; hint?: string };
const initialTabState: TabState = { posts: [], page: 1, hasMore: true, loading: false };

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

export default function CommunityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  // Feed state
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTab>("for_you");
  const [feedStates, setFeedStates] = useState<Record<FeedTab, TabState>>({
    for_you: { ...initialTabState },
    trending: { ...initialTabState },
    nearby: { ...initialTabState },
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stories state
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [myStory, setMyStory] = useState<MyStoryResponse | null>(null);
  const [storyViewerState, setStoryViewerState] = useState({ visible: false, groupIndex: 0, storyIndex: 0 });
  const [storyCreateVisible, setStoryCreateVisible] = useState(false);
  const [viewingMyStory, setViewingMyStory] = useState(false);

  // Post creation state
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

  const loadedTabsRef = useRef<Set<FeedTab>>(new Set());

  const loadFeedTab = async (tab: FeedTab, page: number, replace = false) => {
    setFeedStates((prev) => ({ ...prev, [tab]: { ...prev[tab], loading: true } }));
    try {
      const result = await userCommunityApi.getFeed({ tab, page, limit: 20 });
      setFeedStates((prev) => ({
        ...prev,
        [tab]: {
          posts: replace ? result.posts : [...prev[tab].posts, ...result.posts],
          page,
          hasMore: result.pagination.hasMore,
          loading: false,
          hint: (result as any).hint,
        },
      }));
      loadedTabsRef.current.add(tab);
    } catch {
      setFeedStates((prev) => ({ ...prev, [tab]: { ...prev[tab], loading: false } }));
    }
  };

  const loadStories = async () => {
    try {
      const [groups, mine] = await Promise.all([
        userCommunityApi.getStories(),
        userCommunityApi.getMyStory(),
      ]);
      setStoryGroups((groups as StoryGroup[]) || []);
      setMyStory((mine as MyStoryResponse) || null);
    } catch {
      // stories are non-critical; silently ignore
    }
  };

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) {
      loadedTabsRef.current.clear();
      setStoryGroups([]);
    }
    await Promise.all([loadFeedTab("for_you", 1, true), loadStories()]);
    setInitialLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setFeedStates({
      for_you: { ...initialTabState },
      trending: { ...initialTabState },
      nearby: { ...initialTabState },
    });
    fetchAll(true);
  };

  const handleTabChange = (tab: FeedTab) => {
    setActiveFeedTab(tab);
    if (!loadedTabsRef.current.has(tab)) {
      loadFeedTab(tab, 1, true);
    }
  };

  const handleLoadMore = () => {
    const tabState = feedStates[activeFeedTab];
    if (!tabState.loading && tabState.hasMore) {
      loadFeedTab(activeFeedTab, tabState.page + 1);
    }
  };

  const handlePickPostImage = async () => {
    try {
      setUploadingImage(true);
      const url = await pickAndUploadImage("posts", { aspect: [4, 3], allowsEditing: true });
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
      const newPost = await userCommunityApi.createPost({
        content: newPostText.trim(),
        category: selectedCategory,
        imageUrl: selectedImage || undefined,
      });
      setIsCreateModalVisible(false);
      setNewPostText("");
      setSelectedImage(null);
      // Prepend new post to all tabs
      if (newPost) {
        setFeedStates((prev) => {
          const updated = { ...prev };
          (Object.keys(updated) as FeedTab[]).forEach((tab) => {
            updated[tab] = { ...updated[tab], posts: [newPost, ...updated[tab].posts] };
          });
          return updated;
        });
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit post");
    } finally {
      setSubmitting(false);
    }
  };

  const updatePostInFeed = (postId: string, updater: (post: any) => any) => {
    setFeedStates((prev) => {
      const updated = { ...prev };
      (Object.keys(updated) as FeedTab[]).forEach((tab) => {
        updated[tab] = {
          ...updated[tab],
          posts: updated[tab].posts.map((p) => (p.id === postId ? updater(p) : p)),
        };
      });
      return updated;
    });
    if (selectedPost?.id === postId) {
      setSelectedPost((prev: any) => (prev ? updater(prev) : prev));
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await userCommunityApi.togglePostLike(postId);
      updatePostInFeed(postId, (post) => {
        const likes = res.liked
          ? [...post.likes, { userId: user?.id }]
          : post.likes.filter((like: any) => like.userId !== user?.id);
        return { ...post, likes };
      });
    } catch (error) {
      console.error("Error toggling like", error);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const res = await userCommunityApi.togglePostSave(postId);
      updatePostInFeed(postId, (post) => {
        const savedBy = res.saved
          ? [...(post.savedBy || []), user?.id]
          : (post.savedBy || []).filter((uid: string) => uid !== user?.id);
        return { ...post, savedBy };
      });
    } catch (error) {
      console.error("Error saving post", error);
    }
  };

  const handleShare = async (post: any) => {
    try {
      const res = await userCommunityApi.sharePost(post.id);
      await Share.share({ message: `${post.author?.name || "FurrCircle member"} posted in ${post.category}: ${post.content}` });
      updatePostInFeed(post.id, (p) => ({ ...p, shareCount: res.shareCount }));
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
      const res = await userCommunityApi.addPostComment(selectedPost.id, commentText.trim());
      updatePostInFeed(selectedPost.id, (post) => ({
        ...post,
        comments: [...(post.comments || []), res.comment],
      }));
      setCommentText("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const isPostLiked = (postLikes: any[]) => postLikes.some((like: any) => like.userId === user?.id);
  const isPostSaved = (savedBy: string[] = []) => savedBy.includes(String(user?.id || ""));

  const currentTabState = feedStates[activeFeedTab];
  const filteredPosts = currentTabState.posts;

  // Story press handlers
  const handlePressStory = (group: StoryGroup, startIndex: number) => {
    const idx = storyGroups.findIndex((g) => g.userId === group.userId);
    setStoryViewerState({ visible: true, groupIndex: Math.max(0, idx), storyIndex: startIndex });
    setViewingMyStory(false);
  };

  const handlePressMyStory = () => {
    setStoryViewerState({ visible: true, groupIndex: 0, storyIndex: 0 });
    setViewingMyStory(true);
  };

  const handleStoryViewerClose = () => {
    setStoryViewerState((prev) => ({ ...prev, visible: false }));
    setViewingMyStory(false);
    loadStories();
  };

  const handleStoryCreated = () => {
    loadStories();
  };

  // Build story viewer groups (for "my story" we pass a separate prop)
  const myStoryGroup: StoryGroup | null = myStory && myStory.stories.length > 0
    ? { userId: user?.id || "", author: { id: user?.id || "", name: user?.name || "Me", avatar_url: user?.avatar || null }, stories: myStory.stories }
    : null;

  const renderPostItem = ({ item: post }: { item: any }) => (
    <Pressable
      key={post.id}
      onPress={() => router.push(`/community/posts/${post.id}` as any)}
      style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16, marginHorizontal: 20 }}
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
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={{ width: "100%", height: 176, borderRadius: 12, marginBottom: 12 }} resizeMode="cover" />
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 18, paddingTop: 4 }}>
        <Pressable onPress={(e) => { e.stopPropagation(); handleLike(post.id); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Heart size={18} color={isPostLiked(post.likes) ? "#f43f5e" : colors.textMuted} fill={isPostLiked(post.likes) ? "#f43f5e" : "transparent"} />
          <Text style={{ fontSize: 12, fontWeight: "500", color: isPostLiked(post.likes) ? "#f43f5e" : colors.textMuted }}>{post.likes?.length || 0}</Text>
        </Pressable>
        <Pressable onPress={(e) => { e.stopPropagation(); openComments(post); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MessageCircle size={18} color={colors.textMuted} />
          <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted }}>{post.comments?.length || 0}</Text>
        </Pressable>
        <Pressable onPress={(e) => { e.stopPropagation(); handleSave(post.id); }} style={{ marginLeft: "auto" }}>
          <Bookmark size={18} color={isPostSaved(post.savedBy) ? colors.brand : colors.textMuted} fill={isPostSaved(post.savedBy) ? colors.brand : "transparent"} />
        </Pressable>
      </View>
    </Pressable>
  );

  const renderListHeader = () => (
    <View style={{ paddingTop: 16 }}>
      {/* Title */}
      <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textPrimary, marginBottom: 14, paddingHorizontal: 20 }}>Community</Text>

      {/* Feed tabs */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, paddingHorizontal: 20 }}>
        {FEED_TABS.map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => handleTabChange(key)}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: activeFeedTab === key ? colors.brand : colors.bgSubtle,
              borderWidth: 1,
              borderColor: activeFeedTab === key ? colors.brand : colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: activeFeedTab === key ? "#fff" : colors.textMuted }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Stories bar — full width, handles its own horizontal padding */}
      <StoriesBar
        storyGroups={storyGroups}
        myStory={myStory}
        currentUserId={user?.id || ""}
        currentUserAvatar={user?.avatar}
        currentUserName={user?.name}
        onPressStory={handlePressStory}
        onPressMyStory={handlePressMyStory}
        onPressAddStory={() => setStoryCreateVisible(true)}
      />

      {/* Nearby hint */}
      {activeFeedTab === "nearby" && currentTabState.hint && (
        <View style={{ marginBottom: 12, marginHorizontal: 20, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.bgSubtle, borderRadius: 12 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>{currentTabState.hint}</Text>
        </View>
      )}
    </View>
  );

  const renderListFooter = () => {
    if (!currentTabState.loading || filteredPosts.length === 0) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (currentTabState.loading) return null;
    return (
      <View style={{ paddingVertical: 40, alignItems: "center", opacity: 0.5, marginHorizontal: 20 }}>
        <MessageCircle size={48} color={colors.textMuted} strokeWidth={1} />
        <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
          {activeFeedTab === "nearby"
            ? "No posts in your city yet. Be the first to post!"
            : "No posts found for this category"}
        </Text>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostItem}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: 100 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable
        onPress={() => setIsCreateModalVisible(true)}
        style={{
          position: "absolute", bottom: 20, right: 20, zIndex: 20,
          width: 60, height: 60, borderRadius: 30, backgroundColor: colors.brand,
          alignItems: "center", justifyContent: "center",
          shadowColor: colors.brand, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
        }}
      >
        <Plus size={24} color="#fff" strokeWidth={3} />
      </Pressable>

      {/* Story components */}
      <StoryCreateSheet
        visible={storyCreateVisible}
        onClose={() => setStoryCreateVisible(false)}
        onSuccess={handleStoryCreated}
      />

      <StoryViewer
        visible={storyViewerState.visible}
        storyGroups={storyGroups}
        myStoryGroup={viewingMyStory ? myStoryGroup : null}
        initialGroupIndex={storyViewerState.groupIndex}
        initialStoryIndex={storyViewerState.storyIndex}
        onClose={handleStoryViewerClose}
      />

      {/* Create post modal */}
      <Modal visible={isCreateModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsCreateModalVisible(false)} />
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: "88%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>Create New Post</Text>
              <Pressable onPress={() => setIsCreateModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <FlatList
              data={[]}
              renderItem={null}
              ListHeaderComponent={
                <View style={{ paddingHorizontal: 24, paddingBottom: 34 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 12, marginTop: 20, textTransform: "uppercase" }}>Select Category</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                    {postCategories.map((category) => (
                      <Pressable
                        key={category}
                        onPress={() => setSelectedCategory(category)}
                        style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: selectedCategory === category ? colors.brand : colors.bgSubtle, borderWidth: 1, borderColor: selectedCategory === category ? colors.brand : colors.border }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: "600", color: selectedCategory === category ? "#fff" : colors.textPrimary }}>{category}</Text>
                      </Pressable>
                    ))}
                  </View>

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
                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.brand }}>Pick from Library</Text>
                          </>
                        )}
                      </Pressable>
                    )}
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
                </View>
              }
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comment modal */}
      <Modal visible={isCommentModalVisible} animationType="slide" transparent onRequestClose={() => setIsCommentModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "75%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Comments</Text>
              <Pressable onPress={() => setIsCommentModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <FlatList
              data={selectedPost?.comments || []}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={{ paddingVertical: 32, alignItems: "center", opacity: 0.55 }}>
                  <MessageCircle size={36} color={colors.textMuted} />
                  <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 14 }}>No comments yet</Text>
                </View>
              }
              renderItem={({ item: comment }: { item: any }) => (
                <View style={{ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle || colors.border }}>
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
              )}
            />
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
