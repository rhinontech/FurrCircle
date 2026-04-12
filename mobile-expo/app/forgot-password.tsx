import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Mail, CheckCircle } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { authApi } from "@/services/auth/authApi";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(trimmed);
      setSent(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <View style={{ paddingTop: 60, paddingBottom: 20 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.bgCard,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        {!sent ? (
          <>
            {/* Header */}
            <View style={{ marginBottom: 32 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: colors.brand + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Mail size={30} color={colors.brand} />
              </View>
              <Text
                style={{ fontSize: 26, fontWeight: "800", color: colors.textPrimary, marginBottom: 8 }}
              >
                Forgot Password?
              </Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }}>
                Enter the email linked to your account and we'll send you a reset code.
              </Text>
            </View>

            {/* Email input */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}
              >
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: colors.bgCard,
                  borderWidth: 1,
                  borderColor: error ? "#ef4444" : colors.border,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: colors.textPrimary,
                }}
              />
              {error ? (
                <Text style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{error}</Text>
              ) : null}
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: colors.brand,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                  Send Reset Code
                </Text>
              )}
            </Pressable>

            {/* Link to reset page */}
            <Pressable
              onPress={() => router.push("/reset-password")}
              style={{ marginTop: 20, alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, color: colors.brand, fontWeight: "600" }}>
                Already have a code? Enter it here
              </Text>
            </Pressable>
          </>
        ) : (
          /* Success state */
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#10b981" + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={40} color="#10b981" />
            </View>
            <Text
              style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary, textAlign: "center" }}
            >
              Check your email
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 22,
                maxWidth: 280,
              }}
            >
              If an account is linked to {email}, a reset code has been sent. Check your inbox and
              use it to set a new password.
            </Text>
            <Pressable
              onPress={() => router.push("/reset-password")}
              style={{
                marginTop: 8,
                backgroundColor: colors.brand,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 32,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                Enter Reset Code
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
