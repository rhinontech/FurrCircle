import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Image, Modal, Pressable, Dimensions, StatusBar } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { X } from "@/components/ui/IconCompat";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, cancelAnimation, Easing } from "react-native-reanimated";
import { Video, ResizeMode } from "expo-av";
import type { StoryGroup, StoryItem } from "@/services/users/communityApi";
import { userCommunityApi } from "@/services/users/communityApi";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_DURATION_MS = 5000;
const VIDEO_MAX_MS = 30000;

interface Props {
  visible: boolean;
  storyGroups: StoryGroup[];
  myStoryGroup?: StoryGroup | null;
  initialGroupIndex: number;
  initialStoryIndex: number;
  onClose: () => void;
}

export default function StoryViewer({
  visible,
  storyGroups,
  myStoryGroup,
  initialGroupIndex,
  initialStoryIndex,
  onClose,
}: Props) {
  const allGroups = myStoryGroup ? [myStoryGroup, ...storyGroups.filter((g) => g.userId !== myStoryGroup.userId)] : storyGroups;

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const [paused, setPaused] = useState(false);
  const [videoDuration, setVideoDuration] = useState(IMAGE_DURATION_MS);

  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<any>(null);

  const currentGroup = allGroups[groupIndex];
  const currentStory: StoryItem | undefined = currentGroup?.stories[storyIndex];

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
    if (status.didJustFinish) {
      goNext();
    }
  };

  if (!visible || !currentStory) return null;

  const stories = currentGroup?.stories ?? [];

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={{ flex: 1, backgroundColor: "#000" }}>
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
          />
        ) : (
          <Image
            source={{ uri: currentStory.mediaUrl }}
            style={{ position: "absolute", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode="contain"
          />
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

        {/* Tap zones */}
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: SCREEN_WIDTH * 0.3, zIndex: 10 }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={goPrev}
            onLongPress={() => setPaused(true)}
            onPressOut={() => setPaused(false)}
          />
        </View>
        <View style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: SCREEN_WIDTH * 0.7, zIndex: 10 }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={goNext}
            onLongPress={() => setPaused(true)}
            onPressOut={() => setPaused(false)}
          />
        </View>
      </View>
    </Modal>
  );
}
