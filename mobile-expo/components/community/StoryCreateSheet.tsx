import React, { useState } from "react";
import { View, Modal, Pressable, Alert, Platform } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { Camera, ImagePlus, X } from "@/components/ui/IconCompat";
import { useTheme } from "@/contexts/ThemeContext";
import { captureStoryCamera, pickMedia, uploadImage } from "@/services/uploadApi";
import { userCommunityApi } from "@/services/users/communityApi";
import StoryEditor from "./StoryEditor";
import type { ImagePickerAsset } from "expo-image-picker";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StoryCreateSheet({ visible, onClose, onSuccess }: Props) {
  const { colors } = useTheme();
  const [picking, setPicking] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ImagePickerAsset | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);

  const handleSource = async (source: "camera" | "library") => {
    setPicking(true);
    
    // 1. Close the chooser modal first to clear the native stack
    onClose();
    
    // 2. Wait for chooser dismissal to complete (iOS needs time to settle)
    await new Promise(resolve => setTimeout(resolve, Platform.OS === 'ios' ? 600 : 100));

    try {
      // 3. Open media picker from the 'base' app state (no nested modals)
      const asset = source === "camera"
        ? await captureStoryCamera()
        : await pickMedia();

      if (!asset) {
        setPicking(false);
        return;
      }

      setSelectedAsset(asset);
      
      // 4. Delay to ensure picker/camera dismissal is finished before presenting editor
      setTimeout(() => {
        setEditorVisible(true);
      }, Platform.OS === 'ios' ? 400 : 100);

    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not access media.");
    } finally {
      setPicking(false);
    }
  };

  const handleEditorPublish = async (caption?: string) => {
    if (!selectedAsset) return;
    const mediaType = (selectedAsset.type === "video" || selectedAsset.mimeType?.startsWith("video/")) ? "video" : "image";
    const url = await uploadImage(selectedAsset, "stories");
    await userCommunityApi.createStory({ mediaUrl: url, mediaType, caption });
    setEditorVisible(false);
    setSelectedAsset(null);
    onSuccess();
  };

  const handleEditorCancel = () => {
    setEditorVisible(false);
    setSelectedAsset(null);
  };

  return (
    <>
      {/* Chooser bottom sheet */}
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
            onPress={() => { }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Add to Your Story</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              <Pressable
                onPress={() => handleSource("camera")}
                disabled={picking}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  padding: 18,
                  borderRadius: 16,
                  backgroundColor: colors.bgSubtle,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: picking ? 0.6 : 1,
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
                disabled={picking}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  padding: 18,
                  borderRadius: 16,
                  backgroundColor: colors.bgSubtle,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: picking ? 0.6 : 1,
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
          </Pressable>
        </Pressable>
        
      </Modal>

      {/* Full-screen story editor — shown after media is selected */}
      <StoryEditor
          visible={editorVisible}
          asset={selectedAsset}
          onCancel={handleEditorCancel}
          onPublish={handleEditorPublish}
        />
    </>
  );
}
