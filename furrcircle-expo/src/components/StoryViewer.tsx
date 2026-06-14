import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Image, Modal, StyleSheet, Dimensions,
  TouchableOpacity, Animated, Pressable, PanResponder, Alert,
  ActivityIndicator, Platform, FlatList,
} from "react-native";
import { X, Trash2, ChevronUp } from "./ui/icons";
import { useTokens } from "../lib/theme-store";
import { useBreakpoint } from "../lib/breakpoints";
import { storyApi } from "../../services/community/storyApi";
import { Video, ResizeMode } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../lib/theme";
import { useRouter } from "expo-router";

const formatViewerTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STORY_DURATION = 4000; // 4 seconds per story

export interface Story {
  id: string;
  mediaUrl: any; // Uri string or local require asset
  mediaType: "image" | "video";
  caption?: string;
  overlayText?: string;
  viewCount?: number;
}

export interface StoryGroup {
  userId: string;
  username: string;
  avatar: any;
  stories: Story[];
}

interface StoryViewerProps {
  visible: boolean;
  onClose: () => void;
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  onStoryDeleted?: (storyId: string) => void;
  onStoryViewed?: (storyId: string, userId: string) => void;
}

export function StoryViewer({ visible, onClose, storyGroups, initialGroupIndex, onStoryDeleted, onStoryViewed }: StoryViewerProps) {
  const router = useRouter();
  const tk = useTokens();
  const { isTablet } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [localViewCounts, setLocalViewCounts] = useState<Record<string, number>>({});
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Hold-to-pause handling. A quick tap navigates; a press held past the
  // threshold pauses the story until release.
  const holdTimerRef = useRef<any>(null);
  const didHoldRef = useRef(false);

  const handlePressIn = () => {
    didHoldRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      didHoldRef.current = true;
      setIsPaused(true);
    }, 180);
  };

  const handlePressOut = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (didHoldRef.current) {
      setIsPaused(false);
    }
  };

  const handleZoneTap = (dir: "prev" | "next") => {
    // Suppress navigation if this was a hold (pause) gesture.
    if (didHoldRef.current) {
      didHoldRef.current = false;
      return;
    }
    if (dir === "prev") handlePrev();
    else handleNext();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          onClose();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setGroupIndex(initialGroupIndex);
      setStoryIndex(0);
    }
  }, [visible, initialGroupIndex]);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  const startProgress = (duration = STORY_DURATION) => {
    progress.setValue(0);
    if (animationRef.current) {
      animationRef.current.stop();
    }

    if (isPaused) return;

    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    });

    animationRef.current.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });
  };

  useEffect(() => {
    if (isPaused) {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    } else {
      if (visible && currentStory && !mediaLoading && currentStory.mediaType !== "video") {
        const currentVal = (progress as any)._value || 0;
        const remainingDuration = STORY_DURATION * (1 - currentVal);

        if (animationRef.current) {
          animationRef.current.stop();
        }

        animationRef.current = Animated.timing(progress, {
          toValue: 1,
          duration: remainingDuration > 0 ? remainingDuration : STORY_DURATION,
          useNativeDriver: false,
        });

        animationRef.current.start(({ finished }) => {
          if (finished) {
            handleNext();
          }
        });
      }
    }
  }, [isPaused, mediaLoading]);

  const handleOpenViewers = async () => {
    if (!currentStory?.id) return;
    setIsPaused(true);
    setShowViewersSheet(true);
    setLoadingViewers(true);
    try {
      const data = await storyApi.getStoryViewers(currentStory.id);
      const list = data.viewers || [];
      setViewers(list);
      setLocalViewCounts((prev) => ({
        ...prev,
        [currentStory.id]: list.length,
      }));
    } catch (err) {
      console.error("Failed to load story viewers", err);
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleCloseViewers = () => {
    setShowViewersSheet(false);
    setIsPaused(false);
  };

  const handleNext = () => {
    if (!currentGroup) return;
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!currentGroup) return;
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setStoryIndex(storyGroups[groupIndex - 1].stories.length - 1);
    } else {
      startProgress();
    }
  };

  const handleDeleteStory = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    Alert.alert(
      "Delete Story",
      "Are you sure you want to delete this story?",
      [
        {
          text: "Cancel",
          onPress: () => {
            startProgress();
          },
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await storyApi.deleteStory(currentStory.id);
              if (onStoryDeleted) {
                onStoryDeleted(currentStory.id);
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete story.");
              startProgress();
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (visible && currentStory) {
      setMediaLoading(true);
      progress.setValue(0);
      setIsPaused(false);
      if (animationRef.current) {
        animationRef.current.stop();
      }

      if (currentStory.id && !currentStory.id.startsWith("my-")) {
        storyApi.viewStory(currentStory.id).catch(() => { });
        if (onStoryViewed) {
          onStoryViewed(currentStory.id, currentGroup.userId);
        }
      }
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [visible, groupIndex, storyIndex]);

  if (!visible || !currentGroup || !currentStory) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container} {...panResponder.panHandlers}>
        <View style={[styles.contentWrapper, isTablet && styles.contentWrapperTablet]}>
          {/* Fullscreen media */}
          {currentStory.mediaType === "video" ? (
            <Video
              key={currentStory.id}
              source={typeof currentStory.mediaUrl === "string" ? { uri: currentStory.mediaUrl } : currentStory.mediaUrl}
              style={styles.media}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={visible && !isPaused}
              isMuted={false}
              progressUpdateIntervalMillis={50}
              onPlaybackStatusUpdate={(status: any) => {
                if (!status.isLoaded) return;

                if (isPaused) return;

                // Toggle loader container on buffering
                const isBuffering = status.isBuffering && !status.isPlaying;
                setMediaLoading(isBuffering);

                if (status.durationMillis && status.positionMillis !== undefined) {
                  // If not buffering, synchronize progress bar with video duration ratio
                  if (!isBuffering) {
                    const ratio = status.positionMillis / status.durationMillis;
                    progress.setValue(ratio);
                  }
                }

                if (status.didJustFinish) {
                  handleNext();
                }
              }}
            />
          ) : (
            <Image
              key={currentStory.id}
              source={typeof currentStory.mediaUrl === "string" ? { uri: currentStory.mediaUrl } : currentStory.mediaUrl}
              style={styles.media}
              resizeMode="contain"
              onLoad={() => {
                setMediaLoading(false);
                if (!isPaused) {
                  startProgress(STORY_DURATION);
                }
              }}
              onError={() => {
                setMediaLoading(false);
                if (!isPaused) {
                  startProgress(STORY_DURATION);
                }
              }}
            />
          )}

          {mediaLoading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {/* Dark overlay at top for readability */}
          <View style={styles.topOverlay} />

          {/* Progress Bar Indicators */}
          <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 10) }]}>
            <View style={styles.progressBarContainer}>
              {currentGroup.stories.map((_, index) => {
                let width: any = "0%";
                if (index < storyIndex) {
                  width = "100%";
                } else if (index === storyIndex) {
                  return (
                    <View key={index} style={styles.progressTrack}>
                      <Animated.View
                        style={[
                          styles.progressFill,
                          {
                            width: progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            }),
                          },
                        ]}
                      />
                    </View>
                  );
                }
                return (
                  <View key={index} style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width }]} />
                  </View>
                );
              })}
            </View>

            {/* Header (Avatar + Username + Close Button) */}
            <View style={styles.header}>
              <Image source={currentGroup.avatar} style={styles.avatar} />
              <Text style={styles.username}>{currentGroup.username}</Text>
              <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 12 }}>
                {currentGroup.userId === "me" && (
                  <TouchableOpacity onPress={handleDeleteStory} style={styles.deleteButton}>
                    <Trash2 size={22} color="#ff4d4d" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Center Overlay Text */}
          {currentStory.overlayText ? (
            <View style={styles.overlayTextContainer}>
              <Text style={styles.overlayText}>{currentStory.overlayText}</Text>
            </View>
          ) : null}

          {/* Caption */}
          {currentStory.caption ? (
            <View style={[
              styles.captionContainer,
              { bottom: (currentGroup.userId === "me" && currentStory.viewCount !== undefined) ? Math.max(insets.bottom, 10) + 54 : Math.max(insets.bottom, 16) }
            ]}>
              <Text style={styles.captionText}>{currentStory.caption}</Text>
            </View>
          ) : null}

          {/* View Count floating button at the bottom center (Instagram style) */}
          {currentGroup.userId === "me" && currentStory.viewCount !== undefined && (() => {
            const count = localViewCounts[currentStory.id] !== undefined
              ? localViewCounts[currentStory.id]
              : currentStory.viewCount;
            return (
              <TouchableOpacity
                onPress={handleOpenViewers}
                style={[styles.floatingViewCount, { bottom: Math.max(insets.bottom, 10) }]}
                activeOpacity={0.8}
              >
                <ChevronUp size={16} color="rgba(255, 255, 255, 0.85)" style={styles.chevronUp} />
                <Text style={styles.viewCountTextBottom}>
                  {count} {count === 1 ? "view" : "views"}
                </Text>
              </TouchableOpacity>
            );
          })()}

          {/* Touch zones for navigation + hold-to-pause */}
          <View style={styles.touchZones}>
            <Pressable
              style={styles.leftTouch}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => handleZoneTap("prev")}
              delayLongPress={180}
            />
            <Pressable
              style={styles.rightTouch}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => handleZoneTap("next")}
              delayLongPress={180}
            />
          </View>
        </View>
      </View>

      {/* Viewers Bottom Sheet Modal */}
      <Modal
        visible={showViewersSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseViewers}
      >
        <Pressable style={styles.sheetOverlay} onPress={handleCloseViewers}>
          <Pressable style={styles.sheetContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetDragIndicator} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 12 }}>
                <Text style={styles.sheetTitle}>Viewers ({viewers.length})</Text>
                <TouchableOpacity onPress={handleCloseViewers} style={styles.sheetCloseButton}>
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {loadingViewers ? (
              <View style={styles.sheetLoader}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : viewers.length === 0 ? (
              <View style={styles.sheetEmpty}>
                <Text style={styles.sheetEmptyText}>No views yet</Text>
              </View>
            ) : (
              <FlatList
                data={viewers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.viewerList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.viewerRow}
                    onPress={() => {
                      if (item.username) {
                        handleCloseViewers();
                        onClose();
                        router.push(`/u/${item.username}`);
                      }
                    }}
                  >
                    <Image
                      source={item.avatarUrl ? { uri: item.avatarUrl } : require("../assets/doodle-puppy.png")}
                      style={styles.viewerAvatar}
                    />
                    <View style={styles.viewerInfo}>
                      <Text style={styles.viewerName}>{item.name}</Text>
                      <Text style={styles.viewerTime}>
                        {formatViewerTime(item.viewedAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  contentWrapper: { width: "100%", height: "100%", position: "relative", overflow: "hidden" },
  contentWrapperTablet: { maxWidth: 480, aspectRatio: 9 / 16, alignSelf: "center", borderRadius: 16 },
  media: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, height: Platform.OS === 'ios' ? 135 : 100, backgroundColor: "rgba(0,0,0,0.35)" },
  safeArea: { zIndex: 10 },
  progressBarContainer: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 0, gap: 4 },
  progressTrack: { flex: 1, height: 3, backgroundColor: "rgba(255, 255, 255, 0.35)", borderRadius: 1.5, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 12, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: "#fff" },
  username: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 14 },
  closeButton: { padding: 4 },
  deleteButton: { padding: 4 },
  touchZones: { ...StyleSheet.absoluteFillObject, flexDirection: "row", zIndex: 5 },
  leftTouch: { flex: 1 },
  rightTouch: { flex: 2 },
  captionContainer: { position: "absolute", bottom: 60, left: 20, right: 20, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, padding: 12, zIndex: 10 },
  captionText: { color: "#fff", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  overlayTextContainer: {
    position: "absolute",
    top: "40%",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
  },
  overlayText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    textAlign: "center",
  },
  viewCountText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    marginTop: 1,
  },
  floatingViewCount: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  chevronUp: {
    marginTop: -1,
  },
  viewCountTextBottom: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    zIndex: 2,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "60%",
    minHeight: 300,
  },
  sheetHeader: {
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sheetDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#555",
    borderRadius: 2,
    marginTop: 8,
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  sheetCloseButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "#333",
  },
  sheetLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  sheetEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  sheetEmptyText: {
    color: "#888",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  viewerList: {
    paddingVertical: 12,
  },
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  viewerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  viewerTime: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
