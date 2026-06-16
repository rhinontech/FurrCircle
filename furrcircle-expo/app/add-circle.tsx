import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert,
  Platform, Image, KeyboardAvoidingView, ActivityIndicator, Keyboard, Pressable
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Camera } from "../src/components/ui/icons";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { circleApi } from "../services/community/circleApi";
import { userApi } from "../services/user/userApi";
import { colors } from "../src/lib/theme";
import { useTokens, useThemeStore } from "../src/lib/theme-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageCropper } from "../src/components/ImageCropper";

const CATEGORY_PRESETS = [
  { id: "dogs", label: "Dogs" },
  { id: "cats", label: "Cats" },
  { id: "rescue", label: "Rescue" },
  { id: "health", label: "Health" },
  { id: "training", label: "Training" },
  { id: "general", label: "General" },
];

export default function AddCircleScreen() {
  const router = useRouter();
  const tk = useTokens();
  const insets = useSafeAreaInsets();
  const dark = useThemeStore((s) => s.dark);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<{ uri: string; width: number; height: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Gallery access is required to upload a cover image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 1,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      setCropSource({
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
      });
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a circle name.");
      return;
    }
    setSaving(true);
    try {
      let coverImage: string | undefined;
      if (coverUri) {
        const uploadRes = await userApi.uploadImage(coverUri, "circles");
        coverImage = uploadRes.url;
      }
      await circleApi.createCircle({
        name: name.trim(),
        description: description.trim(),
        category,
        coverImage,
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Error creating circle", err?.response?.data?.message || err.message || "Failed to create circle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { backgroundColor: tk.bg }]}>
          <ScreenHeader title="Create a Circle" />
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingBottom: 60 + (insets.bottom > 0 ? insets.bottom : 0),
              paddingHorizontal: 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable onPress={Keyboard.dismiss}>
              {/* Cover image picker */}
              <Text style={[styles.label, { color: tk.textMuted }]}>Cover Image</Text>
              <TouchableOpacity
                onPress={pickCover}
                style={[styles.photoBtn, { borderColor: tk.border, backgroundColor: tk.card }]}
                activeOpacity={0.8}
              >
                {coverUri ? (
                  <>
                    <Image source={{ uri: coverUri }} style={styles.photoPreview} resizeMode="cover" />
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", gap: 8 }]}>
                      <Camera size={32} color="#FFFFFF" />
                      <Text style={[styles.photoBtnText, { color: "#FFFFFF" }]}>Change Cover Photo</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Camera size={32} color={tk.textMuted} />
                    <Text style={[styles.photoBtnText, { color: tk.textMuted }]}>Tap to add cover photo (optional)</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Circle Name */}
              <Text style={[styles.label, { color: tk.textMuted }]}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Beagle Buddies"
                placeholderTextColor={tk.textMuted}
                style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]}
              />

              {/* Description */}
              <Text style={[styles.label, { color: tk.textMuted }]}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What is this circle about?"
                placeholderTextColor={tk.textMuted}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]}
              />

              {/* Category selector */}
              <Text style={[styles.label, { color: tk.textMuted }]}>Category</Text>
              <View style={styles.tagRow}>
                {CATEGORY_PRESETS.map((cat) => {
                  const isActive = category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategory(cat.id)}
                      style={[styles.tag, { backgroundColor: isActive ? tk.text : tk.card }]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tagText, { color: isActive ? tk.bg : tk.textMuted }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleCreate}
                disabled={saving}
                style={styles.saveBtn}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Create Circle</Text>
                )}
              </TouchableOpacity>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <ImageCropper
        visible={!!cropSource}
        imageUri={cropSource?.uri || null}
        imageWidth={cropSource?.width || 0}
        imageHeight={cropSource?.height || 0}
        aspect={16 / 9}
        onCancel={() => setCropSource(null)}
        onCropped={(uri) => {
          setCoverUri(uri);
          setCropSource(null);
        }}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  photoBtn: {
    height: 140,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    gap: 8,
    overflow: "hidden",
  },
  photoPreview: { position: "absolute", width: "100%", height: "100%", borderRadius: 22 },
  photoBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  label: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  tagText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  saveBtn: {
    marginTop: 28,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
