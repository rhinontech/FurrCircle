import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useState } from "react";

export default function LogVaccineScreen() {
  const router = useRouter();
  const tk = useTokens();
  const [vaccine, setVaccine] = useState("");
  const [clinic, setClinic] = useState("");
  const [nextDate, setNextDate] = useState("");

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Log Vaccine" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Text style={[styles.label, { color: tk.textMuted }]}>Vaccine name</Text>
        <TextInput value={vaccine} onChangeText={setVaccine} placeholder="e.g. DHPP" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <Text style={[styles.label, { color: tk.textMuted }]}>Clinic / Vet</Text>
        <TextInput value={clinic} onChangeText={setClinic} placeholder="e.g. Furr Care Clinic" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <Text style={[styles.label, { color: tk.textMuted }]}>Next due date</Text>
        <TextInput value={nextDate} onChangeText={setNextDate} placeholder="e.g. Nov 2027" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <TouchableOpacity onPress={() => router.back()} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save</Text>
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
