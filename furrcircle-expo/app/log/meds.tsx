import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { Camera } from "../../src/components/ui/icons";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "../../services/user/userApi";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useLanguage } from "../../src/lib/language-context";
import { useState } from "react";
import { healthApi } from "../../services/health/healthApi";

export default function LogMedsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { petId, editId, name: initName, dosage: initDosage, notes: initNotes, photo: initPhoto } = useLocalSearchParams<{
    petId: string;
    editId?: string;
    name?: string;
    dosage?: string;
    notes?: string;
    photo?: string;
  }>();
  const tk = useTokens();
  const [med, setMed] = useState(initName || "");
  const [dose, setDose] = useState(initDosage || "");
  const [notes, setNotes] = useState(initNotes || "");
  const [photo, setPhoto] = useState<string | undefined>(initPhoto || undefined);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!med.trim()) {
      Alert.alert(t("error"), t("pleaseEnterMedicationName"));
      return;
    }
    if (!petId) {
      Alert.alert(t("error"), t("noPetSelected"));
      return;
    }
    setLoading(true);
    try {
      let uploadedImageUrl = photo;
      if (photo?.startsWith('file://')) {
        const result = await uploadImage(photo, 'medications');
        uploadedImageUrl = result?.url ?? result;
      }

      if (editId) {
        await healthApi.updateMedication(petId, editId, {
          name: med.trim(),
          dosage: dose.trim() || null,
          notes: notes.trim() || null,
          imageUrl: uploadedImageUrl || null,
        });
        Alert.alert(t("success"), t("medicationUpdatedSuccessfully"));
      } else {
        await healthApi.addMedication(petId, {
          name: med.trim(),
          dosage: dose.trim() || undefined,
          notes: notes.trim() || undefined,
          imageUrl: uploadedImageUrl,
          startDate: new Date().toISOString().slice(0, 10),
        });
        Alert.alert(t("success"), t("medicationLoggedSuccessfully"));
      }
      router.back();
    } catch (err) {
      console.error("Failed to save medication:", err);
      Alert.alert(t("error"), t("failedToSaveMedication"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer noAmbient={true}>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title={editId ? t("editMedicationHeaderTitle") : t("logMedicationHeaderTitle")} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
          <Text style={[styles.label, { color: tk.textMuted }]}>{t("medicationNameLabel")}</Text>
          <TextInput value={med} onChangeText={setMed} placeholder={t("medicationNamePlaceholder")} placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
          <Text style={[styles.label, { color: tk.textMuted }]}>{t("medicationDoseLabel")}</Text>
          <TextInput value={dose} onChangeText={setDose} placeholder={t("medicationDosePlaceholder")} placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
          <Text style={[styles.label, { color: tk.textMuted }]}>{t("medicationNotesLabel")}</Text>
          <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={4} placeholder={t("medicationNotesPlaceholder")} placeholderTextColor={tk.textMuted} style={[styles.input, styles.textarea, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

          <Text style={[styles.label, { color: tk.textMuted }]}>{t("medicationPhotoLabel")}</Text>
          <TouchableOpacity onPress={pickPhoto} style={[styles.photoBtn, { borderColor: tk.border, backgroundColor: tk.card }]} activeOpacity={0.8}>
            {photo ? (
              <>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", gap: 8 }]}>
                  <Camera size={32} color="#FFFFFF" />
                  <Text style={[styles.photoBtnText, { color: "#FFFFFF" }]}>{t("changePhoto")}</Text>
                </View>
              </>
            ) : (
              <>
                <Camera size={32} color={tk.textMuted} />
                <Text style={[styles.photoBtnText, { color: tk.textMuted }]}>{t("addPhoto")}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t("save")}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.foreground + "99", marginTop: 20, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground },
  textarea: { height: 100, textAlignVertical: "top" },
  photoBtn: { height: 140, borderRadius: 24, borderWidth: 2, borderColor: "rgba(26,26,46,0.15)", borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginTop: 8, gap: 8, overflow: "hidden" },
  photoPreview: { position: "absolute", width: "100%", height: "100%", borderRadius: 22 },
  photoBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.foreground + "88" },
  saveBtn: { marginTop: 28, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
