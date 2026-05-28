import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useState } from "react";
import { healthApi } from "../../services/health/healthApi";

export default function LogVaccineScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const tk = useTokens();
  const [vaccine, setVaccine] = useState("");
  const [dateGiven, setDateGiven] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!vaccine.trim()) {
        Alert.alert("Error", "Please enter vaccine name.");
        return;
    }
    if (!petId) {
        Alert.alert("Error", "No pet selected.");
        return;
    }
    setLoading(true);
    try {
        await healthApi.addVaccine(petId, {
            name: vaccine,
            dateAdministered: dateGiven || new Date().toISOString().slice(0, 10),
            nextDueDate: nextDate || undefined,
            status: "done"
        });
        Alert.alert("Success", "Vaccine logged successfully.");
        router.back();
    } catch (err) {
        console.error("Failed to add vaccine:", err);
        Alert.alert("Error", "Failed to log vaccine.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Log Vaccine" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Text style={[styles.label, { color: tk.textMuted }]}>Vaccine name</Text>
        <TextInput value={vaccine} onChangeText={setVaccine} placeholder="e.g. DHPP" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <Text style={[styles.label, { color: tk.textMuted }]}>Date Given</Text>
        <TextInput value={dateGiven} onChangeText={setDateGiven} placeholder="YYYY-MM-DD or leave blank for today" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <Text style={[styles.label, { color: tk.textMuted }]}>Next due date</Text>
        <TextInput value={nextDate} onChangeText={setNextDate} placeholder="YYYY-MM-DD (Optional)" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
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
  saveBtn: { marginTop: 28, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
