import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useState } from "react";

export default function LogMedsScreen() {
  const router = useRouter();
  const tk = useTokens();
  const [med, setMed] = useState("");
  const [dose, setDose] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Log Medication" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Text style={styles.label}>Medication name</Text>
        <TextInput value={med} onChangeText={setMed} placeholder="e.g. Nexgard" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text }]} />
        <Text style={styles.label}>Dose</Text>
        <TextInput value={dose} onChangeText={setDose} placeholder="e.g. 1 tablet" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text }]} />
        <Text style={styles.label}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={4} placeholder="Any observations…" placeholderTextColor={colors.foreground + "66"} style={[styles.input, styles.textarea]} />
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
  textarea: { height: 100, textAlignVertical: "top" },
  saveBtn: { marginTop: 28, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
