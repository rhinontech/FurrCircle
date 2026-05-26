import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Camera, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useState } from "react";

export default function ComposeScreen() {
  const router = useRouter();
  const tk = useTokens();
  const [caption, setCaption] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="New Post" right={
        <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: tk.card }]}>
          <X size={20} color={tk.text} />
        </TouchableOpacity>
      } showBack={false} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <TouchableOpacity onPress={pickPhoto} style={[styles.photoArea, { borderColor: tk.border }]} activeOpacity={0.8}>
          {photo
            ? <Image source={{ uri: photo }} style={styles.previewImg} resizeMode="cover" />
            : <>
              <Camera size={40} color={tk.textMuted} />
              <Text style={[styles.photoHint, { color: tk.textMuted }]}>Tap to add a photo</Text>
            </>
          }
        </TouchableOpacity>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={4}
          placeholder="Write a caption for Moona…"
          placeholderTextColor={tk.textMuted}
          style={[styles.captionInput, { backgroundColor: tk.inputBg, color: tk.text }]}
        />
        <TouchableOpacity onPress={() => router.back()} style={styles.postBtn} activeOpacity={0.85}>
          <Text style={styles.postBtnText}>Post</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  photoArea: { height: 280, borderRadius: 24, borderWidth: 2, borderColor: "rgba(26,26,46,0.15)", borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginVertical: 16, overflow: "hidden" },
  previewImg: { width: "100%", height: "100%" },
  photoHint: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.foreground + "88", marginTop: 8 },
  captionInput: { borderRadius: 16, padding: 16, fontSize: 15, fontFamily: "Inter_400Regular", height: 120, textAlignVertical: "top" },
  postBtn: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  postBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
