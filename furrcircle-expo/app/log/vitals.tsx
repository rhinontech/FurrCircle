import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useState } from "react";

export default function LogVitalsScreen() {
  const router = useRouter();
  const tk = useTokens();
  const [weight, setWeight] = useState("");
  const [temp, setTemp] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Log Vitals" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="e.g. 14.2" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text }]} />
        <Text style={styles.label}>Temperature (°C)</Text>
        <TextInput value={temp} onChangeText={setTemp} keyboardType="decimal-pad" placeholder="e.g. 38.5" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text }]} />
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
