import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, Clock, FileText, ShieldCheck } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

export default function VetVerificationStatusScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const verified = !!user?.isVerified;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Verification Status</Text>
      </View>

      <View style={{ padding: 20 }}>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 22, alignItems: "center" }}>
          {verified ? <CheckCircle size={48} color="#10b981" /> : <Clock size={48} color="#f59e0b" />}
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary, marginTop: 14 }}>{verified ? "Verified" : "Pending Review"}</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 21, marginTop: 8 }}>
            {verified
              ? "Your veterinarian profile is approved and visible to pet parents."
              : "Your veterinarian account is awaiting admin approval. Keep your clinic profile complete so review is faster."}
          </Text>
        </View>

        <View style={{ marginTop: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
            <ShieldCheck size={22} color={verified ? "#10b981" : colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>Identity and clinic profile</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>{verified ? "Approved by admin" : "Under admin review"}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
            <FileText size={22} color={colors.brand} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>Profile completeness</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Add clinic name, phone, city, working hours, and license details from Edit Profile.</Text>
            </View>
          </View>
        </View>

        <Pressable onPress={() => router.push("/profile/edit")} style={{ marginTop: 18, height: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Edit Profile Details</Text>
        </Pressable>
      </View>
    </View>
  );
}
