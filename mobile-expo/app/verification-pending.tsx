import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, Clock, Mail, LogOut } from "@/components/ui/IconCompat";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

export default function VerificationPendingScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Clock size={40} color="#D97706" />
      </View>

      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 12 }}>
        Verification Pending
      </Text>
      <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
        Your veterinarian account is awaiting admin verification. You'll be able to access all features once approved.
      </Text>

      <View style={{ width: '100%', gap: 14, marginBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 }}>
          <ShieldCheck size={22} color={colors.brand} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Admin Review</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 }}>
              Our team reviews all veterinarian registrations to ensure platform quality. This typically takes 1–2 business days.
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 }}>
          <Mail size={22} color={colors.brand} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Email Notification</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 }}>
              You'll receive an email at {user?.email} when your account is approved.
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={logout}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard }}
      >
        <LogOut size={18} color={colors.textMuted} />
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textMuted }}>Sign Out</Text>
      </Pressable>
    </SafeAreaView>
  );
}
