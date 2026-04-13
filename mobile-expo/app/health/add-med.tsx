import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, Image } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Save, Calendar, Camera, X } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { userHealthApi } from "@/services/users/healthApi";
import { captureAndUploadImage } from "@/services/uploadApi";

function formatDisplay(iso: string) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AddMedicationScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors, isDark } = useTheme();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Picker state — 'start' | 'end' | null
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const openPicker = (field: 'start' | 'end') => {
    const current = field === 'start' ? startDate : endDate;
    setPickerDate(current ? new Date(current + 'T00:00:00') : new Date());
    setActivePicker(field);
  };

  const confirmPicker = () => {
    const iso = pickerDate.toISOString().slice(0, 10);
    if (activePicker === 'start') setStartDate(iso);
    else if (activePicker === 'end') setEndDate(iso);
    setActivePicker(null);
  };

  const handleSave = async () => {
    if (!name || !dosage || !frequency) {
      Alert.alert("Required Fields", "Please fill out name, dosage, and frequency.");
      return;
    }

    setLoading(true);
    try {
      await userHealthApi.addMedication(String(petId), {
        name,
        dosage,
        frequency,
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || undefined,
        imageUrl: imageUrl || undefined,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add medication.");
    } finally {
      setLoading(false);
    }
  };

  const handleCapturePhoto = async () => {
    setCapturing(true);
    try {
      const url = await captureAndUploadImage("reports", { aspect: [4, 3], allowsEditing: true });
      if (url) setImageUrl(url);
    } catch (error: any) {
      Alert.alert("Camera Error", error.message || "Could not capture medication photo.");
    } finally {
      setCapturing(false);
    }
  };

  const DateField = ({ label, value, field, optional }: { label: string; value: string; field: 'start' | 'end'; optional?: boolean }) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
      <Pressable
        onPress={() => openPicker(field)}
        style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: value ? colors.brand : colors.border, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text style={{ fontSize: 16, color: value ? colors.textPrimary : colors.textMuted }}>
          {value ? formatDisplay(value) : optional ? 'No end date (ongoing)' : 'Select date'}
        </Text>
        <Calendar size={18} color={colors.textMuted} />
      </Pressable>
      {optional && value ? (
        <Pressable onPress={() => setEndDate("")}>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Clear (set as ongoing)</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginRight: 40 }}>Add Medication</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Medication Name</Text>
          <TextInput
            placeholder="e.g. Heartgard, Bravecto"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Dosage</Text>
          <TextInput
            placeholder="e.g. 1 Tablet, 5ml"
            placeholderTextColor={colors.textMuted}
            value={dosage}
            onChangeText={setDosage}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Frequency</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Daily', 'Twice Daily', 'Weekly', 'Monthly', 'As Needed'].map((f) => (
              <Pressable
                key={f}
                onPress={() => setFrequency(f)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: frequency === f ? colors.brand : colors.bgSubtle, borderWidth: 1, borderColor: frequency === f ? colors.brand : colors.border }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: frequency === f ? '#fff' : colors.textSecondary }}>{f}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            placeholder="Or type custom frequency"
            placeholderTextColor={colors.textMuted}
            value={frequency}
            onChangeText={setFrequency}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
        </View>

        <DateField label="Start Date" value={startDate} field="start" />
        <DateField label="End Date" value={endDate} field="end" optional />

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Medication Photo <Text style={{ color: colors.textMuted }}>(Optional)</Text></Text>
          {imageUrl ? (
            <View style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard }}>
              <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 190 }} resizeMode="cover" />
              <Pressable
                onPress={() => setImageUrl(null)}
                style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(15,23,42,0.72)", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handleCapturePhoto}
              disabled={capturing}
              style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, minHeight: 92, alignItems: "center", justifyContent: "center", gap: 8, opacity: capturing ? 0.7 : 1 }}
            >
              {capturing ? <ActivityIndicator color={colors.brand} /> : <Camera size={24} color={colors.brand} />}
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>
                {capturing ? "Opening camera..." : "Take Medication Photo"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center" }}>
                Capture the strip, bottle, prescription, or label.
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

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
                  {activePicker === 'start' ? 'Start Date' : 'End Date'}
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
              if (activePicker === 'start') setStartDate(iso);
              else setEndDate(iso);
            }
            setActivePicker(null);
          }}
        />
      )}

      <View style={{ padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={{ backgroundColor: colors.brand, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: loading ? 0.7 : 1, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Save size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Save Medication</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
