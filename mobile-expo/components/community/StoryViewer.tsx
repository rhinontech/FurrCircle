import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Image, Modal, Pressable, Dimensions, StatusBar, FlatList, PanResponder, Animated as RNAnimated, ActivityIndicator } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { X, Eye, TrendingUp } from "@/components/ui/IconCompat";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, cancelAnimation, Easing } from "react-native-reanimated";
import { Video, ResizeMode } from "expo-av";
import type { StoryGroup, StoryItem } from "@/services/users/communityApi";
import { userCommunityApi } from "@/services/users/communityApi";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_DURATION_MS = 5000;
const VIDEO_MAX_MS = 30000;

interface Viewer {
  id: string;
  name: string;
  avatarUrl: string | null;
  viewedAt: string;
}

interface Props {
  visible: boolean;
  storyGroups: StoryGroup[];
  myStoryGroup?: StoryGroup | null;
  initialGroupIndex: number;
  initialStoryIndex: number;
  currentUserId?: string;
  onClose: () => void;
}

export default function StoryViewer({
  visible,
  storyGroups,
  myStoryGroup,
  initialGroupIndex,
  initialStoryIndex,
  currentUserId,
  onClose,
}: Props) {
  const allGroups = myStoryGroup
    ? [myStoryGroup, ...storyGroups.filter((g) => g.userId !== myStoryGroup.userId)]
    : storyGroups;

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const [paused, setPaused] = useState(false);
  const [videoDuration, setVideoDuration] = useState(IMAGE_DURATION_MS);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Viewer panel state
  const [viewerPanelVisible, setViewerPanelVisible] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [viewersTotal, setViewersTotal] = useState(0);
  const [viewersLoading, setViewersLoading] = useState(false);
  const panelY = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;

  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<any>(null);

  const currentGroup = allGroups[groupIndex];
  const currentStory: StoryItem | undefined = currentGroup?.stories[storyIndex];
  const isOwnStory = !!currentUserId && currentGroup?.userId === currentUserId;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const goNext = useCallback(() => {
    clearTimer();
    cancelAnimation(progress);
    if (storyIndex < (currentGroup?.stories.length ?? 0) - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < allGroups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [storyIndex, groupIndex, currentGroup, allGroups.length, onClose]);

  const goPrev = useCallback(() => {
    clearTimer();
    cancelAnimation(progress);
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((g) => g - 1);
      setStoryIndex(0);
    }
  }, [storyIndex, groupIndex]);

  const startProgress = useCallback(
    (duration: number) => {
      progress.value = 0;
      progress.value = withTiming(1, { duration, easing: Easing.linear });
      clearTimer();
      timerRef.current = setTimeout(() => goNext(), duration);
    },
    [goNext]
  );

  useEffect(() => {
    if (!visible || !currentStory) return;
    setVideoDuration(IMAGE_DURATION_MS);
    setImageLoaded(false);
    userCommunityApi.viewStory(currentStory.id).catch(() => {});
    if (currentStory.mediaType === "image") {
      startProgress(IMAGE_DURATION_MS);
    }
    return () => {
      clearTimer();
      cancelAnimation(progress);
    };
  }, [groupIndex, storyIndex, visible]);

  useEffect(() => {
    if (!visible) {
      cancelAnimation(progress);
      clearTimer();
    }
  }, [visible]);

  useEffect(() => {
    if (paused) {
      cancelAnimation(progress);
      clearTimer();
    } else if (currentStory?.mediaType === "image") {
      startProgress(IMAGE_DURATION_MS);
    }
  }, [paused]);

  // Pan responder for swipe-up gesture on own stories
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => isOwnStory && gs.dy < -10 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (gs.dy < -50) openViewerPanel();
      },
    })
  ).current;

  const openViewerPanel = useCallback(async () => {
    if (!currentStory) return;
    setPaused(true);
    setViewerPanelVisible(true);
    RNAnimated.spring(panelY, { toValue: 0, useNativeDriver: true }).start();
    if (!viewersLoading) {
      setViewersLoading(true);
      try {
        const res = await userCommunityApi.getStoryViewers(currentStory.id);
        setViewers(res?.viewers || []);
        setViewersTotal(res?.total || 0);
      } catch {
        setViewers([]);
      } finally {
        setViewersLoading(false);
      }
    }
  }, [currentStory, viewersLoading]);

  const closeViewerPanel = useCallback(() => {
    RNAnimated.timing(panelY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => {
      setViewerPanelVisible(false);
      setViewers([]);
      setPaused(false);
    });
  }, []);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleVideoStatus = (status: any) => {
    if (!status.isLoaded) return;
    const dur = status.durationMillis ?? IMAGE_DURATION_MS;
    if (status.isLoaded && status.durationMillis && videoDuration !== status.durationMillis) {
      const clampedDur = Math.min(dur, VIDEO_MAX_MS);
      setVideoDuration(clampedDur);
      startProgress(clampedDur);
    }
    if (status.didJustFinish) goNext();
  };

  if (!visible || !currentStory) return null;

  const stories = currentGroup?.stories ?? [];

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={{ flex: 1, backgroundColor: "#000" }} {...panResponder.panHandlers}>
        {/* Media */}
        {currentStory.mediaType === "video" ? (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.mediaUrl }}
            style={{ position: "absolute", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={!paused}
            isLooping={false}
            onPlaybackStatusUpdate={handleVideoStatus}
            onReadyForDisplay={() => setImageLoaded(true)}
          />
        ) : (
          <Image
            key={currentStory.id}
            source={{ uri: currentStory.mediaUrl }}
            style={{ position: "absolute", width: SCREEN_WIDTH, height: SCREEN_HEIGHT, opacity: imageLoaded ? 1 : 0 }}
            resizeMode="contain"
            onLoad={() => setImageLoaded(true)}
          />
        )}

        {/* Loading spinner until media is ready */}
        {!imageLoaded && (
          <View style={{ position: "absolute", width: SCREEN_WIDTH, height: SCREEN_HEIGHT, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" />
          </View>
        )}

        {/* Progress bars */}
        <View style={{ position: "absolute", top: 52, left: 12, right: 12, flexDirection: "row", gap: 4, zIndex: 20 }}>
          {stories.map((_, i) => (
            <View
              key={i}
              style={{ flex: 1, height: 2.5, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)", overflow: "hidden" }}
            >
              {i < storyIndex ? (
                <View style={{ width: "100%", height: "100%", backgroundColor: "#fff" }} />
              ) : i === storyIndex ? (
                <Animated.View style={[{ height: "100%", backgroundColor: "#fff" }, progressBarStyle]} />
              ) : null}
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={{ position: "absolute", top: 64, left: 16, right: 16, flexDirection: "row", alignItems: "center", zIndex: 20, marginTop: 8 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
            {currentGroup?.author?.avatar_url ? (
              <Image source={{ uri: currentGroup.author.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#fff" }} />
            ) : (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{(currentGroup?.author?.name || "?")[0]?.toUpperCase()}</Text>
              </View>
            )}
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{currentGroup?.author?.name || "User"}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={{ padding: 4 }}>
            <X size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Own story bottom bar — view count + swipe up */}
        {isOwnStory && (
          <Pressable
            onPress={openViewerPanel}
            style={{
              position: "absolute",
              bottom: 48,
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 20,
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Eye size={16} color="rgba(255,255,255,0.8)" />
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" }}>
              {currentStory.viewCount} {currentStory.viewCount === 1 ? "view" : "views"}
            </Text>
            <TrendingUp size={16} color="rgba(255,255,255,0.8)" />
          </Pressable>
        )}

        {/* Caption overlay */}
        {currentStory.caption && (
          <View
            style={{
              position: "absolute",
              bottom: isOwnStory ? 96 : 48,
              left: 20,
              right: 20,
              alignItems: "center",
              zIndex: 15,
            }}
            pointerEvents="none"
          >
            <View style={{ backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center", lineHeight: 22 }}>
                {currentStory.caption}
              </Text>
            </View>
          </View>
        )}

        {/* Tap zones */}
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: SCREEN_WIDTH * 0.3, zIndex: 10 }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={goPrev}
            onLongPress={() => setPaused(true)}
            onPressOut={() => { if (!viewerPanelVisible) setPaused(false); }}
          />
        </View>
        <View style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: SCREEN_WIDTH * 0.7, zIndex: 10 }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={goNext}
            onLongPress={() => setPaused(true)}
            onPressOut={() => { if (!viewerPanelVisible) setPaused(false); }}
          />
        </View>
      </View>

      {/* Viewer panel (own stories only) */}
      {viewerPanelVisible && (
        <RNAnimated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: SCREEN_HEIGHT * 0.55,
            backgroundColor: "#1a1a1a",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            zIndex: 100,
            transform: [{ translateY: panelY }],
          }}
        >
          {/* Handle + header */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Eye size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{viewersTotal} {viewersTotal === 1 ? "View" : "Views"}</Text>
            </View>
            <Pressable onPress={closeViewerPanel} hitSlop={12}>
              <X size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          {/* Viewer list */}
          {viewersLoading ? (
            <Text style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 24 }}>Loading...</Text>
          ) : viewers.length === 0 ? (
            <Text style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 32, fontSize: 14 }}>No views yet</Text>
          ) : (
            <FlatList
              data={viewers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
              renderItem={({ item }) => (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{item.name[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>{item.name}</Text>
                </View>
              )}
            />
          )}
        </RNAnimated.View>
      )}
    </Modal>
  );
}
