import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { X, Type, Pencil, ChevronRight, RotateCcw, Edit2 } from "lucide-react-native";
import { Svg, Path } from "react-native-svg";
import ViewShot from "react-native-view-shot";
import type { ImagePickerAsset } from "expo-image-picker";

// Gestures
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";

const { width: SW, height: SH } = Dimensions.get("window");

const TOOL_COLORS = [
  "#FFFFFF", "#000000", "#FF3B30", "#FF9500",
  "#FFCC00", "#34C759", "#5856D6", "#FF2D55",
];

interface Props {
  visible: boolean;
  asset: ImagePickerAsset | null;
  onCancel: () => void;
  onPublish: (uri: string, caption?: string) => Promise<void>;
}

export default function StoryEditor({ visible, asset, onCancel, onPublish }: Props) {
  const [caption, setCaption] = useState("");
  const [publishing, setPublishing] = useState(false);
  const viewShotRef = useRef<any>(null);

  // Text overlay state
  const [textMode, setTextMode] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [overlayDraft, setOverlayDraft] = useState("");

  // Reanimated Shared Values for Vertical Gestures
  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);

  // Drawing state
  const [drawingMode, setDrawingMode] = useState(false);
  const [markerColor, setMarkerColor] = useState("#FFFFFF");
  const [paths, setPaths] = useState<{ d: string; color: string }[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  const CAMERA_HEIGHT = SW * (16 / 9);
  const VERTICAL_MARGIN = (SH - CAMERA_HEIGHT) / 2;

  // Reset state when a new asset is loaded
  useEffect(() => {
    if (visible && asset) {
      setPaths([]);
      setOverlayText("");
      setOverlayDraft("");
      setCaption("");
      translateY.value = 0;
      setDrawingMode(false);
      setTextMode(false);
    }
  }, [asset?.uri, visible]);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-5, 5])
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newY = startY.value + event.translationY;
      const minBound = - (CAMERA_HEIGHT * 0.38);
      const maxBound = (CAMERA_HEIGHT * 0.52);
      translateY.value = Math.min(Math.max(newY, minBound), maxBound);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
    ],
  }));

  const openTextMode = () => {
    setOverlayDraft(overlayText);
    setTextMode(true);
    setDrawingMode(false);
  };

  const confirmText = () => {
    setOverlayText(overlayDraft);
    setTextMode(false);
  };

  const cancelText = () => {
    setOverlayDraft(overlayText);
    setTextMode(false);
  };

  const handlePublish = async () => {
    if (!viewShotRef.current) return;
    setPublishing(true);
    try {
      // Give React time to re-render and hide UI elements (like edit button)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const uri = await viewShotRef.current.capture();
      await onPublish(uri, caption || undefined);

      setCaption("");
      setOverlayText("");
      setPaths([]);
      translateY.value = 0;
    } catch (err) {
      console.error("Failed to capture story", err);
    } finally {
      setPublishing(false);
    }
  };

  const startDrawing = (x: number, y: number) => {
    if (!drawingMode) return;
    setCurrentPath([`M${x},${y}`]);
  };

  const moveDrawing = (x: number, y: number) => {
    if (!drawingMode) return;
    setCurrentPath(prev => [...prev, `L${x},${y}`]);
  };

  const endDrawing = () => {
    if (!drawingMode || currentPath.length === 0) return;
    setPaths(prev => [...prev, { d: currentPath.join(" "), color: markerColor }]);
    setCurrentPath([]);
  };

  const undoDrawing = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  if (!asset) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar hidden />
        <View style={styles.container}>

        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", quality: 0.9 }}
          style={[styles.mediaContainer, { height: CAMERA_HEIGHT, top: VERTICAL_MARGIN }]}
        >
          <Image
            source={{ uri: asset.uri }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Drawing Canvas */}
          <View 
            style={styles.canvasContainer}
            pointerEvents="box-none"
            onStartShouldSetResponder={() => drawingMode}
            onResponderGrant={(e) => startDrawing(e.nativeEvent.locationX, e.nativeEvent.locationY)}
            onResponderMove={(e) => moveDrawing(e.nativeEvent.locationX, e.nativeEvent.locationY)}
            onResponderRelease={endDrawing}
          >
            <Svg width="100%" height="100%">
              {paths.map((p, i) => (
                <Path key={i} d={p.d} stroke={p.color} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {currentPath.length > 0 && (
                <Path d={currentPath.join(" ")} stroke={markerColor} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </Svg>
          </View>

          {/* Snapchat-style Snap-to-Width Text overlay */}
          {overlayText !== "" && !textMode && (
            <GestureDetector gesture={panGesture}>
              <Animated.View 
                style={[styles.textOverlay, animatedStyle]}
                collapsable={false}
              >
                <View style={styles.textOverlayInner}>
                  <Text style={styles.overlayText}>{overlayText}</Text>
                  
                  {!publishing && (
                    <TouchableOpacity 
                      onPress={openTextMode}
                      style={styles.textEditBtn}
                    >
                      <Edit2 size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            </GestureDetector>
          )}
        </ViewShot>

        {!textMode && (
          <View style={styles.topBar}>
            <Pressable onPress={onCancel} hitSlop={12}>
              <View style={styles.iconCircle}>
                <X size={24} color="#fff" />
              </View>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              {drawingMode && (
                <View style={styles.miniColorPicker}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
                    {TOOL_COLORS.map(c => (
                      <Pressable
                        key={c}
                        onPress={() => setMarkerColor(c)}
                        style={[
                          styles.miniColor,
                          { backgroundColor: c, borderWidth: markerColor === c ? 2 : 0, borderColor: "#fff" }
                        ]}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}
              {paths.length > 0 && drawingMode && (
                <Pressable onPress={undoDrawing}>
                  <View style={styles.iconCircle}>
                    <RotateCcw size={20} color="#fff" />
                  </View>
                </Pressable>
              )}
              <Pressable onPress={() => { setDrawingMode(!drawingMode); if (textMode) setTextMode(false); }}>
                <View style={[styles.iconCircle, { backgroundColor: drawingMode ? "#fff" : "rgba(0,0,0,0.3)" }]}>
                  <Pencil size={20} color={drawingMode ? "#000" : "#fff"} />
                </View>
              </Pressable>
              <Pressable onPress={() => { setTextMode(true); setDrawingMode(false); }}>
                <View style={[styles.iconCircle, { backgroundColor: textMode ? "#fff" : "rgba(0,0,0,0.3)" }]}>
                  <Type size={22} color={textMode ? "#000" : "#fff"} />
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {textMode && (
          <View style={styles.textEditorOverlay}>
            <TextInput
              autoFocus
              value={overlayDraft}
              onChangeText={setOverlayDraft}
              placeholder="Type something..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.textInput}
              multiline
              blurOnSubmit={false}
            />

            <View style={{ flexDirection: "row", gap: 16, marginTop: 28 }}>
              <Pressable onPress={cancelText} style={styles.cancelBtn}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmText} style={styles.doneBtn}>
                <Text style={{ color: "#000", fontWeight: "700" }}>Done</Text>
              </Pressable>
            </View>
          </View>
        )}

        {!textMode && !drawingMode && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.bottomBar}
          >
            <View style={styles.bottomBarInner}>
              <View style={styles.captionInputContainer}>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Add a caption..."
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  style={styles.captionInput}
                />
              </View>

              <TouchableOpacity
                onPress={handlePublish}
                disabled={publishing}
                style={styles.publishBtn}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ChevronRight size={28} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  mediaContainer: {
    position: "absolute",
    width: SW,
    backgroundColor: "#111",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  canvasContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  textOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "40%",
    zIndex: 20,
    width: SW,
  },
  textOverlayInner: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40, // Space for the floating button
  },
  textEditBtn: {
    position: "absolute",
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 32,
    color: "#FFFFFF",
  },
  topBar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 30,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniColorPicker: {
    flexDirection: "row",
    height: 40,
    width: SW * 0.45,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    alignItems: "center",
  },
  miniColor: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  textEditorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 50,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  textInput: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
    minHeight: 60,
    color: "#FFFFFF",
  },
  cancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  doneBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#fff",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 60,
  },
  bottomBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    paddingTop: 10,
    gap: 12,
  },
  captionInputContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 25,
    paddingHorizontal: 18,
    height: 50,
    justifyContent: "center",
  },
  captionInput: {
    color: "#fff",
    fontSize: 15,
  },
  publishBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});
