import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable, TextInput, Alert, Keyboard, Image } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { healthApi } from "../services/health/healthApi";
import { moonaPassport } from "../src/lib/demo-data";
import { FileText, Plus, X, Syringe, AlertCircle, ShieldCheck, Activity, Pill, Edit2, Trash2 } from "../src/components/ui/icons";
import { AdaptiveSheet } from "../src/components/AdaptiveSheet";

type RecordType = "vaccine" | "allergy" | "insurance" | "medication" | "vital";

const ADD_OPTIONS: { key: RecordType; label: string; icon: any; color: string }[] = [
  { key: "vaccine", label: "Vaccine", icon: Syringe, color: colors.success },
  { key: "medication", label: "Medication", icon: Pill, color: colors.pinky },
  { key: "vital", label: "Vital", icon: Activity, color: colors.coral },
  { key: "allergy", label: "Allergy", icon: AlertCircle, color: colors.coral },
];

export default function RecordsScreen() {
  const tk = useTokens();
  const insets = useSafeAreaInsets();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const router = useRouter();

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RecordType | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const [data, setData] = useState({ vaccines: [] as any[], allergies: [] as any[], records: [] as any[], meds: [] as any[], vitals: [] as any[] });
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const res = await healthApi.getRecordsData(petId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
    }, [petId])
  );

  // Form fields
  const [allergyName, setAllergyName] = useState("");
  const [editAllergyId, setEditAllergyId] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedType(null);
    setAllergyName("");
    setEditAllergyId(null);
  };

  const handleClose = () => { setAddSheetOpen(false); resetForm(); };

  const handleSave = async () => {
    if (!petId) { Alert.alert("Error", "No pet selected"); return; }
    try {
      if (selectedType === "allergy") {
        if (!allergyName.trim()) { Alert.alert("Required", "Please enter an allergy."); return; }
        if (editAllergyId) {
          await healthApi.updateAllergy(petId, editAllergyId, {
            allergen: allergyName,
          });
          Alert.alert("Saved", "Allergy updated successfully.");
        } else {
          await healthApi.addAllergy(petId, {
            allergen: allergyName,
          });
          Alert.alert("Saved", "Allergy added successfully.");
        }
      }
      handleClose();
      fetchRecords(); // refresh
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save record.");
    }
  };

  // Edit/Delete handlers
  const handleDeleteVaccine = async (id: string) => {
    Alert.alert("Delete Vaccine", "Are you sure you want to delete this vaccine record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!petId) return;
          try {
            await healthApi.deleteVaccine(petId, id);
            Alert.alert("Success", "Vaccine record deleted.");
            fetchRecords();
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete vaccine record.");
          }
        },
      },
    ]);
  };

  const handleEditVaccine = (v: any) => {
    router.push({
      pathname: "/log/vaccine",
      params: {
        petId,
        editId: v.id,
        name: v.name,
        dateAdministered: v.dateAdministered,
        nextDueDate: v.nextDueDate || "",
        status: v.status,
      },
    });
  };

  const handleDeleteAllergy = async (id: string) => {
    Alert.alert("Delete Allergy", "Are you sure you want to delete this allergy record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!petId) return;
          try {
            await healthApi.deleteAllergy(petId, id);
            Alert.alert("Success", "Allergy record deleted.");
            fetchRecords();
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete allergy record.");
          }
        },
      },
    ]);
  };

  const handleEditAllergy = (a: any) => {
    setSelectedType("allergy");
    setAllergyName(a.allergen);
    setEditAllergyId(a.id);
    setAddSheetOpen(true);
  };

  const handleDeleteMedication = async (id: string) => {
    Alert.alert("Delete Medication", "Are you sure you want to delete this medication?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!petId) return;
          try {
            await healthApi.deleteMedication(petId, id);
            Alert.alert("Success", "Medication deleted.");
            fetchRecords();
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete medication.");
          }
        },
      },
    ]);
  };

  const handleEditMedication = (m: any) => {
    router.push({
      pathname: "/log/meds",
      params: {
        petId,
        editId: m.id,
        name: m.name,
        dosage: m.dosage || "",
        notes: m.notes || "",
        photo: m.imageUrl || "",
      },
    });
  };

  const handleDeleteVital = async (id: string) => {
    Alert.alert("Delete Vitals", "Are you sure you want to delete this vital record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!petId) return;
          try {
            await healthApi.deleteVital(petId, id);
            Alert.alert("Success", "Vital record deleted.");
            fetchRecords();
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete vital record.");
          }
        },
      },
    ]);
  };

  const handleEditVital = (v: any) => {
    router.push({
      pathname: "/log/vitals",
      params: {
        petId,
        editId: v.id,
        weight: v.weight ? String(v.weight) : "",
        temp: v.temperature ? String(v.temperature) : "",
        heartRate: v.heartRate ? String(v.heartRate) : "",
        notes: v.notes || "",
      },
    });
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
          {data.vaccines.length === 0 && <Text style={{ color: tk.textMuted, fontSize: 13 }}>No vaccines recorded.</Text>}
          {data.vaccines.map((v) => (
            <View key={v.id || v.name} style={[styles.card, { backgroundColor: tk.card }]}>
              <FileText size={20} color={v.status === "done" || v.status === "ok" ? colors.success : colors.coral} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: tk.text }]}>{v.name}</Text>
                <Text style={[styles.cardMeta, { color: tk.textMuted }]}>Given: {v.dateAdministered} {v.nextDueDate ? `· Next: ${v.nextDueDate}` : ''}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: v.status === "done" || v.status === "ok" ? "rgba(76,175,80,0.15)" : "rgba(255,107,107,0.15)" }]}>
                <Text style={[styles.badgeText, { color: v.status === "done" || v.status === "ok" ? colors.success : colors.coral }]}>{v.status === "done" || v.status === "ok" ? "OK" : "DUE"}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginLeft: 8 }}>
                <TouchableOpacity onPress={() => handleEditVaccine(v)}>
                  <Edit2 size={18} color={tk.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteVaccine(v.id)}>
                  <Trash2 size={18} color={colors.coral} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Allergies */}
          <Text style={[styles.sectionTitle, { color: tk.text }]}>Allergies</Text>
          {data.allergies.length === 0 && <Text style={{ color: tk.textMuted, fontSize: 13 }}>No allergies recorded.</Text>}
          {data.allergies.map((a) => (
            <View key={a.id || a.allergen} style={[styles.card, { backgroundColor: tk.card }]}>
              <AlertCircle size={20} color={colors.coral} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: tk.text }]}>{a.allergen}</Text>
                <Text style={[styles.cardMeta, { color: tk.textMuted }]}>Allergy Record</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginLeft: 8 }}>
                <TouchableOpacity onPress={() => handleEditAllergy(a)}>
                  <Edit2 size={18} color={tk.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteAllergy(a.id)}>
                  <Trash2 size={18} color={colors.coral} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Medications */}
          <Text style={[styles.sectionTitle, { color: tk.text }]}>Medications</Text>
          {data.meds.length === 0 && <Text style={{ color: tk.textMuted, fontSize: 13 }}>No medications recorded.</Text>}
          {data.meds.map((m: any, i: number) => (
            <View key={m.id ? String(m.id) : String(i)} style={[styles.card, { backgroundColor: tk.card }]}>
              {m.imageUrl ? (
                <TouchableOpacity onPress={() => setPreviewImage(m.imageUrl)} activeOpacity={0.85}>
                  <Image source={{ uri: m.imageUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                </TouchableOpacity>
              ) : (
                <Pill size={20} color={colors.pinky} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: tk.text }]}>{m.name}</Text>
                <Text style={[styles.cardMeta, { color: tk.textMuted }]}>
                  {m.dosage ? `Dose: ${m.dosage} ` : ""}
                  {m.startDate ? `· Started: ${m.startDate}` : ""}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginLeft: 8 }}>
                <TouchableOpacity onPress={() => handleEditMedication(m)}>
                  <Edit2 size={18} color={tk.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteMedication(m.id)}>
                  <Trash2 size={18} color={colors.coral} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Vitals */}
          <Text style={[styles.sectionTitle, { color: tk.text }]}>Vitals</Text>
          {data.vitals.length === 0 && <Text style={{ color: tk.textMuted, fontSize: 13 }}>No vitals recorded.</Text>}
          {data.vitals.map((v: any, i: number) => (
            <View key={v.id ? String(v.id) : String(i)} style={[styles.card, { backgroundColor: tk.card }]}>
              <Activity size={20} color={colors.coral} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: tk.text }]}>
                  {v.weight ? `Weight: ${v.weight}kg ` : ""}
                  {v.temperature ? `Temp: ${v.temperature}°C ` : ""}
                  {v.heartRate ? `HR: ${v.heartRate} bpm` : ""}
                  {!v.weight && !v.temperature && !v.heartRate ? "Vitals Logged" : ""}
                </Text>
                <Text style={[styles.cardMeta, { color: tk.textMuted }]}>{v.timestamp ? new Date(v.timestamp).toLocaleDateString() : ""} {v.notes ? `· ${v.notes}` : ""}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginLeft: 8 }}>
                <TouchableOpacity onPress={() => handleEditVital(v)}>
                  <Edit2 size={18} color={tk.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteVital(v.id)}>
                  <Trash2 size={18} color={colors.coral} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* <Text style={[styles.sectionTitle, { color: tk.text }]}>Insurance</Text>
          <View style={[styles.infoCard, { backgroundColor: tk.card }]}>
            <Text style={[styles.infoTitle, { color: tk.text }]}>{moonaPassport.insurance.provider}</Text>
            <Text style={[styles.infoMeta, { color: tk.textMuted }]}>Policy: {moonaPassport.insurance.policy}</Text>
            <Text style={[styles.infoMeta, { color: tk.textMuted }]}>{moonaPassport.insurance.valid}</Text>
          </View> */}
        </ScrollView>
      </View>

      {/* Add Record Modal */}
      <AdaptiveSheet visible={addSheetOpen} onClose={handleClose} maxWidth={500} maxHeight="90%">
        <View style={{ padding: 24, paddingBottom: keyboardVisible ? 10 : 24 + insets.bottom }}>
          <View style={styles.sheetTitleRow}>
            <Text style={[styles.sheetTitle, { color: tk.text }]}>
              {editAllergyId ? "Edit Allergy" : selectedType ? `Add ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}` : "Add Record"}
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
                  onPress={() => {
                    if (key === "vaccine") {
                      handleClose();
                      router.push({ pathname: "/log/vaccine", params: { petId } });
                    } else if (key === "medication") {
                      handleClose();
                      router.push({ pathname: "/log/meds", params: { petId } });
                    } else if (key === "vital") {
                      handleClose();
                      router.push({ pathname: "/log/vitals", params: { petId } });
                    } else {
                      setSelectedType(key);
                    }
                  }}
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

          {/* Allergy form */}
          {selectedType === "allergy" && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <FormInput label="Allergy" value={allergyName} onChangeText={setAllergyName} placeholder="e.g. Chicken" tk={tk} />
              <SaveButton onPress={handleSave} />
            </View>
          )}
        </View>
      </AdaptiveSheet>

      <Modal visible={!!previewImage} transparent={true} animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" }} onPress={() => setPreviewImage(null)}>
          <TouchableOpacity style={{ position: "absolute", top: 56, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }} onPress={() => setPreviewImage(null)}>
            <X size={28} color={colors.white} />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={{ width: "100%", height: "80%" }} resizeMode="contain" />
          )}
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
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16, marginBottom: 8 },
  cardTitle: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  cardMeta: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  allergyTag: { backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  allergyText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.coral },
  infoCard: { borderRadius: 16, padding: 16 },
  infoTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  infoMeta: { fontSize: 13, color: colors.foreground + "88", fontFamily: "Inter_400Regular", marginTop: 4 },

  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 44 },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 20, opacity: 0.2 },
  sheetTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, padding: 14 },
  optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  optionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  inputLabel: { fontFamily: "Poppins_700Bold", fontSize: 11, letterSpacing: 1.2, marginBottom: 6 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn: { marginTop: 8, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
