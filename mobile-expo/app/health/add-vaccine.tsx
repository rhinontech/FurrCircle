import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, Switch } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Save, Calendar, Award } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userHealthApi } from "@/services/users/healthApi";

const vaccinePresets = ["Rabies", "DHPP Booster", "Bordetella", "Leptospirosis", "Canine Influenza", "Feline Leukemia"];

function formatDisplay(iso: string) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AddVaccineScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const isVet = user?.role === "veterinarian";

  const [name, setName] = useState("");
  const [generateCertificate, setGenerateCertificate] = useState(true); // vet default: on
  const [dateAdministered, setDateAdministered] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [status, setStatus] = useState("done");
  const [loading, setLoading] = useState(false);

  // Picker state — 'administered' | 'nextDue' | null
  const [activePicker, setActivePicker] = useState<'administered' | 'nextDue' | null>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const openPicker = (field: 'administered' | 'nextDue') => {
    const current = field === 'administered' ? dateAdministered : nextDueDate;
    setPickerDate(current ? new Date(current + 'T00:00:00') : new Date());
    setActivePicker(field);
  };

  const confirmPicker = () => {
    const iso = pickerDate.toISOString().slice(0, 10);
    if (activePicker === 'administered') setDateAdministered(iso);
    else if (activePicker === 'nextDue') setNextDueDate(iso);
    setActivePicker(null);
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert("Required Fields", "Please enter the vaccine name.");
      return;
    }

    setLoading(true);
    try {
      await userHealthApi.addVaccine(String(petId), {
        name,
        dateAdministered: dateAdministered || new Date().toISOString(),
        nextDueDate: nextDueDate || undefined,
        status,
        hasCertificate: isVet ? generateCertificate : false,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add vaccine.");
    } finally {
      setLoading(false);
    }
  };

  const DateField = ({ label, value, field }: { label: string; value: string; field: 'administered' | 'nextDue' }) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
      <Pressable
        onPress={() => openPicker(field)}
        style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: value ? colors.brand : colors.border, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text style={{ fontSize: 16, color: value ? colors.textPrimary : colors.textMuted }}>
          {value ? formatDisplay(value) : 'Select date'}
        </Text>
        <Calendar size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header outside KeyboardAvoidingView */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginRight: 40 }}>Add Vaccine</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Vaccine Name</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {vaccinePresets.map((presetName) => (
                <Pressable
                  key={presetName}
                  onPress={() => setName(presetName)}
                  style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: name === presetName ? colors.successBg : colors.bgSubtle, borderWidth: 1, borderColor: name === presetName ? '#10b981' : colors.border }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: name === presetName ? '#047857' : colors.textSecondary }}>{presetName}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              placeholder="e.g. Rabies, DHPP, Bordetella"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
            />
          </View>

          <DateField label="Date Administered" value={dateAdministered} field="administered" />
          <DateField label="Next Due Date (optional)" value={nextDueDate} field="nextDue" />

          {/* Certificate toggle — vet only */}
          {isVet ? (
            <View style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: generateCertificate ? colors.brand + '18' : colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={18} color={generateCertificate ? colors.brand : colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Generate Certificate</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>A PDF certificate will be created using your clinic details.</Text>
                  </View>
                </View>
                <Switch
                  value={generateCertificate}
                  onValueChange={setGenerateCertificate}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Award size={16} color={colors.textMuted} />
                <Text style={{ fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 18 }}>
                  Your vet will be notified to review this entry and can issue an official certificate.
                </Text>
              </View>
            </View>
          )}

          <View style={{ gap: 8, marginTop: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setStatus("done")}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: status === "done" ? colors.successBg : colors.bgSubtle, borderWidth: 1, borderColor: status === "done" ? '#10b981' : colors.border, alignItems: 'center' }}
              >
                <Text style={{ color: status === "done" ? '#047857' : colors.textMuted, fontWeight: '600' }}>Done</Text>
              </Pressable>
              <Pressable
                onPress={() => setStatus("due")}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: status === "due" ? colors.warningBg : colors.bgSubtle, borderWidth: 1, borderColor: status === "due" ? '#f59e0b' : colors.border, alignItems: 'center' }}
              >
                <Text style={{ color: status === "due" ? '#b45309' : colors.textMuted, fontWeight: '600' }}>Due</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={{ padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={{ backgroundColor: colors.brand, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: loading ? 0.7 : 1, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Save size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Save Vaccine</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* iOS modal date picker */}
      {Platform.OS === 'ios' && (
        <Modal visible={!!activePicker} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Pressable onPress={() => setActivePicker(null)}>
                  <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
                </Pressable>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                  {activePicker === 'administered' ? 'Date Administered' : 'Next Due Date'}
                </Text>
                <Pressable onPress={confirmPicker}>
                  <Text style={{ fontSize: 16, color: colors.brand, fontWeight: '700' }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                onChange={(_e, d) => { if (d) setPickerDate(d); }}
                themeVariant={isDark ? 'dark' : 'light'}
                style={{ backgroundColor: colors.bgCard }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android native dialog */}
      {Platform.OS === 'android' && !!activePicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onChange={(_e, d) => {
            if (d) {
              const iso = d.toISOString().slice(0, 10);
              if (activePicker === 'administered') setDateAdministered(iso);
              else setNextDueDate(iso);
            }
            setActivePicker(null);
          }}
        />
      )}
    </View>
  );
}
