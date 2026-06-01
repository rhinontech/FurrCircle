import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Modal, Pressable, Alert, ActivityIndicator, TextInput, FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Heart, MessageCircle, Send, Bookmark, Plus, Bell, MapPin, ChevronDown, Volume2, VolumeX } from "lucide-react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import { posts as dummyPosts, sampleComments, type Post } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { Avatar } from "../../src/components/Avatar";
import { useTokens, useThemeStore } from "../../src/lib/theme-store";
import { useAuthStore } from "../../src/lib/auth-store";
import { userApi } from "../../services/user/userApi";
import { feedApi } from "../../services/community/feedApi";
import { storyApi } from "../../services/community/storyApi";
import { LocationPickerModal, LocationResult } from "../../src/components/LocationPickerModal";
import { ShareSheet } from "../../src/components/ShareSheet";
import { StoryViewer, type Story, type StoryGroup } from "../../src/components/StoryViewer";
import { StoryEditor } from "../../src/components/StoryEditor";
import { Video, ResizeMode, Audio } from "expo-av";
import { useIsFocused } from "@react-navigation/native";
import Svg, { Path, Circle } from "react-native-svg";
import { useNotificationStore } from "../../src/lib/notification-store";

export default function FeedScreen() {
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
    }).catch(() => {});
  }, []);

  // Story states
  const [storyGroups, setStoryGroups] = useState<any[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryGroupIndex, setSelectedStoryGroupIndex] = useState(0);
  const [editorVisible, setEditorVisible] = useState(false);
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const user = useAuthStore(s => s.user);

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
      }));
      setMyStories(formattedMine);
    } catch (err) {
      console.error("Failed to load stories:", err);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    try {
      setFeedLoading(true);
      const data = await feedApi.getFeed('for_you', 1, 50);
      const apiPosts = data?.posts || [];
      setFeedPosts(apiPosts);

      const userId = user?.id;
      if (userId) {
        const liked = new Set<string>(apiPosts.filter((p: any) => (p.likes || []).some((l: any) => l.userId === userId)).map((p: any) => p.id));
        const saved = new Set<string>(apiPosts.filter((p: any) => (p.savedBy || []).includes(userId)).map((p: any) => p.id));
        setLikedIds(liked);
        setSavedIds(saved);
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
      setFeedPosts([]);
    } finally {
      setFeedLoading(false);
    }
  }, [user?.id]);

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

    // Update count in state
    setFeedPosts(prev => prev.map(p => {
      if (p.id === postId) {
        if (isDummy) {
          return { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 };
        } else {
          const currentLikes = p.likes || [];
          return {
            ...p,
            likes: isLiked
              ? currentLikes.filter((l: any) => l.userId !== user?.id)
              : [...currentLikes, { userId: user?.id }]
          };
        }
      }
      return p;
    }));

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
          let caption = s.caption || undefined;
          if (s.caption?.startsWith('{"overlayText":')) {
            try {
              const parsed = JSON.parse(s.caption);
              overlayText = parsed.overlayText || undefined;
              caption = parsed.caption || undefined;
            } catch (e) {}
          }
          return {
            id: s.id,
            mediaUrl: s.mediaUrl,
            mediaType: s.mediaType,
            caption,
            overlayText,
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
        let caption = s.caption || undefined;
        if (s.caption?.startsWith('{"overlayText":')) {
          try {
            const parsed = JSON.parse(s.caption);
            overlayText = parsed.overlayText || undefined;
            caption = parsed.caption || undefined;
          } catch (e) {}
        }
        return {
          id: s.id,
          mediaUrl: s.mediaUrl,
          mediaType: s.mediaType,
          caption,
          overlayText,
          viewedByMe: s.viewedByMe,
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

  const handleAddStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow gallery access to share stories.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPickedImageUri(result.assets[0].uri);
      setEditorVisible(true);
    }
  };

  const handleSaveStory = async (overlayText: string, caption: string) => {
    if (!pickedImageUri) return;
    try {
      setFeedLoading(true);
      const uploadRes = await userApi.uploadImage(pickedImageUri, "stories");
      if (!uploadRes?.url) {
        throw new Error("Failed to upload image.");
      }

      const storyCaption = JSON.stringify({
        overlayText: overlayText || "",
        caption: caption || "",
      });

      await storyApi.createStory({
        mediaUrl: uploadRes.url,
        mediaType: "image",
        caption: storyCaption,
      });

      setEditorVisible(false);
      setPickedImageUri(null);
      Alert.alert("Success", "Story added to Your Story!");
      loadStories();
    } catch (err: any) {
      console.error("Failed to add story:", err);
      Alert.alert("Error", err?.message || "Could not publish story. Please try again.");
    } finally {
      setFeedLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tk.bg }]}>
      <FeedHeader />
      <FlatList
        data={feedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item: p }) => (
          <View style={{ paddingHorizontal: 16 }}>
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
            />
          </View>
        )}
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
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 12 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <TouchableOpacity onPress={() => setComposeOpen(true)} style={styles.fab} activeOpacity={0.85}>
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
      <StoryEditor
        visible={editorVisible}
        imageUri={pickedImageUri}
        onCancel={() => {
          setEditorVisible(false);
          setPickedImageUri(null);
        }}
        onSave={handleSaveStory}
      />
    </View>
  );
}

function FeedHeader() {
  const router = useRouter();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);

  const logoSource = dark
    ? require("../../src/assets/furrcircle_dark_logo.png")
    : require("../../src/assets/furrcircle_light_logo.png");

  const user = useAuthStore(s => s.user);
  const setSession = useAuthStore(s => s.setSession);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Live unread count from WebSocket-backed store
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const chatUnreadCount = useNotificationStore((s) => s.chatUnreadCount);
  const chatBadgeLabel = chatUnreadCount > 99 ? "99+" : String(chatUnreadCount);

  const handleLocationSelect = async (loc: LocationResult) => {
    setLocationModalVisible(false);
    try {
      const res = await userApi.updateProfile({ latitude: loc.latitude, longitude: loc.longitude, city: loc.city, address: loc.address });
      if (res.success && res.user && user) {
        await setSession({ ...user, ...res.user });
      }
    } catch (err) {
      console.error('Failed to update location', err);
      Alert.alert('Error', 'Failed to save location.');
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: tk.bg }]}>
      <View>
        <Image
          source={logoSource}
          style={styles.logoImg}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => setLocationModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: -4, marginLeft: 2 }}>
          <MapPin size={12} color={tk.textMuted} style={{ marginRight: 2 }} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: tk.textMuted }}>{user?.city || "Select Location"}</Text>
          <ChevronDown size={12} color={tk.textMuted} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={() => router.push("/chat")} style={[styles.iconBtn, { backgroundColor: tk.card }]}>
          <MessageCircle size={20} color={chatUnreadCount > 0 ? colors.coral : tk.text} strokeWidth={2} />
          {chatUnreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{chatBadgeLabel}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          style={[styles.iconBtn, { backgroundColor: tk.card }]}
          activeOpacity={0.8}
        >
          <Bell size={20} color={unreadCount > 0 ? colors.coral : tk.text} strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{badgeLabel}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelectLocation={handleLocationSelect}
      />
    </View>
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
    const color = hasUnviewed ? colors.coral : (dark ? tk.border : "rgba(26,26,46,0.15)");
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
    const strokeColor = isViewed ? (dark ? tk.border : "rgba(26,26,46,0.15)") : colors.coral;

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
                backgroundColor: colors.coral,
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

function PostCard({ post, isLiked, isSaved, onLike, onSave, onShare, isMuted, onToggleMute, isActive }: {
  post: any; isLiked: boolean; isSaved: boolean;
  onLike: () => void; onSave: () => void; onShare: (id: string) => void;
  isMuted: boolean; onToggleMute: () => void; isActive: boolean;
}) {
  const router = useRouter();
  const tk = useTokens();
  const isScreenFocused = useIsFocused();
  const { user } = useAuthStore();
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const isDummy = dummyPosts.some(d => d.id === post.id);
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

  const likeCount = isDummy ? post.likes : (post.likes || []).length;
  const commentCount = localComments.length;

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
      setLocalComments(prev => [...prev, res.comment]);
      setCommentText("");
    } catch {
      Alert.alert("Error", "Could not post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: tk.card }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
          onPress={() => author.username && router.push(isDummy ? `/user/${author.username}` : `/u/${author.username}`)}
        >
          {typeof avatarSource === "number" ? (
            <Image source={avatarSource} style={{ width: 44, height: 44, borderRadius: 22 }} />
          ) : avatarSource?.uri ? (
            <Image source={{ uri: avatarSource.uri }} style={{ width: 44, height: 44, borderRadius: 22 }} />
          ) : (
            <Avatar name={displayName} size={44} />
          )}
          <View style={styles.cardMeta}>
            <Text style={[styles.petName, { color: tk.text }]}>{displayName}</Text>
            <Text style={[styles.petOwner, { color: tk.textMuted }]}>
              {post.owner ? `by ${post.owner}` : `@${author.username || "parent"}`} · {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : post.time || "now"}
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
      </View>

      {/* Image in tinted container */}
      <TouchableOpacity
        onPress={() => router.push(`/post/${post.id}`)}
        activeOpacity={0.9}
        style={[styles.imageWrapper, { backgroundColor: tintColor }]}
      >
        {post.image ? (
          <Image source={post.image} style={styles.postImage} resizeMode="contain" />
        ) : post.imageUrl ? (
          post.imageUrl.match(/\.(mp4|mov|quicktime|3gp|mpeg|avi|wmv|flv|mkv|webm)(\?|$)/i) ? (
            <View style={{ width: "100%", height: "100%", position: "relative" }}>
              <Video
                source={{ uri: post.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                isMuted={isMuted}
                shouldPlay={isActive && isScreenFocused}
                isLooping
                onPlaybackStatusUpdate={(status: any) => {
                  if (!status.isLoaded) {
                    setIsVideoLoading(true);
                  } else {
                    setIsVideoLoading(status.isBuffering || (status.shouldPlay && !status.isPlaying));
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
            <Image source={{ uri: post.imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          )
        ) : (
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: tk.text, padding: 20, textAlign: "center", lineHeight: 22 }}>
            {post.content}
          </Text>
        )}
      </TouchableOpacity>

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

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: 12 }]} >
        <TouchableOpacity onPress={onLike} style={styles.actionBtn}>
          <Heart size={24} color={isLiked ? colors.coral : tk.text} fill={isLiked ? colors.coral : "none"} />
          <Text style={[styles.actionCount, { color: tk.text }]}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCommentOpen(v => !v)} style={styles.actionBtn}>
          <MessageCircle size={24} color={tk.text} />
          <Text style={[styles.actionCount, { color: tk.text }]}>{commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onShare(post.id)}>
          <Send size={24} color={tk.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSave} style={{ marginLeft: "auto" }}>
          <Bookmark size={24} color={isSaved ? colors.primary : tk.text} fill={isSaved ? colors.primary : "none"} />
        </TouchableOpacity>
      </View>

      {/* Inline comments */}
      {commentOpen && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          {localComments.slice(-3).map((c: any, i) => (
            <View key={c.id || i} style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
              <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 12, color: tk.text }}>{c.author?.name || "User"}</Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: tk.textMuted, flex: 1 }}>{c.text}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 6, alignItems: "center" }}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment…"
              placeholderTextColor={tk.textMuted}
              style={{ flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: tk.text, borderBottomWidth: 1, borderColor: tk.border, paddingVertical: 4 }}
            />
            <TouchableOpacity onPress={handleComment} disabled={submitting}>
              <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.primary }}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const composeOptions = [
  { label: "New Post", desc: "Share a photo of your pet", tintColor: "rgba(255,107,107,0.15)", to: "/compose" as const },
  // { label: "New Reel", desc: "Quick video moment", tintColor: "rgba(37,99,235,0.1)", to: "/reels" as const },
  { label: "Ask the Community", desc: "Get help from pet parents", tintColor: "rgba(255,217,61,0.3)", to: "/ask" as const },
  { label: "Add Memory", desc: "Save to Moona's vault", tintColor: "rgba(255,111,207,0.15)", to: "/memory" as const },
];

function ComposeSheet({ open, onClose, onPublished }: { open: boolean; onClose: () => void; onPublished: () => void }) {
  const router = useRouter();
  const tk = useTokens();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: tk.card }]}>
          <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />
          <Text style={[styles.sheetTitle, { color: tk.text }]}>Create</Text>
          {composeOptions.map((o) => (
            <TouchableOpacity key={o.label} onPress={() => { onClose(); router.push(o.to); }}
              style={[styles.sheetRow, { backgroundColor: tk.bg }]} activeOpacity={0.8}>
              <View style={[styles.sheetIcon, { backgroundColor: o.tintColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetRowTitle, { color: tk.text }]}>{o.label}</Text>
                <Text style={[styles.sheetRowDesc, { color: tk.textMuted }]}>{o.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, paddingTop: 10 },
  logoImg: { width: 120, height: 50, alignSelf: "flex-start" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  notifDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.coral,
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
  reminderCard: { flexDirection: "row", alignItems: "center", width: 240, padding: 12, borderRadius: 16, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  reminderIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reminderTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  reminderTime: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  feedList: { gap: 20, paddingHorizontal: 16, marginTop: 12, width: "100%" },
  card: { borderRadius: 24, alignSelf: "stretch", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 0, gap: 10 },
  cardMeta: { flex: 1 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 14, lineHeight: 20 },
  petOwner: { fontSize: 11, fontFamily: "Inter_400Regular" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: "#fff" },
  imageWrapper: { width: "92%", alignSelf: "center", aspectRatio: 1, marginTop: 12, marginBottom: 4, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  postImage: { width: "80%", height: "80%" },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  caption: { paddingHorizontal: 16, paddingTop: 8, fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular" },
  captionBold: { fontFamily: "Poppins_700Bold" },
  tags: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4, fontSize: 12, fontFamily: "Poppins_600SemiBold", color: colors.primary },
  fab: { position: "absolute", bottom: 16, right: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 16, opacity: 0.2 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, paddingHorizontal: 4, marginBottom: 12 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 16, padding: 16, marginBottom: 8 },
  sheetIcon: { width: 48, height: 48, borderRadius: 16 },
  sheetRowTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  sheetRowDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyImage: { width: 140, height: 140, marginBottom: 16, opacity: 0.8 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, marginBottom: 8, textAlign: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
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
});
