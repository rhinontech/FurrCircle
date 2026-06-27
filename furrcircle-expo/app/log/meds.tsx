import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { Camera } from "../../src/components/ui/icons";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "../../services/user/userApi";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useState } from "react";
import { healthApi } from "../../services/health/healthApi";

export default function LogMedsScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const tk = useTokens();
  const [med, setMed] = useState("");
  const [dose, setDose] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!med.trim()) {
        Alert.alert("Error", "Please enter medication name.");
        return;
    }
    if (!petId) {
        Alert.alert("Error", "No pet selected.");
        return;
    }
    setLoading(true);
    try {
        let uploadedImageUrl = undefined;
        if (photo?.startsWith('file://') || (photo && !photo.startsWith('http'))) {
          const result = await uploadImage(photo, 'medications');
          uploadedImageUrl = result?.url ?? result;
        }

        await healthApi.addMedication(petId, {
            name: med.trim(),
            dosage: dose.trim() || undefined,
            notes: notes.trim() || undefined,
            imageUrl: uploadedImageUrl,
            startDate: new Date().toISOString().slice(0, 10),
        });
        Alert.alert("Success", "Medication logged successfully.");
        router.back();
    } catch (err) {
        console.error("Failed to log medication:", err);
        Alert.alert("Error", "Failed to log medication.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Log Medication" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Text style={[styles.label, { color: tk.textMuted }]}>Medication name</Text>
        <TextInput value={med} onChangeText={setMed} placeholder="e.g. Nexgard" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <Text style={[styles.label, { color: tk.textMuted }]}>Dose</Text>
        <TextInput value={dose} onChangeText={setDose} placeholder="e.g. 1 tablet" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <Text style={[styles.label, { color: tk.textMuted }]}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={4} placeholder="Any observations…" placeholderTextColor={tk.textMuted} style={[styles.input, styles.textarea, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />

        <Text style={[styles.label, { color: tk.textMuted }]}>Medication Photo</Text>
        <TouchableOpacity onPress={pickPhoto} style={[styles.photoBtn, { borderColor: tk.border, backgroundColor: tk.card }]} activeOpacity={0.8}>
          {photo ? (
            <>
              <Image source={{ uri: photo }} style={styles.photoPreview} />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", gap: 8 }]}>
                <Camera size={32} color="#FFFFFF" />
                <Text style={[styles.photoBtnText, { color: "#FFFFFF" }]}>Change photo</Text>
              </View>
            </>
          ) : (
            <>
              <Camera size={32} color={tk.textMuted} />
              <Text style={[styles.photoBtnText, { color: tk.textMuted }]}>Add photo</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
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
