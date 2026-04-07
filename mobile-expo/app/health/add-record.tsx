import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Save } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

export default function AddRecordScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors } = useTheme();

  const [title, setTitle] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [veterinarianName, setVeterinarianName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title || !clinicName) {
      Alert.alert("Required Fields", "Please fill out at least Title and Clinic Name.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/health/records/${petId}`, { 
        title, 
        clinic_name: clinicName, 
        veterinarian_name: veterinarianName,
        notes,
        date: new Date().toISOString()
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add medical record.");
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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginRight: 40 }}>Add Medical Record</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Title / Reason</Text>
          <TextInput
            placeholder="e.g. Annual Checkup, Surgery"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Clinic Name</Text>
          <TextInput
            placeholder="e.g. Downtown Vet Care"
            placeholderTextColor={colors.textMuted}
            value={clinicName}
            onChangeText={setClinicName}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Veterinarian Name</Text>
          <TextInput
            placeholder="e.g. Dr. Smith"
            placeholderTextColor={colors.textMuted}
            value={veterinarianName}
            onChangeText={setVeterinarianName}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
        </View>
        
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Notes</Text>
          <TextInput
            placeholder="Any additional notes..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary, height: 100, textAlignVertical: 'top' }}
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
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Save Record</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
