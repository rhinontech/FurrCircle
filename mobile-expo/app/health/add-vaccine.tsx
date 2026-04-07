import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Save } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

const vaccinePresets = [
  { name: "Rabies", status: "done", nextDueDate: "2027-04-01" },
  { name: "DHPP Booster", status: "done", nextDueDate: "2027-01-15" },
  { name: "Bordetella", status: "due", nextDueDate: "2026-05-10" },
];

export default function AddVaccineScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors } = useTheme();

  const [name, setName] = useState("");
  const [dateAdministered, setDateAdministered] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [status, setStatus] = useState("done");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name) {
      Alert.alert("Required Fields", "Please enter the vaccine name.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/health/vaccines/${petId}`, { 
        name, 
        dateAdministered: dateAdministered || new Date().toISOString(),
        nextDueDate: nextDueDate || undefined,
        status
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add vaccine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginRight: 40 }}>Add Vaccine</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Vaccine Name</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {vaccinePresets.map((preset) => (
              <Pressable
                key={preset.name}
                onPress={() => {
                  setName(preset.name);
                  setStatus(preset.status);
                  setNextDueDate(preset.nextDueDate);
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.bgSubtle, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>{preset.name}</Text>
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

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Date Administered</Text>
          <TextInput
            placeholder="YYYY-MM-DD or leave blank for today"
            placeholderTextColor={colors.textMuted}
            value={dateAdministered}
            onChangeText={setDateAdministered}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Next Due Date</Text>
          <TextInput
            placeholder="YYYY-MM-DD (optional)"
            placeholderTextColor={colors.textMuted}
            value={nextDueDate}
            onChangeText={setNextDueDate}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
        </View>
        
        <View style={{ gap: 8, marginTop: 10 }}>
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
  );
}
