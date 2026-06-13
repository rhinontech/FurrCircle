import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, ActivityIndicator, Alert, TextInput,
  PanResponder, Animated, Pressable,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { Video, ResizeMode } from "expo-av";
import { useCameraStore } from "../src/lib/camera-store";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import {
  X, Zap, ZapOff, RotateCw, Sparkles, Type, Check,
  Play, Pause, Grid, Timer, Crop, RefreshCw, ChevronLeft,
} from "lucide-react-native";
import { PageContainer } from "../src/components/PageContainer";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Visual Filter Presets
const FILTERS = [
  { id: "normal", name: "Normal", overlay: null },
  { id: "chrome", name: "Warm Chrome", overlay: "rgba(255, 140, 0, 0.08)" },
  { id: "noir", name: "Classic Noir", overlay: "rgba(0, 0, 0, 0.4)" }, // Grayscale styling simulated below
  { id: "sepia", name: "Vintage Sepia", overlay: "rgba(112, 66, 20, 0.15)" },
  { id: "cool", name: "Cool Ice", overlay: "rgba(0, 150, 255, 0.08)" },
];

export default function CustomCameraScreen() {
  const router = useRouter();
  const tk = useTokens();
  const { origin } = useLocalSearchParams<{ origin?: string }>();
  const setCapturedMedia = useCameraStore((s) => s.setCapturedMedia);

  // Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  // Camera settings
  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const [zoom, setZoom] = useState(0); // 0 to 1
  const [captureMode, setCaptureMode] = useState<"picture" | "video">("picture");

  // Options side panel
  const [showGrid, setShowGrid] = useState(false);
  const [timerDelay, setTimerDelay] = useState<0 | 3 | 10>(0); // in seconds
  const [countdown, setCountdown] = useState<number | null>(null);
  const [aspectRatioMode, setAspectRatioMode] = useState<"16:9" | "4:3" | "1:1">("16:9");

  // States for capturing / recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Captured media preview state
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "video" | null>(null);
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Text overlay state
  const [overlayText, setOverlayText] = useState("");
  const [isEditingText, setIsEditingText] = useState(false);
  const [textColor, setTextColor] = useState("#FFFFFF");
  
  // Dragging overlay text
  const pan = useRef(new Animated.ValueXY({ x: 0, y: SCREEN_HEIGHT / 2 - 40 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // Video playback
  const videoRef = useRef<any>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  // Timer countdown handler
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      executeCapture();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Video recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingDuration(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  if (!cameraPermission || !microphonePermission) {
    // Permissions are still loading
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: "#000" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    // Permissions not granted
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: "#000" }]}>
        <Text style={styles.permissionTitle}>Camera Permissions Required</Text>
        <Text style={styles.permissionDesc}>
          FurrCircle needs access to your camera and microphone so you can take custom photos and record videos of your pets.
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={async () => {
            await requestCameraPermission();
            await requestMicrophonePermission();
          }}
        >
          <Text style={styles.permissionBtnText}>Enable Camera & Mic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Camera Flipping
  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  // Flash cycle: off -> on -> auto
  const cycleFlash = () => {
    setFlash((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
  };

  // Zoom slider buttons
  const setQuickZoom = (level: number) => {
    setZoom(level);
  };

  // Main capture action
  const handleCapturePress = () => {
    if (isRecording) {
      stopRecordingVideo();
      return;
    }

    if (timerDelay > 0) {
      setCountdown(timerDelay);
    } else {
      executeCapture();
    }
  };

  const executeCapture = async () => {
    if (!cameraRef.current) return;

    if (captureMode === "picture") {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        setPreviewUri(photo.uri);
        setPreviewType("image");
      } catch (err) {
        console.error("Failed to take photo:", err);
        Alert.alert("Error", "Failed to capture photo.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Start recording video
      startRecordingVideo();
    }
  };

  const startRecordingVideo = async () => {
    if (!cameraRef.current) return;
    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 30, // Limit to 30s for stories
      });
      setPreviewUri(video.uri);
      setPreviewType("video");
    } catch (err) {
      console.error("Failed to record video:", err);
      setIsRecording(false);
      Alert.alert("Error", "Failed to record video.");
    }
  };

  const stopRecordingVideo = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  // Save / Confirm Media
  const handleConfirmMedia = () => {
    if (!previewUri) return;
    
    // Save to global state store
    setCapturedMedia(previewUri, previewType);
    
    // Navigate back to origin screen or main feed
    if (origin) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  // Cycle filters
  const nextFilter = () => {
    setActiveFilterIndex((prev) => (prev + 1) % FILTERS.length);
  };

  // Format recording seconds to 0:00
  const formatDuration = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <PageContainer>
      <View style={styles.container}>
        {previewUri ? (
          /* PREVIEW & EDIT VIEW MODE */
          <View style={styles.previewContainer}>
            {previewType === "image" ? (
              <Image
                source={{ uri: previewUri }}
                style={[
                  styles.previewMedia,
                  activeFilterIndex === 2 && styles.grayscaleFilter, // Simulating Noir
                ]}
                resizeMode="cover"
              />
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: previewUri }}
                style={[
                  styles.previewMedia,
                  activeFilterIndex === 2 && styles.grayscaleFilter,
                ]}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isVideoPlaying}
                isLooping
                onPlaybackStatusUpdate={(status: any) => {
                  setIsVideoPlaying(status.isPlaying);
                }}
              />
            )}

            {/* Filter Overlay Layer */}
            {FILTERS[activeFilterIndex].overlay && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: FILTERS[activeFilterIndex].overlay || undefined },
                ]}
                pointerEvents="none"
              />
            )}

            {/* Draggable Caption Text Overlay */}
            {overlayText.length > 0 && !isEditingText && (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  pan.getLayout(),
                  styles.draggableTextContainer,
                ]}
              >
                <TouchableOpacity
                  onPress={() => setIsEditingText(true)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.draggableText, { color: textColor }]}>{overlayText}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Text input modal overlay */}
            {isEditingText && (
              <Pressable
                style={styles.textEditOverlay}
                onPress={() => setIsEditingText(false)}
              >
                <TextInput
                  value={overlayText}
                  onChangeText={setOverlayText}
                  placeholder="Add a cute caption..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  style={[styles.textInputOverlay, { color: textColor }]}
                  autoFocus
                  maxLength={100}
                  onSubmitEditing={() => setIsEditingText(false)}
                />

                {/* Color Selector Row */}
                <View style={styles.colorSelectorRow}>
                  {["#FFFFFF", "#0D3B8E", "#FF6B6B", "#FFD93D", "#4CAF50", "#000000"].map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setTextColor(c)}
                      style={[
                        styles.colorOption,
                        { backgroundColor: c },
                        textColor === c && styles.colorOptionActive,
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            )}

            {/* Filter Name Badge Indicator */}
            <View style={styles.filterBadge}>
              <Sparkles size={14} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.filterBadgeText}>{FILTERS[activeFilterIndex].name}</Text>
            </View>

            {/* Top Preview Controls */}
            <View style={styles.previewTopBar}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  setPreviewUri(null);
                  setPreviewType(null);
                  setOverlayText("");
                }}
              >
                <X size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.previewActionsRight}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setIsEditingText(true)}
                >
                  <Type size={22} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={nextFilter}
                >
                  <Sparkles size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Play/Pause control for Video preview */}
            {previewType === "video" && (
              <TouchableOpacity
                style={styles.playPauseBtn}
                onPress={() => {
                  if (videoRef.current) {
                    if (isVideoPlaying) videoRef.current.pauseAsync();
                    else videoRef.current.playAsync();
                  }
                }}
              >
                {isVideoPlaying ? (
                  <Pause size={24} color="#FFF" />
                ) : (
                  <Play size={24} color="#FFF" />
                )}
              </TouchableOpacity>
            )}

            {/* Bottom Preview Accept Button */}
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmMedia}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#5B8DF5", colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.confirmBtnText}>Use Photo / Video</Text>
              <Check size={20} color="#FFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        ) : (
          /* LIVE VIEW CAMERA MODE */
          <View style={styles.cameraViewport}>
            {/* Viewfinder background (centered behind controls) */}
            <View style={styles.cameraContainer}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                flash={flash}
                zoom={zoom}
                mode={captureMode}
              />

              {/* Aspect Ratio Masks */}
              {aspectRatioMode === "4:3" && (
                <>
                  <View style={[styles.maskBar, { top: 0, height: 80 }]} />
                  <View style={[styles.maskBar, { bottom: 0, height: SCREEN_HEIGHT - (SCREEN_WIDTH * 4 / 3) - 80 }]} />
                </>
              )}
              {aspectRatioMode === "1:1" && (
                <>
                  <View style={[styles.maskBar, { top: 0, height: 120 }]} />
                  <View style={[styles.maskBar, { bottom: 0, height: SCREEN_HEIGHT - SCREEN_WIDTH - 120 }]} />
                </>
              )}

              {/* Grid Overlay lines (contained inside viewfinder bounds) */}
              {showGrid && (
                <View
                  style={[
                    styles.gridContainer,
                    { aspectRatio: aspectRatioMode === "16:9" ? 9 / 16 : aspectRatioMode === "4:3" ? 3 / 4 : 1 },
                  ]}
                  pointerEvents="none"
                >
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol} />
                    <View style={styles.gridCol} />
                    <View style={styles.gridCol} />
                  </View>
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol} />
                    <View style={styles.gridCol} />
                    <View style={styles.gridCol} />
                  </View>
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol} />
                    <View style={styles.gridCol} />
                    <View style={styles.gridCol} />
                  </View>
                </View>
              )}
            </View>

            {/* Countdown overlay */}
            {countdown !== null && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}

            {/* Processing Spinner */}
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            )}

            {/* Viewfinder Controls (Placed outside CameraView, relative to screen margins) */}
            <View style={styles.viewfinderTopBar}>
              <TouchableOpacity
                style={styles.glassIconButton}
                onPress={() => router.back()}
              >
                <ChevronLeft size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.glassIconButton}
                onPress={cycleFlash}
              >
                {flash === "off" ? (
                  <ZapOff size={20} color="#FFF" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Zap size={20} color={colors.primary} />
                    {flash === "auto" && <Text style={styles.flashBadgeText}>A</Text>}
                    {flash === "on" && <Text style={styles.flashBadgeText}>On</Text>}
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Right Side Options Panel (Snapchat Style) */}
            <View style={styles.sidePanel}>
              <TouchableOpacity
                style={[styles.sidePanelButton, showGrid && styles.sideActive]}
                onPress={() => setShowGrid(!showGrid)}
              >
                <Grid size={18} color="#FFF" />
                <Text style={styles.sidePanelText}>Grid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sidePanelButton, timerDelay > 0 && styles.sideActive]}
                onPress={() => {
                  setTimerDelay((prev) => {
                    if (prev === 0) return 3;
                    if (prev === 3) return 10;
                    return 0;
                  });
                }}
              >
                <Timer size={18} color="#FFF" />
                <Text style={styles.sidePanelText}>
                  {timerDelay > 0 ? `${timerDelay}s` : "Timer"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sidePanelButton, aspectRatioMode !== "16:9" && styles.sideActive]}
                onPress={() => {
                  setAspectRatioMode((prev) => {
                    if (prev === "16:9") return "4:3";
                    if (prev === "4:3") return "1:1";
                    return "16:9";
                  });
                }}
              >
                <Crop size={18} color="#FFF" />
                <Text style={styles.sidePanelText}>
                  {aspectRatioMode}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Zoom Buttons Overlay (1x / 2x selector) */}
            <View style={styles.zoomContainer}>
              <TouchableOpacity
                style={[styles.zoomBtn, zoom === 0 && styles.zoomBtnActive]}
                onPress={() => setQuickZoom(0)}
              >
                <Text style={styles.zoomText}>1x</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.zoomBtn, zoom === 0.3 && styles.zoomBtnActive]}
                onPress={() => setQuickZoom(0.3)}
              >
                <Text style={styles.zoomText}>2x</Text>
              </TouchableOpacity>
            </View>

            {/* Video Recording Status / Duration Badge */}
            {isRecording && (
              <View style={styles.recordingStatusBadge}>
                <View style={styles.recordingRedDot} />
                <Text style={styles.recordingDurationText}>
                  {formatDuration(recordingDuration)}
                </Text>
              </View>
            )}

            {/* Bottom Viewfinder controls container */}
            <View style={styles.viewfinderBottomControls}>
              <View style={styles.bottomButtonsRow}>
                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.glassIconButton}
                  onPress={() => router.back()}
                >
                  <X size={22} color="#FFF" />
                </TouchableOpacity>

                {/* Main Capture button with border ring */}
                <TouchableOpacity
                  style={styles.captureButtonContainer}
                  onPress={handleCapturePress}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.captureButtonOuter,
                      isRecording && styles.captureButtonRecording,
                    ]}
                  >
                    <LinearGradient
                      colors={captureMode === "video" ? ["#FF4B4B", "#FF0000"] : ["#5B8DF5", colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.captureButtonInner}
                    />
                  </View>
                </TouchableOpacity>

                {/* Camera Flip Button */}
                <TouchableOpacity
                  style={styles.glassIconButton}
                  onPress={toggleFacing}
                >
                  <RotateCw size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Capture mode slider selector */}
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  onPress={() => {
                    if (!isRecording) setCaptureMode("picture");
                  }}
                  style={[
                    styles.modeOption,
                    captureMode === "picture" && styles.modeOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      captureMode === "picture" && styles.modeOptionTextActive,
                    ]}
                  >
                    PHOTO
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (!isRecording) setCaptureMode("video");
                  }}
                  style={[
                    styles.modeOption,
                    captureMode === "video" && styles.modeOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      captureMode === "video" && styles.modeOptionTextActive,
                    ]}
                  >
                    VIDEO
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </PageContainer>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  fallbackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permissionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  permissionBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#FFF",
  },
  backBtnFallback: {
    marginTop: 20,
  },
  backBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
  },
  permissionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginTop: 16,
  },
  cameraViewport: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 1,
  },
  camera: {
    width: "100%",
    maxHeight: "100%",
  },
  maskBar: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#000",
    zIndex: 2,
  },
  viewfinderTopBar: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  glassIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  flashBadgeText: {
    color: colors.primary,
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    marginLeft: 1,
    marginTop: -4,
  },
  sidePanel: {
    position: "absolute",
    right: 16,
    top: 100,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 16,
    alignItems: "center",
    zIndex: 10,
  },
  sidePanelButton: {
    alignItems: "center",
    gap: 4,
    width: 44,
  },
  sideActive: {
    opacity: 0.6,
  },
  sidePanelText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  zoomContainer: {
    position: "absolute",
    bottom: 215,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(18, 18, 18, 0.65)",
    borderRadius: 24,
    padding: 3,
    zIndex: 10,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  zoomText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  recordingStatusBadge: {
    position: "absolute",
    top: 48,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,0,0,0.8)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    zIndex: 10,
  },
  recordingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  recordingDurationText: {
    color: "#FFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
  },
  gridCol: {
    flex: 1,
    borderWidth: 0.25,
    borderColor: "rgba(255,255,255,0.35)",
  },
  countdownContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  countdownText: {
    fontSize: 120,
    fontFamily: "Poppins_700Bold",
    color: "#FFF",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  viewfinderBottomControls: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 16,
    zIndex: 10,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 32,
  },
  captureButtonContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonRecording: {
    borderColor: "rgba(255, 0, 0, 0.8)",
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  modeSelector: {
    flexDirection: "row",
    gap: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  modeOption: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modeOptionActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  modeOptionText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },
  modeOptionTextActive: {
    color: "#FFF",
  },
  previewContainer: {
    flex: 1,
  },
  previewMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  grayscaleFilter: {
    opacity: 0.9,
    tintColor: "gray", // Native image filter simulation
  },
  filterBadge: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
  },
  filterBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },
  previewTopBar: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewActionsRight: {
    flexDirection: "row",
    gap: 12,
  },
  playPauseBtn: {
    position: "absolute",
    alignSelf: "center",
    top: SCREEN_HEIGHT / 2 - 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  confirmBtn: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 32,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  confirmBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  draggableTextContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    paddingHorizontal: 20,
  },
  draggableText: {
    color: "#FFF",
    fontFamily: "Fredoka_700Bold",
    fontSize: 28,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  textEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  textInputOverlay: {
    fontFamily: "Fredoka_700Bold",
    fontSize: 32,
    textAlign: "center",
    width: "80%",
    padding: 10,
  },
  colorSelectorRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  colorOptionActive: {
    borderColor: "#FFF",
    transform: [{ scale: 1.2 }],
  },
});
