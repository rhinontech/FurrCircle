import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image as ImageIcon, Hash, X, Check } from "../src/components/ui/icons";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useLanguage } from "../src/lib/language-context";
import { feedApi } from "../services/community/feedApi";
import { userApi } from "../services/user/userApi";
import { useCameraStore } from "../src/lib/camera-store";

const CATEGORIES = ["General", "Health", "Adoption", "Training", "Nutrition", "Lost & Found"] as const;

export default function ComposeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const tk = useTokens();
  const insets = useSafeAreaInsets();
  const { editPostId, prefilledCategory, prefilledCaption, prefilledImageUrl } = useLocalSearchParams<{
    editPostId?: string;
    prefilledCategory?: string;
    prefilledCaption?: string;
    prefilledImageUrl?: string;
  }>();

  const [category, setCategory] = useState<string>(prefilledCategory || "General");
  const [caption, setCaption] = useState(prefilledCaption || "");
  const [imageUri, setImageUri] = useState<string | null>(prefilledImageUrl || null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(
    prefilledImageUrl
      ? (prefilledImageUrl.match(/\.(mp4|mov|quicktime|3gp|mpeg|avi|wmv|flv|mkv|webm)(\?|$)/i) ? "video" : "image")
      : null
  );
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const { capturedUri, capturedType, setCapturedMedia } = useCameraStore();

  const getCategoryLabel = (cat: typeof CATEGORIES[number]) => {
    switch (cat) {
      case "General": return t("categoryGeneral");
      case "Health": return t("categoryHealth");
      case "Adoption": return t("categoryAdoption");
      case "Training": return t("categoryTraining");
      case "Nutrition": return t("categoryNutrition");
      case "Lost & Found": return t("categoryLostFound");
      default: return cat;
    }
  };

  useEffect(() => {
    if (capturedUri) {
      setImageUri(capturedUri);
      setMediaType(capturedType || "image");
      setCapturedMedia(null, null);
    }
  }, [capturedUri]);

  useEffect(() => {
    if (imageUri && mediaType === "image") {
      Image.getSize(imageUri, (w, h) => {
        setAspectRatio(w / h);
      }, (err) => {
        console.warn("Failed to get image size for preview:", err);
      });
    } else if (!imageUri) {
      setAspectRatio(null);
    }
  }, [imageUri, mediaType]);

  const pickPhoto = () => {
    Alert.alert(
      t("addPhotoOrVideo"),
      t("chooseMediaSourcePost"),
      [
        {
          text: t("openCamera"),
          onPress: () => {
            router.push({
              pathname: "/camera",
              params: { origin: "post" },
            });
          },
        },
        {
          text: t("chooseFromGallery"),
          onPress: () => handlePickPhotoSource("gallery"),
        },
        {
          text: t("cancel"),
          style: "cancel",
        },
      ]
    );
  };

  const handlePickPhotoSource = async (source: "camera" | "gallery") => {
    if (source === "gallery") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("permissionRequired"), t("allowGalleryAccessPost"));
        return;
      }
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("permissionRequired"), t("allowCameraAccessPost"));
        return;
      }
    }

    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
      };

      const result = source === "gallery"
        ? await ImagePicker.launchImageLibraryAsync(options)
        : await ImagePicker.launchCameraAsync(options);

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
        if (isVideo) {
          const duration = asset.duration || 0;
          const durationInSeconds = duration > 1000 ? duration / 1000 : duration;
          if (durationInSeconds > 60) {
            Alert.alert(t("videoTooLong"), t("videoTooLongPost"));
            return;
          }
        }

        router.push({
          pathname: "/camera",
          params: {
            origin: "post",
            uri: asset.uri,
            type: isVideo ? "video" : "image"
          },
        });
      }
    } catch (err: any) {
      console.error("pickPhoto error:", err);
    }
  };

  const handleShare = async () => {
    if (!caption.trim()) { Alert.alert(t("requiredTitle"), t("pleaseWriteSomething")); return; }
    setLoading(true);
    try {
      let imageUrl: string | undefined = imageUri || undefined;
      if (imageUri && (imageUri.startsWith("file://") || imageUri.startsWith("content://") || !imageUri.startsWith("http"))) {
        const uploadRes = await userApi.uploadImage(imageUri, "posts");
        imageUrl = uploadRes.url;
      }

      if (editPostId) {
        await feedApi.updatePost(editPostId, {
          content: caption.trim(),
          imageUrl: imageUrl || null,
          category: category !== "General" ? category : "General",
        });
        Alert.alert(t("success"), t("postUpdatedSuccess"));
      } else {
        await feedApi.createPost({
          content: caption.trim(),
          imageUrl,
          category: category !== "General" ? category : undefined,
        });
      }
      router.replace({
        pathname: "/(tabs)",
        params: { refresh: String(Date.now()) },
      });
    } catch (err: any) {
      Alert.alert(t("error"), err?.response?.data?.message || err?.message || t("failedToPost"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer fullWidth={true}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.container, { backgroundColor: tk.bg }]}>
          <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? insets.top + 16 : 40 }]}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: tk.card }]}>
              <X size={20} color={tk.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: tk.text }]}>{editPostId ? t("editPost") : t("newPost")}</Text>
            <TouchableOpacity onPress={handleShare} disabled={loading} style={[styles.shareBtn, loading && { opacity: 0.6 }]}>
              {loading ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.shareBtnText}>{editPostId ? t("updateBtn") : t("shareBtn")}</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            {/* Category chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c ? styles.chipActive : { backgroundColor: tk.card }]}>
                  <Text style={[styles.chipText, category === c ? { color: colors.white } : { color: tk.textMuted }]}>{getCategoryLabel(c)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Photo */}
            <TouchableOpacity onPress={pickPhoto} style={[styles.photoZone, { backgroundColor: tk.card, borderColor: tk.border }]} activeOpacity={0.8}>
              {imageUri ? (
                <View style={{ position: "relative", width: "100%", aspectRatio: aspectRatio || 4/3 }}>
                  {mediaType === "video" ? (
                    <Video
                      source={{ uri: imageUri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode={ResizeMode.CONTAIN}
                      isMuted={true}
                      shouldPlay
                      isLooping
                      onReadyForDisplay={(event) => {
                        if (event?.naturalSize) {
                          setAspectRatio(event.naturalSize.width / event.naturalSize.height);
                        }
                      }}
                    />
                  ) : (
                    <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                  )}
                  <TouchableOpacity onPress={(e) => { (e as any).stopPropagation?.(); setImageUri(null); setMediaType(null); setAspectRatio(null); }} style={styles.removeImg}>
                    <X size={14} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <ImageIcon size={32} color={tk.textMuted} />
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: tk.textMuted }}>{t("tapToAddPhotoVideo")}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Caption */}
            <TextInput
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={5}
              placeholder={t("writeCaptionPlaceholder")}
              placeholderTextColor={tk.textMuted}
              style={[styles.captionInput, { backgroundColor: tk.card, color: tk.text, borderColor: tk.border }]}
            />

            {/* Tags */}
            <View style={[styles.tagRow, { backgroundColor: tk.card, borderColor: tk.border }]}>
              <Hash size={16} color={tk.textMuted} />
              <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder={t("addTagsPlaceholder")}
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
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
