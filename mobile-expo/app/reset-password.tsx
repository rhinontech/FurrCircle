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
import { ChevronLeft, KeyRound, Eye, EyeOff, CheckCircle } from "@/components/ui/IconCompat";
import { useTheme } from "../contexts/ThemeContext";
import { authApi } from "@/services/auth/authApi";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    const trimToken = token.trim();
    if (!trimToken) {
      setError("Please enter the reset code from your email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(trimToken, newPassword);
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Reset failed. The code may be expired or invalid.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError?: boolean) => ({
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: hasError ? "#ef4444" : colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  });

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

        {!done ? (
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
                <KeyRound size={30} color={colors.brand} />
              </View>
              <Text
                style={{ fontSize: 26, fontWeight: "800", color: colors.textPrimary, marginBottom: 8 }}
              >
                Reset Password
              </Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }}>
                Enter the code from your email and choose a new password.
              </Text>
            </View>

            {/* Reset code */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}
              >
                Reset Code
              </Text>
              <TextInput
                value={token}
                onChangeText={setToken}
                placeholder="Paste your reset code"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={inputStyle()}
              />
            </View>

            {/* New password */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}
              >
                New Password
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  style={[inputStyle(), { paddingRight: 48 }]}
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textMuted} />
                  ) : (
                    <Eye size={18} color={colors.textMuted} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Confirm password */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}
              >
                Confirm Password
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                style={inputStyle(!!error && confirmPassword !== newPassword)}
              />
            </View>

            {error ? (
              <View
                style={{
                  backgroundColor: "#ef444420",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 13, color: "#ef4444" }}>{error}</Text>
              </View>
            ) : null}

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
                  Reset Password
                </Text>
              )}
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
              Password Updated
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
              Your password has been reset successfully. You can now log in with your new password.
            </Text>
            <Pressable
              onPress={() => router.replace("/login")}
              style={{
                marginTop: 8,
                backgroundColor: colors.brand,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 32,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                Go to Login
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
