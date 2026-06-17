import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Modal, Pressable, Alert, ActivityIndicator, TextInput, FlatList,
  KeyboardAvoidingView, Keyboard,
  Platform,
  Dimensions,
  RefreshControl,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Heart, MessageCircle, Send, Bookmark, Plus, Bell, MapPin, ChevronDown, Volume2, VolumeX, MoreVertical, ChevronRight, X, Check, Edit2, Trash2, Info, Flag, Camera, HelpCircle, Sparkles, ArrowLeft } from "../../src/components/ui/icons";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as ImagePicker from "expo-image-picker";
import { posts as dummyPosts, sampleComments, type Post } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { Avatar } from "../../src/components/Avatar";
import { useTokens, useThemeStore } from "../../src/lib/theme-store";
import { useBreakpoint } from "../../src/lib/breakpoints";
import { useAuthStore } from "../../src/lib/auth-store";
import { userApi } from "../../services/user/userApi";
import { petApi } from "../../services/pet/petApi";
import { feedApi } from "../../services/community/feedApi";
import { storyApi } from "../../services/community/storyApi";
import { LocationPickerModal, LocationResult } from "../../src/components/LocationPickerModal";
import { ShareSheet } from "../../src/components/ShareSheet";
import { StoryViewer, type Story, type StoryGroup } from "../../src/components/StoryViewer";
import { Video, ResizeMode, Audio } from "expo-av";
import { useIsFocused } from "@react-navigation/native";
import Svg, { Path, Circle } from "react-native-svg";
import { useNotificationStore } from "../../src/lib/notification-store";
import { chatApi } from "../../services/chat/chatApi";
import { usePostEngagementStore } from "../../src/lib/post-engagement-store";
import { socketService } from "../../services/socket/socketService";
import { useLocationStore } from "../../src/lib/location-store";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard, GlassBlur, glassSurface } from "../../src/components/ui/Glass";
import { tabBarClearance } from "../../src/lib/tabbar";

const FEED_PAGE_SIZE = 15;
// Height of the header content below the status bar — feed content is padded by
// this so posts scroll *under* the translucent glass header.
const HEADER_CONTENT_HEIGHT = 62;

// Shown after the "following" section is exhausted. Tapping the button
// reveals the "suggested" section (posts from people you don't follow).
function CaughtUpBoundary({ empty, loading, onReveal, tk }: { empty: boolean; loading: boolean; onReveal: () => void; tk: any }) {
  return (
    <View style={styles.boundaryWrap}>
      <View style={[styles.boundaryIcon, { backgroundColor: tk.card, borderColor: tk.border }]}>
        <Check size={22} color={colors.primary} strokeWidth={3} />
      </View>
      <Text style={[styles.boundaryTitle, { color: tk.text }]}>
        {empty ? "Nothing in your feed yet" : "You're all caught up"}
      </Text>
      <Text style={[styles.boundaryText, { color: tk.textMuted }]}>
        {empty
          ? "Follow people or post to fill your feed. Want to see what others are sharing?"
          : "You've seen all posts from people you follow. Want to discover more?"}
      </Text>
      <TouchableOpacity
        style={[styles.boundaryBtn, { opacity: loading ? 0.6 : 1 }]}
        onPress={onReveal}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.boundaryBtnText}>Show suggested posts</Text>
            <ChevronDown size={18} color="#fff" strokeWidth={2.6} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Divider that introduces the suggested section once it has been revealed.
function SuggestedDivider({ tk }: { tk: any }) {
  return (
    <View style={styles.suggestedDivider}>
      <View style={[styles.suggestedLine, { backgroundColor: tk.border }]} />
      <View style={styles.suggestedLabel}>
        <Sparkles size={14} color={colors.primary} />
        <Text style={[styles.suggestedLabelText, { color: tk.textMuted }]}>Suggested for you</Text>
      </View>
      <View style={[styles.suggestedLine, { backgroundColor: tk.border }]} />
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const insets = useSafeAreaInsets();
  const [composeOpen, setComposeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const tk = useTokens();
  const [feedVideoMuted, setFeedVideoMuted] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);



  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActivePostId(viewableItems[0].key);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    }).catch(() => { });
  }, []);



  // Story states
  const [storyGroups, setStoryGroups] = useState<any[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryGroupIndex, setSelectedStoryGroupIndex] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const user = useAuthStore(s => s.user);

  // ── Feed pagination — "following" (you + people you follow) section ──
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);

  // ── "Suggested" section — everyone else, revealed only on tap ──
  const [suggestedPosts, setSuggestedPosts] = useState<any[]>([]);
  const [showSuggested, setShowSuggested] = useState(false);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedPage, setSuggestedPage] = useState(1);
  const [suggestedHasMore, setSuggestedHasMore] = useState(true);
  const [suggestedLoadingMore, setSuggestedLoadingMore] = useState(false);

  // Record which of the freshly-loaded posts the current user has liked/saved.
  const indexLikeSave = useCallback((apiPosts: any[]) => {
    const userId = user?.id;
    if (!userId) return;
    setLikedIds(prev => {
      const next = new Set(prev);
      apiPosts.forEach((p: any) => { if ((p.likes || []).some((l: any) => l.userId === userId)) next.add(p.id); });
      return next;
    });
    setSavedIds(prev => {
      const next = new Set(prev);
      apiPosts.forEach((p: any) => { if ((p.savedBy || []).includes(userId)) next.add(p.id); });
      return next;
    });
  }, [user?.id]);

  const loadStories = useCallback(async () => {
    try {
      const [groups, mine] = await Promise.all([
        storyApi.getStories(),
        storyApi.getMyStory(),
      ]);
      setStoryGroups(groups || []);

      const formattedMine: Story[] = (mine?.stories || []).map((s) => ({
        id: s.id,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: s.caption || undefined,
        viewCount: s.viewCount || 0,
      }));
      setMyStories(formattedMine);
    } catch (err) {
      console.error("Failed to load stories:", err);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    try {
      setFeedLoading(true);
      // Reset the suggested section on every fresh load / refresh
      setShowSuggested(false);
      setSuggestedPosts([]);
      setSuggestedPage(1);
      setSuggestedHasMore(true);
      // Reset like/save tracking so a refresh reflects the latest server state
      setLikedIds(new Set());
      setSavedIds(new Set());

      const data = await feedApi.getFeed('for_you', 1, FEED_PAGE_SIZE, 'following');
      const apiPosts = data?.posts || [];
      setFeedPosts(apiPosts);
      setFeedPage(1);
      setFeedHasMore(!!data?.pagination?.hasMore);
      indexLikeSave(apiPosts);
    } catch (err) {
      console.error("Failed to load feed:", err);
      setFeedPosts([]);
      setFeedHasMore(false);
    } finally {
      setFeedLoading(false);
    }
  }, [indexLikeSave]);

  // Load the next page of the "following" section as the user scrolls.
  const loadMoreFeed = useCallback(async () => {
    if (feedLoadingMore || !feedHasMore) return;
    setFeedLoadingMore(true);
    try {
      const next = feedPage + 1;
      const data = await feedApi.getFeed('for_you', next, FEED_PAGE_SIZE, 'following');
      const apiPosts = data?.posts || [];
      setFeedPosts(prev => [...prev, ...apiPosts]);
      setFeedPage(next);
      setFeedHasMore(!!data?.pagination?.hasMore);
      indexLikeSave(apiPosts);
    } catch (err) {
      console.error("Failed to load more feed:", err);
    } finally {
      setFeedLoadingMore(false);
    }
  }, [feedLoadingMore, feedHasMore, feedPage, indexLikeSave]);

  // Reveal the suggested section (everyone you don't follow) on tap.
  const revealSuggested = useCallback(async () => {
    if (suggestedLoading) return;
    setShowSuggested(true);
    setSuggestedLoading(true);
    try {
      const data = await feedApi.getFeed('for_you', 1, FEED_PAGE_SIZE, 'suggested');
      const apiPosts = data?.posts || [];
      setSuggestedPosts(apiPosts);
      setSuggestedPage(1);
      setSuggestedHasMore(!!data?.pagination?.hasMore);
      indexLikeSave(apiPosts);
    } catch (err) {
      console.error("Failed to load suggested posts:", err);
      setSuggestedHasMore(false);
    } finally {
      setSuggestedLoading(false);
    }
  }, [suggestedLoading, indexLikeSave]);

  const loadMoreSuggested = useCallback(async () => {
    if (suggestedLoadingMore || !suggestedHasMore) return;
    setSuggestedLoadingMore(true);
    try {
      const next = suggestedPage + 1;
      const data = await feedApi.getFeed('for_you', next, FEED_PAGE_SIZE, 'suggested');
      const apiPosts = data?.posts || [];
      setSuggestedPosts(prev => [...prev, ...apiPosts]);
      setSuggestedPage(next);
      setSuggestedHasMore(!!data?.pagination?.hasMore);
      indexLikeSave(apiPosts);
    } catch (err) {
      console.error("Failed to load more suggested posts:", err);
    } finally {
      setSuggestedLoadingMore(false);
    }
  }, [suggestedLoadingMore, suggestedHasMore, suggestedPage, indexLikeSave]);

  // Scroll-driven pagination: exhaust "following" first, then suggested.
  const handleEndReached = useCallback(() => {
    if (feedHasMore) loadMoreFeed();
    else if (showSuggested && suggestedHasMore) loadMoreSuggested();
  }, [feedHasMore, showSuggested, suggestedHasMore, loadMoreFeed, loadMoreSuggested]);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFeed(), loadStories()]);
    setRefreshing(false);
  }, [loadFeed, loadStories]);

  useFocusEffect(useCallback(() => {
    loadFeed();
    loadStories();
  }, [loadFeed, loadStories]));

  useEffect(() => {
    if (refresh) {
      loadFeed();
      loadStories();
    }
  }, [refresh, loadStories]);

  const handleLike = async (postId: string) => {
    const isDummy = dummyPosts.some(p => p.id === postId);
    const isLiked = likedIds.has(postId);
    setLikedIds(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(postId) : next.add(postId);
      return next;
    });

    // Update count in state (applies to both the following + suggested lists)
    const applyLike = (p: any) => {
      if (p.id !== postId) return p;
      if (isDummy) {
        return { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 };
      }
      const currentLikes = p.likes || [];
      return {
        ...p,
        likes: isLiked
          ? currentLikes.filter((l: any) => l.userId !== user?.id)
          : [...currentLikes, { userId: user?.id }],
      };
    };
    setFeedPosts(prev => prev.map(applyLike));
    setSuggestedPosts(prev => prev.map(applyLike));
    // If the server has already reported live counts for this post, nudge them
    // optimistically so the displayed number doesn't flicker before the echo.
    if (!isDummy) usePostEngagementStore.getState().bumpLike(postId, isLiked ? -1 : 1);

    if (!isDummy) {
      try { await feedApi.likePost(postId); } catch { }
    }
  };

  const handleSave = async (postId: string) => {
    const isDummy = dummyPosts.some(p => p.id === postId);
    const isSaved = savedIds.has(postId);
    setSavedIds(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(postId) : next.add(postId);
      return next;
    });
    if (!isDummy) {
      try { await feedApi.savePost(postId); } catch { }
    }
  };

  const mappedMyStoryGroup = myStories.length > 0
    ? {
      userId: "me",
      username: "Your Story",
      avatar: user?.avatar_url ? { uri: user.avatar_url } : require("../../src/assets/doodle-boy-dog.png"),
      stories: myStories.map((s: any) => {
        let overlayText = undefined;
        let overlayTextX = undefined;
        let overlayTextY = undefined;
        let textColor = undefined;
        let caption = s.caption || undefined;
        if (s.caption && s.caption.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(s.caption);
            if (parsed && typeof parsed === 'object') {
              overlayText = parsed.overlayText || undefined;
              overlayTextX = parsed.overlayTextX !== undefined ? parsed.overlayTextX : undefined;
              overlayTextY = parsed.overlayTextY !== undefined ? parsed.overlayTextY : undefined;
              textColor = parsed.textColor || undefined;
              caption = parsed.caption || undefined;
            }
          } catch (e) { }
        }
        return {
          id: s.id,
          mediaUrl: s.mediaUrl,
          mediaType: s.mediaType,
          caption,
          overlayText,
          overlayTextX,
          overlayTextY,
          textColor,
          viewCount: s.viewCount,
        };
      }),
    }
    : null;

  const mappedOtherGroups = storyGroups
    .filter((g: any) => g.userId !== user?.id)
    .map((g: any) => ({
      userId: g.userId,
      username: g.author?.name || "User",
      avatar: g.author?.avatar_url ? { uri: g.author.avatar_url } : require("../../src/assets/doodle-boy-dog.png"),
      stories: g.stories.map((s: any) => {
        let overlayText = undefined;
        let overlayTextX = undefined;
        let overlayTextY = undefined;
        let textColor = undefined;
        let caption = s.caption || undefined;
        if (s.caption && s.caption.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(s.caption);
            if (parsed && typeof parsed === 'object') {
              overlayText = parsed.overlayText || undefined;
              overlayTextX = parsed.overlayTextX !== undefined ? parsed.overlayTextX : undefined;
              overlayTextY = parsed.overlayTextY !== undefined ? parsed.overlayTextY : undefined;
              textColor = parsed.textColor || undefined;
              caption = parsed.caption || undefined;
            }
          } catch (e) { }
        }
        return {
          id: s.id,
          mediaUrl: s.mediaUrl,
          mediaType: s.mediaType,
          caption,
          overlayText,
          overlayTextX,
          overlayTextY,
          textColor,
          viewedByMe: s.viewedByMe,
          viewCount: s.viewCount,
        };
      }),
    }));

  const allStoryGroups: StoryGroup[] = [
    ...(mappedMyStoryGroup ? [mappedMyStoryGroup] : []),
    ...mappedOtherGroups,
  ];

  const handlePressStory = (userId: string) => {
    const index = allStoryGroups.findIndex((g) => g.userId === userId);
    if (index !== -1) {
      setSelectedStoryGroupIndex(index);
      setStoryViewerVisible(true);
    }
  };

  const handleAddStory = () => {
    Alert.alert(
      "Add Story",
      "Choose a media source for your story",
      [
        {
          text: "Open Camera",
          onPress: () => {
            router.push({
              pathname: "/camera",
              params: { origin: "story" },
            });
          },
        },
        {
          text: "Choose from Gallery",
          onPress: () => handleAddStorySource("gallery"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleAddStorySource = async (source: "camera" | "gallery") => {
    if (source === "gallery") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow gallery access to share stories.");
        return;
      }
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow camera access to capture stories.");
        return;
      }
    }

    try {
      setCompressing(true);
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
      };

      const result = source === "gallery"
        ? await ImagePicker.launchImageLibraryAsync(options)
        : await ImagePicker.launchCameraAsync(options);

      setCompressing(false);

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');

        if (isVideo) {
          const duration = asset.duration || 0;
          const durationInSeconds = duration > 1000 ? duration / 1000 : duration;
          if (durationInSeconds > 30) {
            Alert.alert("Video too long", "Please select a video shorter than 30 seconds.");
            return;
          }
        }

        router.push({
          pathname: "/camera",
          params: {
            origin: "story",
            uri: asset.uri,
            type: isVideo ? "video" : "image"
          },
        });
      }
    } catch (err) {
      setCompressing(false);
      console.error("ImagePicker error:", err);
    }
  };

  // Build the rendered rows: following posts → caught-up boundary → suggested posts.
  const feedRows = useMemo(() => {
    const rows: any[] = feedPosts.map((p) => ({ kind: "post", post: p, section: "following" }));
    // Once the following section is fully loaded, show the boundary / reveal CTA.
    if (!feedLoading && !feedHasMore) {
      rows.push(showSuggested ? { kind: "suggestedHeader" } : { kind: "boundary" });
    }
    if (showSuggested) {
      suggestedPosts.forEach((p) => rows.push({ kind: "post", post: p, section: "suggested" }));
    }
    return rows;
  }, [feedPosts, feedLoading, feedHasMore, showSuggested, suggestedPosts]);

  return (
    <View style={styles.container}>
      <FlatList
        data={feedRows}
        keyExtractor={(item) => (item.kind === "post" ? item.post.id : item.kind)}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        progressViewOffset={insets.top + HEADER_CONTENT_HEIGHT}
        renderItem={({ item }) => {
          if (item.kind === "boundary") {
            return (
              <CaughtUpBoundary
                empty={feedPosts.length === 0}
                loading={suggestedLoading}
                onReveal={revealSuggested}
                tk={tk}
              />
            );
          }
          if (item.kind === "suggestedHeader") {
            return <SuggestedDivider tk={tk} />;
          }
          const p = item.post;
          return (
            <View style={{ paddingHorizontal: 0 }}>
              <PostCard
                post={p}
                isLiked={likedIds.has(p.id)}
                isSaved={savedIds.has(p.id)}
                onLike={() => handleLike(p.id)}
                onSave={() => handleSave(p.id)}
                onShare={(id) => {
                  setSharingPostId(id);
                  setShareOpen(true);
                }}
                isMuted={feedVideoMuted}
                onToggleMute={() => setFeedVideoMuted(prev => !prev)}
                isActive={activePostId === p.id}
                onDelete={() => {
                  setFeedPosts(prev => prev.filter(x => x.id !== p.id));
                  setSuggestedPosts(prev => prev.filter(x => x.id !== p.id));
                }}
                onUpdate={(updatedPost) => {
                  setFeedPosts(prev => prev.map(x => x.id === p.id ? { ...x, ...updatedPost } : x));
                  setSuggestedPosts(prev => prev.map(x => x.id === p.id ? { ...x, ...updatedPost } : x));
                }}
              />
            </View>
          );
        }}
        ListHeaderComponent={
          <StoryRail
            myStories={myStories}
            storyGroups={mappedOtherGroups}
            onPressStory={handlePressStory}
            onAddStory={handleAddStory}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
        ListEmptyComponent={
          !feedLoading ? (
            <View style={[styles.emptyState, { paddingHorizontal: 16 }]}>
              <Image source={require("../../src/assets/doodle-puppy.png")} style={styles.emptyImage} resizeMode="contain" />
              <Text style={[styles.emptyTitle, { color: tk.text }]}>No posts yet</Text>
              <Text style={[styles.emptyText, { color: tk.textMuted }]}>Be the first to share a moment of your pet!</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          )
        }
        ListFooterComponent={
          (feedLoadingMore || suggestedLoadingMore) ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
          ) : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: insets.top + HEADER_CONTENT_HEIGHT }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Glass header overlay — feed content scrolls under it (frosted, no hard cut) */}
      <FeedHeader />

      <TouchableOpacity
        onPress={() => setComposeOpen(true)}
        style={[styles.fab, { bottom: tabBarClearance(insets.bottom) }]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#5B8DF5", colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Plus size={28} color="#fff" strokeWidth={2.4} />
      </TouchableOpacity>

      <ComposeSheet open={composeOpen} onClose={() => setComposeOpen(false)} onPublished={loadFeed} />
      <ShareSheet
        open={shareOpen}
        onClose={() => {
          setShareOpen(false);
          setSharingPostId(null);
        }}
        postId={sharingPostId}
        onShared={(postId, shareCount) => {
          const apply = (p: any) => (p.id === postId ? { ...p, shareCount } : p);
          setFeedPosts(prev => prev.map(apply));
          setSuggestedPosts(prev => prev.map(apply));
        }}
      />
      <StoryViewer
        visible={storyViewerVisible}
        onClose={() => setStoryViewerVisible(false)}
        storyGroups={allStoryGroups}
        initialGroupIndex={selectedStoryGroupIndex}
        onStoryDeleted={(storyId) => {
          setStoryViewerVisible(false);
          setMyStories((prev) => prev.filter((s) => s.id !== storyId));
          loadStories();
        }}
        onStoryViewed={(storyId, userId) => {
          setStoryGroups((prev) =>
            prev.map((g) => {
              if (g.userId === userId) {
                return {
                  ...g,
                  stories: g.stories.map((s: any) =>
                    s.id === storyId ? { ...s, viewedByMe: true } : s
                  ),
                };
              }
              return g;
            })
          );
        }}
      />

      {compressing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Compressing...</Text>
        </View>
      )}
    </View>
  );
}

function FeedHeader() {
  const router = useRouter();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);
  const insets = useSafeAreaInsets();

  const logoSource = require("../../src/assets/furrcircle_icon.png");

  const user = useAuthStore(s => s.user);
  const setSession = useAuthStore(s => s.setSession);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const updateLocation = useLocationStore(s => s.updateLocation);
  const locationCity = useLocationStore(s => s.city);
  const setUseGPS = useLocationStore(s => s.setUseGPS);

  // Live unread count from WebSocket-backed store
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const chatUnreadCount = useNotificationStore((s) => s.chatUnreadCount);
  const chatBadgeLabel = chatUnreadCount > 99 ? "99+" : String(chatUnreadCount);
  const setChatUnreadCount = useNotificationStore((s) => s.setChatUnreadCount);

  useEffect(() => {
    if (!user) return;
    chatApi.getChats().then((chats: any[]) => {
      let unread = 0;
      chats.forEach(c => {
        const hasUnread = c.unreadCount > 0 || (c.lastMessage && !c.lastMessage.isRead && !c.lastMessage.readAt && !c.lastMessage.seen && c.lastMessage.sender?.id !== user.id);
        if (hasUnread) unread++;
      });
      setChatUnreadCount(unread);
    }).catch(() => { });
  }, [user]);

  const handleLocationSelect = async (loc: LocationResult) => {
    setLocationModalVisible(false);
    try {
      updateLocation(loc.city || null, loc.latitude, loc.longitude);
      setUseGPS(false);
      await userApi.updateProfile({
        city: loc.city || undefined,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
    } catch (err) {
      console.error('Failed to update location', err);
      Alert.alert('Error', 'Failed to save location.');
    }
  };

  return (
    <GlassBlur intensity={dark ? 40 : 60} style={[styles.headerOverlay, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image
            source={logoSource}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <View style={{ justifyContent: "center" }}>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 20, lineHeight: 22 }}>
              <Text style={{ color: dark ? "#FFFFFF" : "#0D3B8E" }}>Furr</Text>
              <Text style={{ color: "#398EE4" }}>Circle</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setLocationModalVisible(true)}
              style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}
            >
              {/* <MapPin size={12} color={tk.textMuted} style={{ marginRight: 2 }} /> */}
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: tk.textMuted }}>
                {locationCity || user?.city || "Select Location"}
              </Text>
              <ChevronDown size={12} color={tk.textMuted} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push("/chat")} style={[styles.iconBtn, glassSurface(tk)]}>
            <MessageCircle size={20} color={chatUnreadCount > 0 ? colors.primary : tk.text} strokeWidth={2} />
            {chatUnreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{chatBadgeLabel}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            style={[styles.iconBtn, glassSurface(tk)]}
            activeOpacity={0.8}
          >
            <Bell size={20} color={unreadCount > 0 ? colors.primary : tk.text} strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{badgeLabel}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelectLocation={handleLocationSelect}
      />
    </GlassBlur>
  );
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  var start = polarToCartesian(x, y, radius, endAngle);
  var end = polarToCartesian(x, y, radius, startAngle);
  var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  var d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
  return d;
}

function StoryRing({
  stories,
  tk,
  dark,
}: {
  stories: any[];
  tk: any;
  dark: boolean;
}) {
  const N = stories.length;
  const strokeWidth = 3;
  const size = 64;
  const radius = (size - strokeWidth) / 2; // 30.5
  const center = size / 2; // 32

  if (N === 0) {
    return (
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={dark ? tk.border : "rgba(26,26,46,0.1)"}
          strokeWidth={1}
        />
      </Svg>
    );
  }

  const hasUnviewed = stories.some((s) => !s.viewedByMe);

  if (N === 1) {
    const color = hasUnviewed ? colors.primary : (dark ? tk.border : "rgba(26,26,46,0.15)");
    return (
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </Svg>
    );
  }

  const angleStep = 360 / N;
  const gapAngle = Math.min(15, 360 * 4 / (2 * Math.PI * radius));

  const arcs = [];
  for (let i = 0; i < N; i++) {
    const startAngle = i * angleStep + gapAngle / 2;
    const endAngle = (i + 1) * angleStep - gapAngle / 2;
    const isViewed = !!stories[i].viewedByMe;
    const strokeColor = isViewed ? (dark ? tk.border : "rgba(26,26,46,0.15)") : colors.primary;

    const pathData = describeArc(center, center, radius, startAngle, endAngle);
    arcs.push(
      <Path
        key={i}
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  }

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {arcs}
    </Svg>
  );
}

function StoryRail({
  myStories,
  storyGroups,
  onPressStory,
  onAddStory,
}: {
  myStories: Story[];
  storyGroups: any[];
  onPressStory: (userId: string) => void;
  onAddStory: () => void;
}) {
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);
  const user = useAuthStore(s => s.user);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={styles.storyRail}
      contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 14 }}>

      {/* Your Story Bubble */}
      <TouchableOpacity
        onPress={() => (myStories.length > 0 ? onPressStory("me") : onAddStory())}
        style={styles.storyItem}
        activeOpacity={0.8}
      >
        <View style={styles.storyRingContainer}>
          <StoryRing stories={myStories} tk={tk} dark={dark} />
          <View style={[styles.storyInner, { backgroundColor: myStories.length > 0 ? "rgba(255,107,107,0.2)" : (dark ? "rgba(240,240,255,0.08)" : "rgba(26,26,46,0.05)"), borderColor: tk.bg }]}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={{ width: "100%", height: "100%", borderRadius: 27 }} resizeMode="cover" />
            ) : (
              <Image source={require("../../src/assets/doodle-boy-dog.png")} style={styles.storyImg} resizeMode="contain" />
            )}
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onAddStory();
            }}
            style={[
              styles.miniAddBadge,
              {
                backgroundColor: colors.primary,
                borderColor: tk.bg,
              },
            ]}
            activeOpacity={0.9}
          >
            <Plus size={10} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.storyLabel, { color: tk.text }]} numberOfLines={1}>Your Story</Text>
      </TouchableOpacity>

      {/* Others' stories */}
      {storyGroups.map((group) => {
        return (
          <TouchableOpacity
            key={group.userId}
            onPress={() => onPressStory(group.userId)}
            style={styles.storyItem}
            activeOpacity={0.8}
          >
            <View style={styles.storyRingContainer}>
              <StoryRing stories={group.stories || []} tk={tk} dark={dark} />
              <View style={[styles.storyInner, { backgroundColor: "rgba(255,107,107,0.2)", borderColor: tk.bg }]}>
                {group.avatar && (group.avatar as any).uri ? (
                  <Image source={group.avatar} style={{ width: "100%", height: "100%", borderRadius: 27 }} resizeMode="cover" />
                ) : (
                  <Image source={require("../../src/assets/doodle-boy-dog.png")} style={styles.storyImg} resizeMode="contain" />
                )}
              </View>
            </View>
            <Text style={[styles.storyLabel, { color: tk.text }]} numberOfLines={1}>{group.username}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const getCommentTimeLabel = (createdAt?: string) => {
  if (!createdAt) return "now";
  const time = new Date(createdAt).getTime();
  if (isNaN(time)) return "now";
  const diff = Date.now() - time;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const dy = Math.floor(hr / 24);
  return `${dy}d`;
};

const getPostTimeLabel = (createdAt?: string) => {
  if (!createdAt) return "";
  const time = new Date(createdAt).getTime();
  if (isNaN(time)) return "";
  const diff = Date.now() - time;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? "1 minute ago" : `${min} minutes ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? "1 hour ago" : `${hr} hours ago`;
  const dy = Math.floor(hr / 24);
  if (dy < 7) return dy === 1 ? "1 day ago" : `${dy} days ago`;
  const wk = Math.floor(dy / 7);
  if (wk < 4) return wk === 1 ? "1 week ago" : `${wk} weeks ago`;
  const mo = Math.floor(dy / 30);
  if (mo < 12) return mo === 1 ? "1 month ago" : `${mo} months ago`;
  const yr = Math.floor(dy / 365);
  return yr === 1 ? "1 year ago" : `${yr} years ago`;
};

const formatDummyTime = (timeStr?: string) => {
  if (!timeStr) return "";
  const match = timeStr.match(/^(\d+)([mhdw])$/);
  if (!match) return timeStr;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "m") return val === 1 ? "1 minute ago" : `${val} minutes ago`;
  if (unit === "h") return val === 1 ? "1 hour ago" : `${val} hours ago`;
  if (unit === "d") return val === 1 ? "1 day ago" : `${val} days ago`;
  if (unit === "w") return val === 1 ? "1 week ago" : `${val} weeks ago`;
  return timeStr;
};

function PostCard({ post, isLiked, isSaved, onLike, onSave, onShare, isMuted, onToggleMute, isActive, onDelete, onUpdate }: {
  post: any; isLiked: boolean; isSaved: boolean;
  onLike: () => void; onSave: () => void; onShare: (id: string) => void;
  isMuted: boolean; onToggleMute: () => void; isActive: boolean;
  onDelete?: () => void; onUpdate?: (updatedPost: any) => void;
}) {
  const router = useRouter();
  const tk = useTokens();
  const isScreenFocused = useIsFocused();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { isTablet } = useBreakpoint();
  const postTimeText = post.createdAt
    ? getPostTimeLabel(post.createdAt)
    : (post.time ? formatDummyTime(post.time) : "");
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportStep, setReportStep] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
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
  }, [post.image, post.imageUrl]);

  const isDummy = dummyPosts.some(d => d.id === post.id);
  const isOwner = !isDummy && post.userId === user?.id;

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
              Alert.alert("Success", "Post deleted successfully.");
              if (onDelete) onDelete();
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

  const [localComments, setLocalComments] = useState<any[]>(
    Array.isArray(post.comments)
      ? post.comments
      : isDummy
        ? sampleComments.map(c => ({
          id: c.id,
          text: c.body,
          author: { name: c.author }
        }))
        : []
  );

  const author = isDummy ? {
    name: post.pet,
    avatar_url: null,
    username: post.owner?.toLowerCase().replace(/[^a-z0-9]/g, ""),
  } : (post.author || {});

  const displayName = author.name || "Pet parent";
  const avatarSource = post.avatar || (author.avatar_url ? { uri: author.avatar_url } : null);

  const TINT: Record<string, string> = {
    dogs: "#FF6B6B22", cats: "#FF6FCF22", rescue: "#4CAF5022",
    health: "#2563EB18", training: "#FFD93D44", milestone: "#FF6FCF22",
    photo: "#FF6B6B22", reel: "#2563EB18", general: "#FFD93D22",
  };
  const tintColor = post.tintColor || TINT[(post.category || "").toLowerCase()] || "#FF6B6B22";

  // Prefer realtime counts pushed via the "post:update" socket event; fall back
  // to the arrays from the initial fetch.
  const live = usePostEngagementStore(s => s.counts[post.id]);
  const likeCount = isDummy ? post.likes : (live ? live.likeCount : (post.likes || []).length);
  const commentCount = live ? Math.max(live.commentCount, localComments.length) : localComments.length;
  const shareCount = isDummy ? (post.shares || 0) : (live ? live.shareCount : (post.shareCount || 0));

  // Keep inline comments in sync when the feed refreshes with newer server data.
  // (useState above only seeds the initial value; the FlatList reuses this
  // component instance across reloads, so without this the count goes stale.)
  useEffect(() => {
    if (!isDummy && Array.isArray(post.comments)) {
      setLocalComments(post.comments);
    }
  }, [post.id, post.comments]);

  // Sync new comments in real-time
  useEffect(() => {
    if (isDummy) return;
    const unsub = socketService.on<{ postId: string; comment: any }>(
      "comment:new",
      ({ postId, comment }) => {
        if (postId === post.id) {
          setLocalComments((prev) => {
            if (prev.some((c) => c.id === comment.id)) return prev;
            return [...prev, comment];
          });
        }
      }
    );
    return unsub;
  }, [post.id, isDummy]);

  const handleComment = async () => {
    if (!commentText.trim()) return;

    if (isDummy) {
      const newComment = {
        id: `dummy-c-${Date.now()}`,
        text: commentText.trim(),
        author: { name: user?.name || "Demo User" }
      };
      setLocalComments(prev => [...prev, newComment]);
      setCommentText("");
      return;
    }

    setSubmitting(true);
    try {
      const res = await feedApi.commentOnPost(post.id, commentText.trim());
      setLocalComments(prev => {
        if (prev.some((c) => c.id === res.comment.id)) return prev;
        return [...prev, res.comment];
      });
      setCommentText("");
    } catch {
      Alert.alert("Error", "Could not post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}
          onPress={() => author.username && router.push(isDummy ? `/user/${author.username}` : `/u/${author.username}`)}
        >
          {typeof avatarSource === "number" ? (
            <Image source={avatarSource} style={{ width: 30, height: 30, borderRadius: 22 }} />
          ) : avatarSource?.uri ? (
            <Image source={{ uri: avatarSource.uri }} style={{ width: 30, height: 30, borderRadius: 22 }} />
          ) : (
            <Avatar name={displayName} size={30} />
          )}
          <View style={styles.cardMeta}>
            <Text style={[styles.petName, { color: tk.text }]}>
              {author.username || "parent"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Type badges */}
        {post.type === "rescue" && <View style={[styles.typeBadge, { backgroundColor: colors.success }]}><Text style={styles.typeBadgeText}>RESCUE</Text></View>}
        {post.type === "milestone" && <View style={[styles.typeBadge, { backgroundColor: colors.pinky }]}><Text style={styles.typeBadgeText}>MILESTONE</Text></View>}
        {!post.type && post.category === "Adoption" && <View style={[styles.typeBadge, { backgroundColor: colors.success }]}><Text style={styles.typeBadgeText}>ADOPTION</Text></View>}
        {!post.type && post.category === "Lost & Found" && <View style={[styles.typeBadge, { backgroundColor: colors.coral }]}><Text style={styles.typeBadgeText}>LOST & FOUND</Text></View>}
        {!post.type && post.category === "Training" && <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}><Text style={styles.typeBadgeText}>TRAINING</Text></View>}
        {!post.type && post.category === "Health" && <View style={[styles.typeBadge, { backgroundColor: "#2563EB" }]}><Text style={styles.typeBadgeText}>HEALTH</Text></View>}

        <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ padding: 6, marginLeft: 4 }}>
          <MoreVertical size={20} color={tk.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Image in tinted container */}
      <TouchableOpacity
        onPress={() => router.push(`/post/${post.id}`)}
        activeOpacity={0.9}
        style={[styles.imageWrapper, { backgroundColor: tintColor, aspectRatio: aspectRatio || 1 }]}
      >
        {post.image ? (
          <Image source={post.image} style={styles.postImage} resizeMode="contain" />
        ) : post.imageUrl ? (
          post.imageUrl.match(/\.(mp4|mov|quicktime|3gp|mpeg|avi|wmv|flv|mkv|webm)(\?|$)/i) ? (
            <View style={{ width: "100%", height: "100%", position: "relative" }}>
              <Video
                source={{ uri: post.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.CONTAIN}
                isMuted={isMuted}
                shouldPlay={isActive && isScreenFocused}
                isLooping
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
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleMute();
                }}
                style={styles.muteBtn}
                activeOpacity={0.8}
              >
                {isMuted ? (
                  <VolumeX size={16} color="#fff" />
                ) : (
                  <Volume2 size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Image source={{ uri: post.imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
          )
        ) : (
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: tk.text, padding: 20, textAlign: "center", lineHeight: 22 }}>
            {post.content}
          </Text>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions} >
        <TouchableOpacity onPress={onLike} style={styles.actionBtn}>
          <Heart size={24} color={isLiked ? colors.coral : tk.text} fill={isLiked ? colors.coral : "none"} />
          <Text style={[styles.actionCount, { color: tk.text }]}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCommentOpen(v => !v)} style={styles.actionBtn}>
          <MessageCircle size={24} color={tk.text} />
          <Text style={[styles.actionCount, { color: tk.text }]}>{commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onShare(post.id)} style={styles.actionBtn}>
          <Send size={24} color={tk.text} />
          <Text style={[styles.actionCount, { color: tk.text }]}>{shareCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSave} style={{ marginLeft: "auto" }}>
          <Bookmark size={24} color={isSaved ? colors.primary : tk.text} fill={isSaved ? colors.primary : "none"} />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {(post.image || post.imageUrl) && (post.caption || post.content) ? (
        <Text style={[styles.caption, { color: tk.text }]} numberOfLines={2}>
          <Text style={styles.captionBold}>{post.pet || displayName} </Text>
          {post.caption || post.content}
        </Text>
      ) : null}

      {/* Tags */}
      {post.tags ? (
        <Text style={styles.tags}>{post.tags.map((t: string) => `#${t}`).join("  ")}</Text>
      ) : post.category ? (
        <Text style={styles.tags}>#{post.category}</Text>
      ) : null}

      {/* Time Ago */}
      {postTimeText ? (
        <Text style={[styles.timeAgo, { color: tk.textMuted }]}>
          {postTimeText.toUpperCase()}
        </Text>
      ) : null}

      {/* Comments Bottom Sheet Modal */}
      <Modal
        visible={commentOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentOpen(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            {/* Backdrop Pressable (fills the screen absolutely and captures tap outside the sheet to dismiss) */}
            <Pressable
              style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]}
              onPress={() => setCommentOpen(false)}
            />

            <View
              style={[styles.commentSheet, { paddingBottom: keyboardVisible ? 0 : insets.bottom, backgroundColor: tk.glassStrong, borderWidth: 1, borderBottomWidth: 0, borderColor: tk.glassBorder }]}
            >
              {/* Handle */}
              <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted, marginTop: 20 }]} />

              {/* Header */}
              <Text style={[styles.sheetTitle, { color: tk.text, paddingHorizontal: 16, marginBottom: 12 }]}>Comments</Text>

              {/* Scrollable list of comments */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                style={{ flex: 1 }}
              >
                {localComments.length === 0 ? (
                  <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted }}>No comments yet. Start the conversation!</Text>
                  </View>
                ) : (
                  [...localComments].reverse().map((c: any, i) => (
                    <View key={c.id || i} style={styles.commentItemRow}>
                      {c.author?.avatar_url ? (
                        <Image source={{ uri: c.author.avatar_url }} style={styles.commentAvatar} />
                      ) : (
                        <Avatar name={c.author?.name || "User"} size={36} />
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={[styles.commentAuthorName, { color: tk.text }]}>
                            {c.author?.username || c.author?.name || "user"}
                          </Text>
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: tk.textMuted }}>
                            {c.createdAt ? getCommentTimeLabel(c.createdAt) : "now"}
                          </Text>
                        </View>
                        <Text style={[styles.commentTextContent, { color: tk.text }]}>{c.text}</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Input Area */}
              <View style={[styles.commentInputContainer, { borderTopColor: tk.border, paddingBottom: 12 }]}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.inputAvatar} />
                ) : (
                  <Avatar name={user?.name || "User"} size={36} />
                )}
                <View style={[styles.commentInputWrapper, { backgroundColor: tk.glassChip, borderColor: tk.glassBorder }]}>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Add Comment..."
                    placeholderTextColor={tk.textMuted}
                    style={[styles.commentTextInput, { color: tk.text }]}
                    multiline
                  />
                  <TouchableOpacity
                    onPress={handleComment}
                    disabled={submitting || !commentText.trim()}
                    style={styles.commentPostBtn}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text
                        style={{
                          fontFamily: "Poppins_700Bold",
                          fontSize: 14,
                          color: commentText.trim() ? colors.primary : colors.primary + "55",
                        }}
                      >
                        Post
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Options Menu Modal */}
      <Modal visible={menuOpen} transparent={true} animationType={isTablet ? "fade" : "slide"} onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={[styles.overlay, isTablet && styles.overlayCenter]} onPress={() => setMenuOpen(false)}>
          <View style={[isTablet ? styles.dialog : styles.sheet, { paddingBottom: 10 + insets.bottom, backgroundColor: tk.glassStrong, borderWidth: 1, borderColor: tk.glassBorder }, !isTablet && { borderBottomWidth: 0 }]} onStartShouldSetResponder={() => true} onTouchEnd={(e) => e.stopPropagation()}>
            {!isTablet && <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />}
            <Text style={[styles.sheetTitle, { color: tk.text }]}>Options</Text>

            {/* Save Option */}
            <TouchableOpacity
              onPress={() => { setMenuOpen(false); onSave(); }}
              style={[styles.sheetRow, { backgroundColor: tk.glassChip }]}
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
                  style={[styles.sheetRow, { backgroundColor: tk.glassChip }]}
                  activeOpacity={0.8}
                >
                  <Edit2 size={20} color={tk.text} />
                  <Text style={[styles.sheetRowTitle, { color: tk.text }]}>Edit Post</Text>
                </TouchableOpacity>

                {/* Delete Post Option */}
                <TouchableOpacity
                  onPress={handleDeletePost}
                  style={[styles.sheetRow, { backgroundColor: tk.glassChip }]}
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
                  style={[styles.sheetRow, { backgroundColor: tk.glassChip }]}
                  activeOpacity={0.8}
                >
                  <Info size={20} color={tk.text} />
                  <Text style={[styles.sheetRowTitle, { color: tk.text }]}>About this Account</Text>
                </TouchableOpacity>

                {/* Report Option */}
                <TouchableOpacity
                  onPress={handleReportUser}
                  style={[styles.sheetRow, { backgroundColor: tk.glassChip }]}
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
              style={[styles.sheetRow, { backgroundColor: tk.glassChip, marginTop: 12, justifyContent: "center", alignItems: "center" }]}
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
  );
}



const composeOptions = [
  { label: "New Post", desc: "Share a photo of your pet", tintColor: "rgba(255,107,107,0.15)", Icon: Camera, iconColor: colors.coral, to: "/compose" as const },
  // { label: "New Reel", desc: "Quick video moment", tintColor: "rgba(37,99,235,0.1)", to: "/reels" as const },
  { label: "Ask the Community", desc: "Get help from pet parents", tintColor: "rgba(255,217,61,0.3)", Icon: HelpCircle, iconColor: "#B8860B", to: "/ask" as const },
  { label: "Add Memory", desc: "Save to vault", tintColor: "rgba(255,111,207,0.15)", Icon: Sparkles, iconColor: colors.pinky, to: "/memory" as const },
];

function ComposeSheet({ open, onClose, onPublished }: { open: boolean; onClose: () => void; onPublished: () => void }) {
  const router = useRouter();
  const tk = useTokens();
  const { isTablet } = useBreakpoint();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<'options' | 'select_pet'>('options');
  const [pets, setPets] = useState<any[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('options');
      setPets([]);
      setLoadingPets(false);
    }
  }, [open]);

  const handleOptionPress = async (option: typeof composeOptions[0]) => {
    if (option.label === "Add Memory") {
      setLoadingPets(true);
      try {
        const myPets = await petApi.getMyPets();
        if (!myPets || myPets.length === 0) {
          onClose();
          Alert.alert(
            "No Pets Found",
            "Please add a pet to your profile first before adding a memory.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Add Pet", onPress: () => router.push("/add-pet") }
            ]
          );
          return;
        }

        if (myPets.length === 1) {
          onClose();
          router.push({ pathname: "/memory", params: { petId: myPets[0].id } });
        } else {
          setPets(myPets);
          setStep('select_pet');
        }
      } catch (err) {
        Alert.alert("Error", "Failed to retrieve your pets.");
      } finally {
        setLoadingPets(false);
      }
    } else {
      onClose();
      router.push(option.to);
    }
  };

  const handleSelectPet = (petId: string) => {
    onClose();
    router.push({ pathname: "/memory", params: { petId } });
  };

  const content = step === 'options' ? (
    <View style={[isTablet ? styles.dialog : styles.sheet, { paddingBottom: 28 + insets.bottom, backgroundColor: tk.glassStrong, borderWidth: 1, borderColor: tk.glassBorder }, !isTablet && { borderBottomWidth: 0 }]}>
      {!isTablet && <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={[styles.sheetTitle, { color: tk.text, marginBottom: 0 }]}>Create</Text>
        {loadingPets && <ActivityIndicator size="small" color={colors.primary} />}
      </View>
      {composeOptions.map((o) => (
        <TouchableOpacity key={o.label} onPress={() => handleOptionPress(o)} disabled={loadingPets}
          style={[styles.sheetRow, { backgroundColor: tk.glassChip }]} activeOpacity={0.8}>
          <View style={[styles.sheetIcon, { backgroundColor: o.tintColor }]}>
            <o.Icon size={22} color={o.iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetRowTitle, { color: tk.text }]}>{o.label}</Text>
            <Text style={[styles.sheetRowDesc, { color: tk.textMuted }]}>{o.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  ) : (
    <View style={[isTablet ? styles.dialog : styles.sheet, { paddingBottom: 28 + insets.bottom, backgroundColor: tk.glassStrong, borderWidth: 1, borderColor: tk.glassBorder }, !isTablet && { borderBottomWidth: 0 }]}>
      {!isTablet && <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setStep('options')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: tk.bg,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: tk.border,
          }}
        >
          <ArrowLeft size={18} color={tk.text} />
        </TouchableOpacity>
        <Text style={[styles.sheetTitle, { color: tk.text, marginBottom: 0 }]}>Select Pet</Text>
      </View>
      <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
        {pets.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => handleSelectPet(p.id)}
            style={[styles.sheetRow, { backgroundColor: tk.glassChip }]} activeOpacity={0.8}>
            <View style={[styles.sheetIcon, { overflow: "hidden", backgroundColor: tk.border }]}>
              {p.avatar_url ? (
                <Image source={{ uri: p.avatar_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <Image source={require("../../src/assets/doodle-puppy.png")} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetRowTitle, { color: tk.text }]}>{p.name}</Text>
              <Text style={[styles.sheetRowDesc, { color: tk.textMuted }]}>{p.breed || p.species}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={open} transparent animationType={isTablet ? "fade" : "slide"} onRequestClose={onClose}>
      <Pressable
        style={[styles.overlay, isTablet && styles.overlayCenter]}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          {content}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerOverlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8, paddingTop: 10, height: HEADER_CONTENT_HEIGHT },
  logoImg: { width: 42, height: 42 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  notifBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    lineHeight: 13,
  },
  storyRail: { flexGrow: 0 },
  storyItem: { alignItems: "center", width: 64, gap: 6 },
  storyRingContainer: { width: 64, height: 64, position: "relative", alignItems: "center", justifyContent: "center" },
  storyInner: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", borderWidth: 2, overflow: "hidden" },
  storyImg: { width: "90%", height: "90%" },
  storyLabel: { fontSize: 11, fontFamily: "Poppins_600SemiBold", textAlign: "center" },
  miniAddBadge: { position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  remindersContainer: { marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, paddingHorizontal: 16, marginBottom: 12 },
  reminderCard: { flexDirection: "row", alignItems: "center", width: 240, padding: 12, borderRadius: 16, borderWidth: 1 },
  reminderIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reminderTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  reminderTime: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  feedList: { gap: 20, paddingHorizontal: 16, marginTop: 12, width: "100%" },
  card: { alignSelf: "stretch", backgroundColor: "transparent" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 0, gap: 10 },
  cardMeta: { flex: 1 },
  petName: { fontFamily: "Poppins_600SemiBold", fontSize: 15, lineHeight: 20 },
  petOwner: { fontSize: 11, fontFamily: "Inter_400Regular" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: "#fff" },
  imageWrapper: { width: "100%", alignSelf: "stretch", marginTop: 12, marginBottom: 4, borderRadius: 0, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  postImage: { width: "100%", height: "100%" },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  caption: { paddingHorizontal: 16, paddingTop: 8, fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular" },
  captionBold: { fontFamily: "Poppins_700Bold" },
  tags: { paddingHorizontal: 16, paddingBottom: 4, paddingTop: 4, fontSize: 12, fontFamily: "Poppins_600SemiBold", color: colors.primary },
  timeAgo: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4, fontSize: 10.5, fontFamily: "Inter_500Medium", letterSpacing: 0.2, textTransform: "uppercase" },
  fab: { position: "absolute", bottom: 16, right: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  overlayCenter: { justifyContent: "center", alignItems: "center" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 28 },
  dialog: { borderRadius: 24, padding: 24, width: 360 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12, opacity: 0.2 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, paddingHorizontal: 4, marginBottom: 8 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 12, marginBottom: 6 },
  sheetIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  sheetRowTitle: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  sheetRowDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyImage: { width: 140, height: 140, marginBottom: 16, opacity: 0.8 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, marginBottom: 8, textAlign: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  boundaryWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 28, paddingHorizontal: 32 },
  boundaryIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 14 },
  boundaryTitle: { fontFamily: "Poppins_700Bold", fontSize: 17, marginBottom: 6, textAlign: "center" },
  boundaryText: { fontFamily: "Inter_400Regular", fontSize: 13.5, textAlign: "center", lineHeight: 20, marginBottom: 18 },
  boundaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.primary, paddingHorizontal: 22, height: 46, borderRadius: 23, minWidth: 200 },
  boundaryBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#fff" },
  suggestedDivider: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 6 },
  suggestedLine: { flex: 1, height: 1 },
  suggestedLabel: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12 },
  suggestedLabelText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  muteBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  commentModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  commentSheet: { height: SCREEN_HEIGHT * 0.5, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 0 },
  commentItemRow: { flexDirection: "row", gap: 12, paddingVertical: 12, alignItems: "flex-start", paddingHorizontal: 16 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentAuthorName: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  commentTextContent: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 3, lineHeight: 18 },
  emojiRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5 },
  emojiBtn: { padding: 4 },
  commentInputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 10, gap: 10, borderTopWidth: 0.5 },
  inputAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentInputWrapper: { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 24, paddingLeft: 16, paddingRight: 8, minHeight: 40, maxHeight: 100 },
  commentTextInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 8, marginRight: 8 },
  commentPostBtn: { paddingVertical: 8, paddingHorizontal: 10 },
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
