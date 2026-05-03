import React, { useState } from "react";
import { View, Modal, Pressable, ActivityIndicator, Alert } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { Camera, ImagePlus, X } from "@/components/ui/IconCompat";
import { useTheme } from "@/contexts/ThemeContext";
import { captureAndUploadStory, pickAndUploadMedia } from "@/services/uploadApi";
import { userCommunityApi } from "@/services/users/communityApi";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StoryCreateSheet({ visible, onClose, onSuccess }: Props) {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);

  const handleSource = async (source: "camera" | "library") => {
    setUploading(true);
    try {
      const result =
        source === "camera"
          ? await captureAndUploadStory("stories")
          : await pickAndUploadMedia("stories");

      if (!result) {
        setUploading(false);
        return;
      }

      await userCommunityApi.createStory({ mediaUrl: result.url, mediaType: result.mediaType });
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert("Upload failed", error.message || "Could not upload story. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.bgCard,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          onPress={() => {}}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Add to Your Story</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {uploading ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={colors.brand} />
              <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14 }}>Uploading story...</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <Pressable
                onPress={() => handleSource("camera")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  padding: 18,
                  borderRadius: 16,
                  backgroundColor: colors.bgSubtle,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand + "22", alignItems: "center", justifyContent: "center" }}>
                  <Camera size={22} color={colors.brand} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textPrimary }}>Camera</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Take a photo or video</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => handleSource("library")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  padding: 18,
                  borderRadius: 16,
                  backgroundColor: colors.bgSubtle,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand + "22", alignItems: "center", justifyContent: "center" }}>
                  <ImagePlus size={22} color={colors.brand} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textPrimary }}>Photo & Video Library</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Choose from your gallery</Text>
                </View>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
