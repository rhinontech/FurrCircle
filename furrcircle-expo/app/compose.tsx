import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Image as ImageIcon, Hash, X, Check } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { feedApi } from "../services/community/feedApi";
import { userApi } from "../services/user/userApi";

const CATEGORIES = ["General", "Health", "Adoption", "Training", "Nutrition", "Lost & Found"] as const;

export default function ComposeScreen() {
  const router = useRouter();
  const tk = useTokens();
  const [category, setCategory] = useState<string>("General");
  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow gallery access.");
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
        if (isVideo) {
          const duration = asset.duration || 0;
          const durationInSeconds = duration > 1000 ? duration / 1000 : duration;
          if (durationInSeconds > 60) {
            Alert.alert("Video too long", "Please select a video shorter than 60 seconds.");
            return;
          }
          setMediaType("video");
        } else {
          setMediaType("image");
        }
        setImageUri(asset.uri);
      }
    } catch (err: any) {
      console.error("pickPhoto error:", err);
    }
  };

  const handleShare = async () => {
    if (!caption.trim()) { Alert.alert("Required", "Please write something before posting."); return; }
    setLoading(true);
    try {
      let imageUrl: string | undefined;
      if (imageUri) {
        const uploadRes = await userApi.uploadImage(imageUri, "posts");
        imageUrl = uploadRes.url;
      }
      await feedApi.createPost({
        content: caption.trim(),
        imageUrl,
        category: category !== "General" ? category : undefined,
      });
      router.navigate({
        pathname: "/(tabs)",
        params: { refresh: String(Date.now()) },
      });
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: tk.card }]}>
            <X size={20} color={tk.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tk.text }]}>New post</Text>
          <TouchableOpacity onPress={handleShare} disabled={loading} style={[styles.shareBtn, loading && { opacity: 0.6 }]}>
            {loading ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.shareBtnText}>Share</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {/* Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c ? styles.chipActive : { backgroundColor: tk.card }]}>
                <Text style={[styles.chipText, category === c ? { color: colors.white } : { color: tk.textMuted }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Photo */}
          <TouchableOpacity onPress={pickPhoto} style={[styles.photoZone, { backgroundColor: tk.card, borderColor: tk.border }]} activeOpacity={0.8}>
            {imageUri ? (
              <View style={{ position: "relative", width: "100%", height: 240 }}>
                {mediaType === "video" ? (
                  <Video
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                    resizeMode={ResizeMode.COVER}
                    isMuted={true}
                    shouldPlay
                    isLooping
                  />
                ) : (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                )}
                <TouchableOpacity onPress={(e) => { (e as any).stopPropagation?.(); setImageUri(null); setMediaType(null); }} style={styles.removeImg}>
                  <X size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: "center", gap: 8 }}>
                <ImageIcon size={32} color={tk.textMuted} />
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: tk.textMuted }}>Tap to add a photo or video</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Caption */}
          <TextInput
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={5}
            placeholder="Tell the circle what's happening…"
            placeholderTextColor={tk.textMuted}
            style={[styles.captionInput, { backgroundColor: tk.card, color: tk.text, borderColor: tk.border }]}
          />

          {/* Tags */}
          <View style={[styles.tagRow, { backgroundColor: tk.card, borderColor: tk.border }]}>
            <Hash size={16} color={tk.textMuted} />
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="Add tags (comma-separated)"
              placeholderTextColor={tk.textMuted}
              style={{ flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: tk.text, paddingVertical: 8 }}
              autoCapitalize="none"
            />
          </View>
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 24 : 40, paddingBottom: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  shareBtn: { backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, minWidth: 70, alignItems: "center", justifyContent: "center" },
  shareBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
  chipsScroll: { flexGrow: 0, marginBottom: 16 },
  chipsContent: { gap: 8, paddingBottom: 4 },
  chip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.foreground },
  chipText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  photoZone: { borderRadius: 20, borderWidth: 1.5, borderStyle: "dashed", minHeight: 180, alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden" },
  previewImage: { width: "100%", height: 240 },
  removeImg: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12, width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  captionInput: { borderRadius: 16, borderWidth: 1, padding: 16, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 120, textAlignVertical: "top", marginBottom: 12 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, marginBottom: 12 },
});
