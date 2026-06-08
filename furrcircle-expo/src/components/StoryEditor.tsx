import React, { useState } from "react";
import {
  View, Text, Image, Modal, StyleSheet, Dimensions,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Pressable, Keyboard,
} from "react-native";
import { X, Check, Volume2, VolumeX } from "lucide-react-native";
import { useTokens } from "../lib/theme-store";
import { colors } from "../lib/theme";
import { Video, ResizeMode } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface StoryEditorProps {
  visible: boolean;
  imageUri: string | null;
  mediaType: "image" | "video";
  loading?: boolean;
  onCancel: () => void;
  onSave: (overlayText: string, caption: string) => void;
}

export function StoryEditor({ visible, imageUri, mediaType, loading = false, onCancel, onSave }: StoryEditorProps) {
  const tk = useTokens();
  const insets = useSafeAreaInsets();
  const [overlayText, setOverlayText] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaLoading, setMediaLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  React.useEffect(() => {
    if (visible) {
      setMediaLoading(true);
    }
  }, [visible, imageUri]);

  if (!visible || !imageUri) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          {/* Background Media Preview */}
          {mediaType === "video" ? (
            <Video
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode={ResizeMode.COVER}
              shouldPlay={true}
              isLooping={true}
              isMuted={isMuted}
              onLoadStart={() => setMediaLoading(true)}
              onLoad={() => setMediaLoading(false)}
              onError={() => setMediaLoading(false)}
            />
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
              onLoadStart={() => setMediaLoading(true)}
              onLoad={() => setMediaLoading(false)}
              onError={() => setMediaLoading(false)}
            />
          )}

          {mediaLoading && (
            <View style={styles.mediaLoadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {mediaType === "video" && (
            <TouchableOpacity
              onPress={() => setIsMuted(!isMuted)}
              style={[styles.muteFloatingBtn, { top: Math.max(insets.top, 16) + 60 }]}
            >
              {isMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
            </TouchableOpacity>
          )}

          {/* Top Controls */}
          <View style={[styles.topBar, { top: Math.max(insets.top, 16) }]}>
            <TouchableOpacity onPress={onCancel} disabled={loading} style={[styles.iconBtn, loading && { opacity: 0.5 }]}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Story</Text>
            <TouchableOpacity
              onPress={() => {
                onSave(overlayText, caption);
                setOverlayText("");
                setCaption("");
              }}
              disabled={loading}
              style={[styles.iconBtn, { backgroundColor: colors.coral }, loading && { opacity: 0.5 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Check size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Center Text Overlay Input */}
          {/* <View style={styles.overlayTextContainer}>
            <TextInput
              value={overlayText}
              onChangeText={setOverlayText}
              placeholder="Tap to add text..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.overlayInput}
              multiline
              maxLength={100}
              textAlign="center"
              editable={!loading}
            />
          </View> */}

          {/* Spacer to push bottomBar to the bottom */}
          <View style={{ flex: 1 }} />

          {/* Bottom Caption Input */}
          <View style={[styles.bottomBar, { marginBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.captionContainer}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={styles.captionInput}
                editable={!loading}
              />
            </View>
          </View>
        </Pressable>

        {/* Uploading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Uploading story...</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  previewImage: { ...StyleSheet.absoluteFillObject },
  topBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 16, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
  overlayTextContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    zIndex: 5,
  },
  overlayInput: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: "100%",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 3,
  },
  bottomBar: {
    marginBottom: Platform.OS === "ios" ? 40 : 20,
    marginHorizontal: 16,
    zIndex: 10,
  },
  captionContainer: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: "center",
  },
  captionInput: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  mediaLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  muteFloatingBtn: {
    position: "absolute",
    right: 16,
    top: Platform.OS === "ios" ? 110 : 80,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
});
