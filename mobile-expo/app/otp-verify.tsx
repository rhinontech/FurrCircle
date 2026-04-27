import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { ChevronLeft, ShieldCheck, Clock } from "@/components/ui/IconCompat";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth, type UserRole } from "../contexts/AuthContext";

export default function OtpVerifyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { register } = useAuth();
  const params = useLocalSearchParams();

  // Extract user data from params
  const { name, email, password, role, phone, extraData } = params as any;
  const extra = extraData ? JSON.parse(extraData) : {};

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // 1. Send OTP on mount
  useEffect(() => {
    sendOtp();
  }, []);

  // 2. Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const sendOtp = async () => {
    try {
      setLoading(true);
      const confirmation = await auth().signInWithPhoneNumber(phone as string);
      setConfirm(confirmation);
      setTimer(60);
    } catch (error: any) {
      console.error("Firebase SMS Error:", error);
      Alert.alert("Error", "Failed to send SMS. Please check the phone number and try again.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code");
      return;
    }

    if (!confirm) return;

    setLoading(true);
    try {
      // A. Verify Firebase Code
      await confirm.confirm(code);

      // B. Verification Success! Now register in our backend
      await register(
        name as string,
        email as string,
        password as string,
        role as UserRole,
        { ...extra, phone: phone as string, phone_number: phone as string }
      );

      // Navigation is handled by AuthContext (redirects on login success)
    } catch (error: any) {
      Alert.alert("Verification Failed", "The code you entered is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>

          <Pressable onPress={() => router.back()} style={{ marginBottom: 32 }}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Pressable>

          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View style={{ backgroundColor: colors.brand + "15", padding: 20, borderRadius: 100, marginBottom: 24 }}>
              <ShieldCheck size={40} color={colors.brand} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.textPrimary }}>Verify Phone</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
              We've sent a 6-digit verification code to{"\n"}
              <Text style={{ fontWeight: "700", color: colors.textPrimary }}>{phone}</Text>
            </Text>
          </View>

          <View style={{ gap: 20 }}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              style={{
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                height: 60,
                textAlign: "center",
                fontSize: 24,
                fontWeight: "700",
                color: colors.textPrimary,
                letterSpacing: 8,
              }}
            />

            <Pressable
              onPress={handleVerify}
              disabled={loading || code.length < 6}
              style={{
                backgroundColor: colors.brand,
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                opacity: (loading || code.length < 6) ? 0.7 : 1,
              }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Verify & Sign Up</Text>}
            </Pressable>

            <View style={{ alignItems: "center", marginTop: 10 }}>
              {timer > 0 ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Clock size={16} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: 14 }}>Resend code in {timer}s</Text>
                </View>
              ) : (
                <Pressable onPress={sendOtp} disabled={isResending}>
                  <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 14 }}>Resend OTP</Text>
                </Pressable>
              )}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
