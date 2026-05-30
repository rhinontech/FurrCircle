import React, { useState } from "react";
import {
  View, Text, Image, Modal, StyleSheet, Dimensions,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from "react-native";
import { X, Check } from "lucide-react-native";
import { useTokens } from "../lib/theme-store";
import { colors } from "../lib/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface StoryEditorProps {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onSave: (overlayText: string, caption: string) => void;
}

export function StoryEditor({ visible, imageUri, onCancel, onSave }: StoryEditorProps) {
  const tk = useTokens();
  const [overlayText, setOverlayText] = useState("");
  const [caption, setCaption] = useState("");

  if (!visible || !imageUri) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Background Image Preview */}
        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />

        {/* Top Controls */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onCancel} style={styles.iconBtn}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Story</Text>
          <TouchableOpacity
            onPress={() => {
              onSave(overlayText, caption);
              setOverlayText("");
              setCaption("");
            }}
            style={[styles.iconBtn, { backgroundColor: colors.coral }]}
          >
            <Check size={24} color="#fff" />
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
          />
        </View> */}

        {/* Bottom Caption Input */}
        <View style={styles.bottomBar}>
          <View style={styles.captionContainer}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={styles.captionInput}
            />
          </View>
        </View>
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
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 20,
    left: 16,
    right: 16,
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
});
