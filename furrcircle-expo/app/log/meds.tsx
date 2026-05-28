import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
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
  const [loading, setLoading] = useState(false);

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
        await healthApi.addMedication(petId, {
            name: med.trim(),
            dosage: dose.trim() || undefined,
            notes: notes.trim() || undefined,
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
  saveBtn: { marginTop: 28, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
