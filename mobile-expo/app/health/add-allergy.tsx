import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Save } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

const severityOptions = ["mild", "moderate", "severe"];

export default function AddAllergyScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors } = useTheme();

  const [allergen, setAllergen] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [reaction, setReaction] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!allergen.trim()) {
      Alert.alert("Required Field", "Please enter the allergen name.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/health/allergies/${petId}`, {
        allergen: allergen.trim(),
        severity,
        reaction: reaction.trim(),
        notes: notes.trim(),
        diagnosedAt: new Date().toISOString(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add allergy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.textPrimary, textAlign: "center", marginRight: 40 }}>Add Allergy</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>Allergen</Text>
          <TextInput
            placeholder="e.g. Chicken, pollen, dust mites"
            placeholderTextColor={colors.textMuted}
            value={allergen}
            onChangeText={setAllergen}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>Severity</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {severityOptions.map((option) => {
              const active = severity === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setSeverity(option)}
                  style={{
                    flex: 1,
                    backgroundColor: active ? colors.brand : colors.bgCard,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? colors.brand : colors.border,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", textTransform: "capitalize", color: active ? "#fff" : colors.textPrimary }}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>Reaction</Text>
          <TextInput
            placeholder="e.g. Itchy skin, sneezing, upset stomach"
            placeholderTextColor={colors.textMuted}
            value={reaction}
            onChangeText={setReaction}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>Notes</Text>
          <TextInput
            placeholder="Food to avoid, seasonal pattern, vet guidance..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.textPrimary, height: 100, textAlignVertical: "top" }}
          />
        </View>
      </ScrollView>

      <View style={{ padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={{ backgroundColor: colors.brand, borderRadius: 16, paddingVertical: 16, alignItems: "center", opacity: loading ? 0.7 : 1, flexDirection: "row", justifyContent: "center", gap: 8 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Save Allergy</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
