import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Save } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

export default function AddMedicationScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors } = useTheme();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !dosage || !frequency) {
      Alert.alert("Required Fields", "Please fill out all fields.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/health/meds/${petId}`, { 
        name, 
        dosage, 
        frequency, 
        startDate: new Date().toISOString() 
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add medication.");
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
          <TextInput
            placeholder="e.g. Daily, Weekly, Monthly"
            placeholderTextColor={colors.textMuted}
            value={frequency}
            onChangeText={setFrequency}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
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
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Save Medication</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
