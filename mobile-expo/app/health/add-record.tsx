import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Camera, ChevronLeft, FileText, Save } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { userHealthApi } from "@/services/users/healthApi";
import { captureAndUploadImage } from "@/services/uploadApi";

export default function AddRecordScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors } = useTheme();

  const [title, setTitle] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [veterinarianName, setVeterinarianName] = useState("");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"choice" | "information">("choice");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title || !clinicName) {
      Alert.alert("Required Fields", "Please fill out at least Title and Clinic Name.");
      return;
    }

    setLoading(true);
    try {
      await userHealthApi.addRecord(String(petId), { 
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

  const handleCameraRecord = async () => {
    setLoading(true);
    try {
      const imageUrl = await captureAndUploadImage("reports", { aspect: [4, 3], allowsEditing: true });
      if (!imageUrl) return;

      await userHealthApi.addRecord(String(petId), {
        title: "Medical Record Photo",
        type: "Medical Record Photo",
        clinic_name: "Photo record",
        notes: "Captured from camera",
        imageUrl,
        date: new Date().toISOString(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Camera record failed", error.message || "Could not add the photo record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header outside KeyboardAvoidingView */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginRight: 40 }}>Add Medical Record</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        {mode === "choice" ? (
          <View style={{ flex: 1, padding: 20, gap: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>How do you want to add this record?</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 21 }}>
              Add details manually, or capture a photo of a prescription, bill, report, or document.
            </Text>

            <Pressable
              onPress={() => setMode("information")}
              disabled={loading}
              style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                <FileText size={24} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>Record Information</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Open the existing form and save record details.</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleCameraRecord}
              disabled={loading}
              style={{ backgroundColor: colors.brand, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, opacity: loading ? 0.7 : 1 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Camera size={24} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>Open Camera</Text>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginTop: 4 }}>Capture a photo and add it as a record.</Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <>
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
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
