import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, AlertCircle, Trash2 } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

const REASONS = [
  "I don't use the app anymore",
  "I have privacy concerns",
  "I found a better app",
  "Too many notifications",
  "Technical issues",
  "Other",
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { deleteAccount } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data including pets, health records, appointments, and community posts. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAccount(selectedReason ?? undefined);
            } catch (err: any) {
              setLoading(false);
              Alert.alert("Error", err?.message || "Failed to delete account. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>Delete Account</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <View style={{ backgroundColor: "#FFF0F0", borderRadius: 16, borderWidth: 1, borderColor: "#FFD0D0", padding: 16, flexDirection: "row", gap: 12, marginBottom: 28 }}>
          <AlertCircle size={20} color="#D9534F" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#D9534F", marginBottom: 4 }}>This action is permanent</Text>
            <Text style={{ fontSize: 14, color: "#A03030", lineHeight: 20 }}>
              Deleting your account will remove all your pets, health records, appointments, and posts. You will not be able to recover this data.
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 12 }}>
          Reason for leaving (optional)
        </Text>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 32 }}>
          {REASONS.map((reason, i) => (
            <Pressable
              key={reason}
              onPress={() => setSelectedReason(reason === selectedReason ? null : reason)}
              style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: i < REASONS.length - 1 ? 1 : 0, borderBottomColor: colors.border, gap: 12 }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selectedReason === reason ? "#D9534F" : colors.border, backgroundColor: selectedReason === reason ? "#D9534F" : "transparent", alignItems: "center", justifyContent: "center" }}>
                {selectedReason === reason && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
              </View>
              <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>{reason}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleDelete}
          disabled={loading}
          style={{ backgroundColor: "#D9534F", borderRadius: 16, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Trash2 size={18} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Delete My Account</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
