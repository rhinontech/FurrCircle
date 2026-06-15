import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera } from "../src/components/ui/icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { ImageCropper } from "../src/components/ImageCropper";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { circleApi } from "../services/community/circleApi";
import { userApi } from "../services/user/userApi";
import * as ImagePicker from "expo-image-picker";

const CATEGORY_PRESETS = [
  { id: "dogs", label: "Dogs" },
  { id: "cats", label: "Cats" },
  { id: "rescue", label: "Rescue" },
  { id: "health", label: "Health" },
  { id: "training", label: "Training" },
  { id: "general", label: "General" },
];

export default function EditCircle() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tk = useTokens();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [coverUri, setCoverUri] = useState<string | null>(null);
  // Local cropped image awaiting upload (null when the cover is unchanged).
  const [newLocalCover, setNewLocalCover] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<{ uri: string; width: number; height: number } | null>(null);

  const load = useCallback(async () => {
    try {
      setFetching(true);
      const circle = await circleApi.getCircleById(id);
      if (!circle.isAdmin) {
        Alert.alert("Not allowed", "Only the circle creator can edit this circle.");
        router.back();
        return;
      }
      setName(circle.name || "");
      setDescription(circle.description || "");
      setCategory(circle.category || "general");
      setCoverUri(circle.coverImage || null);
    } catch {
      Alert.alert("Error", "Failed to load circle.");
      router.back();
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission", "Gallery access required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 1 });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      setCropSource({ uri: asset.uri, width: asset.width || 0, height: asset.height || 0 });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Required", "Please enter a circle name."); return; }
    setSaving(true);
    try {
      const payload: { name: string; description: string; category: string; coverImage?: string } = {
        name: name.trim(),
        description: description.trim(),
        category,
      };
      // Only upload + send a cover if the user chose a new one.
      if (newLocalCover) {
        const uploadRes = await userApi.uploadImage(newLocalCover, "circles");
        payload.coverImage = uploadRes.url;
      }
      await circleApi.updateCircle(id, payload);
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <PageContainer>
        <View style={{ flex: 1, backgroundColor: tk.bg }}>
          <ScreenHeader title="Edit Circle" />
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <View style={{ flex: 1, backgroundColor: tk.bg }}>
        <ScreenHeader title="Edit Circle" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: tk.textMuted }]}>Cover Image</Text>
            <TouchableOpacity onPress={pickCover} style={[styles.coverPicker, { backgroundColor: tk.inputBg, borderColor: tk.border }]} activeOpacity={0.8}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={{ width: "100%", height: "100%", borderRadius: 12 }} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: "center", gap: 6 }}>
                  <Camera size={24} color={tk.textMuted} />
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: tk.textMuted }}>Tap to change cover photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.label, { color: tk.textMuted }]}>Name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Beagle Buddies" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border }]} />

            <Text style={[styles.label, { color: tk.textMuted }]}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="What is this circle about?" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border, height: 80, textAlignVertical: "top" }]} multiline />

            <Text style={[styles.label, { color: tk.textMuted }]}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORY_PRESETS.map((cat) => (
                <TouchableOpacity key={cat.id} onPress={() => setCategory(cat.id)} style={[styles.categoryBtn, { backgroundColor: category === cat.id ? tk.text : tk.glassChip }]} activeOpacity={0.8}>
                  <Text style={[styles.categoryBtnText, { color: category === cat.id ? tk.bg : tk.textMuted }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <ImageCropper
        visible={!!cropSource}
        imageUri={cropSource?.uri || null}
        imageWidth={cropSource?.width || 0}
        imageHeight={cropSource?.height || 0}
        aspect={16 / 9}
        onCancel={() => setCropSource(null)}
        onCropped={(uri) => { setCoverUri(uri); setNewLocalCover(uri); setCropSource(null); }}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 13, marginBottom: 8, marginTop: 16 },
  coverPicker: { width: "100%", aspectRatio: 16 / 9, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  categoryBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  saveBtn: { marginTop: 28, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: colors.white },
});
