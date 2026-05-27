import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Image, Modal, StyleSheet, Dimensions,
  TouchableOpacity, Animated, Pressable, SafeAreaView, PanResponder,
} from "react-native";
import { X } from "lucide-react-native";
import { useTokens } from "../lib/theme-store";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STORY_DURATION = 4000; // 4 seconds per story

export interface Story {
  id: string;
  mediaUrl: any; // Uri string or local require asset
  mediaType: "image" | "video";
  caption?: string;
  overlayText?: string;
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
}

export function StoryViewer({ visible, onClose, storyGroups, initialGroupIndex }: StoryViewerProps) {
  const tk = useTokens();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

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

  const startProgress = () => {
    progress.setValue(0);
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animationRef.current.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });
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

  useEffect(() => {
    if (visible && currentStory) {
      startProgress();
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
        {/* Fullscreen media */}
        <Image source={typeof currentStory.mediaUrl === "string" ? { uri: currentStory.mediaUrl } : currentStory.mediaUrl} style={styles.media} resizeMode="cover" />

        {/* Dark overlay at top for readability */}
        <View style={styles.topOverlay} />

        {/* Progress Bar Indicators */}
        <SafeAreaView style={styles.safeArea}>
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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Center Overlay Text */}
        {currentStory.overlayText ? (
          <View style={styles.overlayTextContainer}>
            <Text style={styles.overlayText}>{currentStory.overlayText}</Text>
          </View>
        ) : null}

        {/* Caption */}
        {currentStory.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionText}>{currentStory.caption}</Text>
          </View>
        )}

        {/* Touch zones for navigation */}
        <View style={styles.touchZones}>
          <Pressable style={styles.leftTouch} onPress={handlePrev} />
          <Pressable style={styles.rightTouch} onPress={handleNext} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  media: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, position: "absolute" },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, height: 120, backgroundColor: "rgba(0,0,0,0.35)" },
  safeArea: { zIndex: 10 },
  progressBarContainer: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 10, gap: 4 },
  progressTrack: { flex: 1, height: 3, backgroundColor: "rgba(255, 255, 255, 0.35)", borderRadius: 1.5, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 12, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: "#fff" },
  username: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 14 },
  closeButton: { marginLeft: "auto", padding: 4 },
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
});
