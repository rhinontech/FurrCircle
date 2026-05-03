import React, { useState, useRef } from "react";
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
} from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { X, ArrowRight, Pencil, Star, Download } from "@/components/ui/IconCompat";
import { Video, ResizeMode } from "expo-av";
import type { ImagePickerAsset } from "expo-image-picker";

const { width: SW, height: SH } = Dimensions.get("window");

const TOOL_COLORS = [
  "#FFFFFF", "#000000", "#FF3B30", "#FF9500",
  "#FFCC00", "#34C759", "#5856D6", "#FF2D55",
];

interface Props {
  visible: boolean;
  asset: ImagePickerAsset | null;
  onCancel: () => void;
  onPublish: (caption?: string) => Promise<void>;
}

export default function StoryEditor({ visible, asset, onCancel, onPublish }: Props) {
  const [caption, setCaption] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Text overlay state
  const [textMode, setTextMode] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [overlayDraft, setOverlayDraft] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");

  const isVideo = asset?.type === "video" || asset?.mimeType?.startsWith("video/");

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const fullCaption = [overlayText, caption].filter(Boolean).join("\n").trim();
      await onPublish(fullCaption || undefined);
      setCaption("");
      setOverlayText("");
    } finally {
      setPublishing(false);
    }
  };

  const openTextMode = () => {
    setOverlayDraft(overlayText);
    setTextMode(true);
  };

  const confirmText = () => {
    setOverlayText(overlayDraft);
    setTextMode(false);
  };

  const cancelText = () => {
    setOverlayDraft("");
    setTextMode(false);
  };

  if (!asset) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <StatusBar hidden />
      <View style={{ flex: 1, backgroundColor: "#000" }}>

        {/* Full-screen media */}
        {isVideo ? (
          <Video
            source={{ uri: asset.uri }}
            style={{ position: "absolute", width: SW, height: SH }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={!textMode}
            isLooping
          />
        ) : (
          <Image
            source={{ uri: asset.uri }}
            style={{ position: "absolute", width: SW, height: SH }}
            resizeMode="cover"
          />
        )}

        {/* Gradient overlay at bottom for controls */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 180,
            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
            backgroundColor: "transparent",
          }}
          pointerEvents="none"
        />

        {/* Text overlay on image */}
        {overlayText !== "" && !textMode && (
          <Pressable
            onPress={openTextMode}
            style={{
              position: "absolute",
              left: 32,
              right: 32,
              top: SH * 0.38,
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.45)",
                borderRadius: 10,
                paddingHorizontal: 18,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: textColor, fontSize: 26, fontWeight: "700", textAlign: "center", lineHeight: 34 }}>
                {overlayText}
              </Text>
            </View>
          </Pressable>
        )}

        {/* ── Top bar ── */}
        {!textMode && (
          <View
            style={{
              position: "absolute",
              top: 56,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              zIndex: 30,
            }}
          >
            {/* Close */}
            <Pressable
              onPress={onCancel}
              hitSlop={12}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={22} color="#fff" />
            </Pressable>

            {/* Aa — text tool */}
            <Pressable
              onPress={openTextMode}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(0,0,0,0.5)",
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.5 }}>Aa</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Text</Text>
            </Pressable>
          </View>
        )}

        {/* ── Right toolbar ── */}
        {!textMode && (
          <View
            style={{
              position: "absolute",
              right: 14,
              top: SH * 0.22,
              gap: 18,
              alignItems: "center",
              zIndex: 30,
            }}
          >
            {[
              { icon: <Star size={22} color="#fff" />, label: "Stickers" },
              { icon: <Pencil size={22} color="#fff" />, label: "Draw" },
              { icon: <Download size={22} color="#fff" />, label: "Save" },
            ].map(({ icon, label }) => (
              <View key={label} style={{ alignItems: "center", gap: 4, opacity: 0.6 }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {icon}
                </View>
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "500" }}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Text editing overlay ── */}
        {textMode && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
              zIndex: 50,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 32,
            }}
          >
            <TextInput
              autoFocus
              value={overlayDraft}
              onChangeText={setOverlayDraft}
              placeholder="Type something..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={{
                color: textColor,
                fontSize: 28,
                fontWeight: "700",
                textAlign: "center",
                width: "100%",
                minHeight: 60,
              }}
              multiline
              blurOnSubmit={false}
            />

            {/* Color picker row */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
              {TOOL_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setTextColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: c,
                    borderWidth: textColor === c ? 3 : 1.5,
                    borderColor: textColor === c ? "#fff" : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 16, marginTop: 28 }}>
              <Pressable
                onPress={cancelText}
                style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmText}
                style={{ paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, backgroundColor: "#fff" }}
              >
                <Text style={{ color: "#000", fontWeight: "700" }}>Done</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Bottom bar — caption + publish ── */}
        {!textMode && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30 }}
          >
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: Platform.OS === "ios" ? 44 : 28,
                backgroundColor: "rgba(0,0,0,0.5)",
                gap: 14,
              }}
            >
              {/* Caption input */}
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={{
                  color: "#fff",
                  fontSize: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255,255,255,0.2)",
                  paddingVertical: 8,
                }}
                returnKeyType="done"
              />

              {/* Publish button */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <Pressable
                  onPress={handlePublish}
                  disabled={publishing}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    backgroundColor: publishing ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
                    borderWidth: 1.5,
                    borderColor: "rgba(255,255,255,0.6)",
                    borderRadius: 32,
                    paddingHorizontal: 24,
                    paddingVertical: 13,
                  }}
                >
                  {publishing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                          {"★"}
                        </Text>
                      </View>
                      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Your story</Text>
                      <ArrowRight size={18} color="#fff" />
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}
