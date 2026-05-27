import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable, TextInput, Alert } from "react-native";
import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { moonaPassport } from "../src/lib/demo-data";
import { FileText, Plus, X, Syringe, AlertCircle, ShieldCheck } from "lucide-react-native";

type RecordType = "vaccine" | "allergy" | "insurance";

const ADD_OPTIONS: { key: RecordType; label: string; icon: any; color: string }[] = [
  { key: "vaccine", label: "Vaccine", icon: Syringe, color: colors.success },
  { key: "allergy", label: "Allergy", icon: AlertCircle, color: colors.coral },
  { key: "insurance", label: "Insurance", icon: ShieldCheck, color: colors.primary },
];

export default function RecordsScreen() {
  const tk = useTokens();
  const { petId } = useLocalSearchParams<{ petId?: string }>();

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RecordType | null>(null);

  // Form fields
  const [vaccineName, setVaccineName] = useState("");
  const [vaccineDate, setVaccineDate] = useState("");
  const [vaccineNext, setVaccineNext] = useState("");
  const [allergyName, setAllergyName] = useState("");
  const [insuranceName, setInsuranceName] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState("");

  const resetForm = () => {
    setSelectedType(null);
    setVaccineName(""); setVaccineDate(""); setVaccineNext("");
    setAllergyName(""); setInsuranceName(""); setInsurancePolicy("");
  };

  const handleClose = () => { setAddSheetOpen(false); resetForm(); };

  const handleSave = () => {
    if (selectedType === "vaccine" && !vaccineName.trim()) {
      Alert.alert("Required", "Please enter a vaccine name."); return;
    }
    if (selectedType === "allergy" && !allergyName.trim()) {
      Alert.alert("Required", "Please enter an allergy."); return;
    }
    if (selectedType === "insurance" && !insuranceName.trim()) {
      Alert.alert("Required", "Please enter the insurance provider."); return;
    }
    // TODO: persist to backend
    Alert.alert("Saved", "Record added successfully.");
    handleClose();
  };

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader
        title="Health Records"
        right={
          <TouchableOpacity onPress={() => setAddSheetOpen(true)} style={styles.addBtn}>
            <Plus size={18} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 16 }}>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Vaccination history</Text>
        {moonaPassport.vaccines.map((v) => (
          <View key={v.name} style={[styles.card, { backgroundColor: tk.card }]}>
            <FileText size={20} color={v.status === "ok" ? colors.success : colors.coral} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: tk.text }]}>{v.name}</Text>
              <Text style={[styles.cardMeta, { color: tk.textMuted }]}>Given: {v.date} · Next: {v.next}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: v.status === "ok" ? "rgba(76,175,80,0.15)" : "rgba(255,107,107,0.15)" }]}>
              <Text style={[styles.badgeText, { color: v.status === "ok" ? colors.success : colors.coral }]}>{v.status === "ok" ? "OK" : "DUE"}</Text>
            </View>
          </View>
        ))}
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Allergies</Text>
        <View style={styles.tagRow}>
          {moonaPassport.allergies.map((a) => (
            <View key={a} style={styles.allergyTag}><Text style={styles.allergyText}>{a}</Text></View>
          ))}
        </View>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Insurance</Text>
        <View style={[styles.infoCard, { backgroundColor: tk.card }]}>
          <Text style={[styles.infoTitle, { color: tk.text }]}>{moonaPassport.insurance.provider}</Text>
          <Text style={[styles.infoMeta, { color: tk.textMuted }]}>Policy: {moonaPassport.insurance.policy}</Text>
          <Text style={[styles.infoMeta, { color: tk.textMuted }]}>{moonaPassport.insurance.valid}</Text>
        </View>
      </ScrollView>
    </View>

    {/* Add Record Modal */}
    <Modal visible={addSheetOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: tk.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />
          <View style={styles.sheetTitleRow}>
            <Text style={[styles.sheetTitle, { color: tk.text }]}>
              {selectedType ? `Add ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}` : "Add Record"}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={20} color={tk.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Type picker */}
          {!selectedType && (
            <View style={{ gap: 10, marginTop: 8 }}>
              {ADD_OPTIONS.map(({ key, label, icon: Icon, color }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedType(key)}
                  style={[styles.optionRow, { backgroundColor: tk.bg }]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIcon, { backgroundColor: color + "22" }]}>
                    <Icon size={18} color={color} />
                  </View>
                  <Text style={[styles.optionLabel, { color: tk.text }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Vaccine form */}
          {selectedType === "vaccine" && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <FormInput label="Vaccine name" value={vaccineName} onChangeText={setVaccineName} placeholder="e.g. DHPP" tk={tk} />
              <FormInput label="Date given" value={vaccineDate} onChangeText={setVaccineDate} placeholder="e.g. Nov 8, 2026" tk={tk} />
              <FormInput label="Next due" value={vaccineNext} onChangeText={setVaccineNext} placeholder="e.g. Nov 2027" tk={tk} />
              <SaveButton onPress={handleSave} />
            </View>
          )}

          {/* Allergy form */}
          {selectedType === "allergy" && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <FormInput label="Allergy" value={allergyName} onChangeText={setAllergyName} placeholder="e.g. Chicken" tk={tk} />
              <SaveButton onPress={handleSave} />
            </View>
          )}

          {/* Insurance form */}
          {selectedType === "insurance" && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <FormInput label="Provider" value={insuranceName} onChangeText={setInsuranceName} placeholder="e.g. Pawtect Gold" tk={tk} />
              <FormInput label="Policy number" value={insurancePolicy} onChangeText={setInsurancePolicy} placeholder="e.g. PG-22-994 821" tk={tk} />
              <SaveButton onPress={handleSave} />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
    </PageContainer>
  );
}

function FormInput({ label, value, onChangeText, placeholder, tk }: any) {
  return (
    <View>
      <Text style={[styles.inputLabel, { color: tk.textMuted }]}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tk.textMuted}
        style={[styles.input, { backgroundColor: tk.inputBg ?? tk.bg, color: tk.text, borderColor: tk.border }]}
      />
    </View>
  );
}

function SaveButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.saveBtn} activeOpacity={0.85}>
      <Text style={styles.saveBtnText}>Save</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(37,99,235,0.1)", alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, marginTop: 20, marginBottom: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardTitle: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  cardMeta: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  allergyTag: { backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  allergyText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.coral },
  infoCard: { borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  infoTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  infoMeta: { fontSize: 13, color: colors.foreground + "88", fontFamily: "Inter_400Regular", marginTop: 4 },

  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 44 },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 20, opacity: 0.2 },
  sheetTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  optionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  inputLabel: { fontFamily: "Poppins_700Bold", fontSize: 11, letterSpacing: 1.2, marginBottom: 6 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn: { marginTop: 8, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
