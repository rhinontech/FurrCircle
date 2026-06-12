import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { colors } from "../src/lib/theme";
import { authApi } from "../services/auth/authApi";
import { useAuthStore } from "../src/lib/auth-store";
import { Eye, EyeOff } from "../src/components/ui/icons";
import { PageContainer } from "../src/components/PageContainer";
import { GlassBlur } from "../src/components/ui/Glass";
import { useTokens } from "../src/lib/theme-store";

const { height } = Dimensions.get("window");

// Safe Firebase Auth Loader
const getFirebaseAuth = () => {
  if (Constants.appOwnership === 'expo' || Platform.OS === 'web') return null;
  try {
    return require("@react-native-firebase/auth").default;
  } catch {
    return null;
  }
};

export default function OtpVerifyScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const params = useLocalSearchParams();
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const tk = useTokens();

  // Extract search params
  const {
    userId,
    emailOrPhone,
    type,
    initialVerificationId,
    username,
    name,
    password,
    email,
    phone
  } = params as any;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<any>(null);
  const [timer, setTimer] = useState(40);
  const [isResending, setIsResending] = useState(false);

  // Reset password fields (if type === 'email-verify-reset')
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const sendPhoneOtp = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      Alert.alert("Warning", "Phone verification is not available in Expo Go. Re-routing or mocking resend.");
      return;
    }

    try {
      setLoading(true);
      setIsResending(true);

      const confirmation = await auth().signInWithPhoneNumber(emailOrPhone);
      setConfirm(confirmation);
      setTimer(40);
      setCode("");
    } catch (error: any) {
      console.error("Firebase SMS Resend Error:", error);
      Alert.alert("Error", "Failed to resend SMS. Please check formatting and try again.");
    } finally {
      setLoading(false);
      setIsResending(false);
    }
  };

  const sendBackendOtp = async () => {
    try {
      setLoading(true);
      setIsResending(true);
      const isEmail = emailOrPhone.includes("@");
      if (isEmail) {
        await authApi.sendEmailOtp(userId);
        Alert.alert("OTP Sent", "A new verification code has been sent to your email.");
      } else {
        await authApi.sendPhoneOtp(emailOrPhone);
        Alert.alert("OTP Sent", "A new verification code has been sent to your phone.");
      }
      setTimer(40);
      setCode("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
      setIsResending(false);
    }
  };

  const handleResend = () => {
    if (type.startsWith("phone")) {
      sendPhoneOtp();
    } else {
      sendBackendOtp();
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code");
      return;
    }

    setLoading(true);

    if (type.startsWith("phone")) {
      const auth = getFirebaseAuth();
      if (!auth) {
        Alert.alert("Mock Verified", "Expo Go mock verified. Completing request.");
        try {
          if (type === "phone-verify-signup") {
            const res = await authApi.register({
              username,
              name,
              email: email || undefined,
              phone: phone || undefined,
              emailOrPhone,
              password,
              role: "owner"
            });
            useAuthStore.getState().setJustSignedUp(true);
            await setSession(res);
            router.replace("/onboarding");
          } else {
            const res = await authApi.loginOtp(emailOrPhone);
            await setSession(res);
            router.replace("/(tabs)");
          }
        } catch (err: any) {
          Alert.alert("Verification Failed", err.message || "Could not complete account setup.");
        } finally {
          setLoading(false);
        }
        return;
      }

      const activeVerificationId = confirm?.verificationId || initialVerificationId;
      if (!activeVerificationId) {
        setLoading(false);
        Alert.alert("Error", "Verification session not found. Please resend code.");
        return;
      }

      try {
        const currentUser = auth().currentUser;
        if (currentUser && currentUser.phoneNumber?.includes(emailOrPhone.replace(/[^0-9+]/g, ''))) {
          console.log("User already signed into Firebase via auto-verification.");
        } else {
          if (confirm) {
            await confirm.confirm(code);
          } else {
            const credential = auth.PhoneAuthProvider.credential(activeVerificationId, code);
            await auth().signInWithCredential(credential);
          }
        }
      } catch (err: any) {
        console.error("Firebase Verification Error:", err);
        setLoading(false);
        Alert.alert("Verification Failed", err.message || "The code you entered is invalid or has expired.");
        return;
      }

      try {
        if (type === "phone-verify-signup") {
          const res = await authApi.register({
            username,
            name,
            email: email || undefined,
            phone: phone || undefined,
            emailOrPhone,
            password,
            role: "owner"
          });
          useAuthStore.getState().setJustSignedUp(true);
          await setSession(res);
          router.replace("/onboarding");
        } else if (type === "phone-verify-login") {
          const res = await authApi.loginOtp(emailOrPhone);
          await setSession(res);
          router.replace("/(tabs)");
        } else if (type === "phone-verify-reset") {
          setIsCodeVerified(true);
        }
      } catch (err: any) {
        console.error("Backend Error after OTP:", err);
        Alert.alert("Error", err.message || "Failed to complete account setup. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    else {
      try {
        if (type === "email-verify-reset") {
          setIsCodeVerified(true);
          setLoading(false);
        } else {
          const res = await authApi.verifyEmailOtp(userId, code);
          const isSignup = type === "email-verify-signup";
          if (isSignup) {
            useAuthStore.getState().setJustSignedUp(true);
          }
          await setSession(res);
          setLoading(false);
          router.replace(isSignup ? "/onboarding" : "/(tabs)");
        }
      } catch (err: any) {
        setLoading(false);
        Alert.alert("Verification Failed", err.message || "Invalid or expired OTP code.");
      }
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (type === "phone-verify-reset") {
        await authApi.resetPasswordDirect(emailOrPhone, newPassword);
      } else {
        await authApi.resetPassword({
          userId,
          otp: code,
          newPassword
        });
      }
      setLoading(false);
      Alert.alert("Success", "Password updated successfully! Please log in.", [
        { text: "OK", onPress: () => router.replace("/login") }
      ]);
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Reset Failed", err.message || "Failed to reset password.");
    }
  };

  const renderOtpBoxes = () => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => inputRef.current?.focus()}
        style={styles.otpContainer}
      >
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const char = code[index] || "";
          const isFocused = code.length === index;
          const isFilled = code.length > index;

          return (
            <View
              key={index}
              style={[
                styles.otpBox,
                { backgroundColor: tk.glassChip, borderColor: tk.glassBorder },
                isFocused && { borderColor: colors.primary, backgroundColor: "rgba(37,99,235,0.08)" },
                isFilled && { borderColor: colors.primary + "66" },
              ]}
            >
              <Text style={[styles.otpText, { color: tk.text }]}>{char}</Text>
            </View>
          );
        })}
      </TouchableOpacity>
    );
  };

  return (
    <PageContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TouchableOpacity
            onPress={async () => {
              if ((type === 'email-verify-signup' || type === 'email-verify-login') && userId) {
                if (type === 'email-verify-signup') {
                  authApi.cancelRegistration(userId);
                }
              }
              router.back();
            }}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {!isCodeVerified ? (
            <GlassBlur style={[styles.card, { borderColor: tk.glassBorder }]}>
              <Text style={[styles.title, { color: tk.text }]}>Verify Account 🐾</Text>
              <Text style={[styles.subtitle, { color: tk.textMuted }]}>
                We've sent a 6-digit verification code to:{"\n"}
                <Text style={[styles.highlightText, { color: tk.text }]}>{emailOrPhone}</Text>
              </Text>

              {renderOtpBoxes()}

              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, "");
                  setCode(cleaned);
                  if (cleaned.length === 6) {
                    Keyboard.dismiss();
                  }
                }}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.hiddenInput}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.primaryBtn, (loading || code.length < 6) && styles.disabledBtn]}
                onPress={handleVerify}
                disabled={loading || code.length < 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <View style={styles.timerRow}>
                {timer > 0 ? (
                  <Text style={[styles.timerText, { color: tk.textMuted }]}>Resend code in <Text style={[styles.timerCount, { color: tk.text }]}>{timer}s</Text></Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={isResending}>
                    <Text style={styles.resendLink}>Resend Verification Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            </GlassBlur>
          ) : (
            <GlassBlur style={[styles.card, { borderColor: tk.glassBorder }]}>
              <Text style={[styles.title, { color: tk.text }]}>New Password 🔑</Text>
              <Text style={[styles.subtitle, { color: tk.textMuted }]}>Please enter your new secure password</Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: tk.textMuted }]}>New Password</Text>
                <View style={[styles.inputRow, { backgroundColor: tk.glassChip, borderColor: tk.glassBorder }]}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 0, color: tk.text, backgroundColor: "transparent" }]}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={tk.textMuted}
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword((v) => !v)} style={styles.eyeBtn}>
                    {showNewPassword ? (
                      <EyeOff size={20} color={colors.primary} />
                    ) : (
                      <Eye size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleResetPasswordSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </GlassBlur>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 12, marginBottom: 28 },
  backText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.primary },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: '100%',
    marginBottom: 40,
    alignItems: 'center',
  },
  title: { fontFamily: "Poppins_700Bold", fontSize: 26, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  highlightText: { fontFamily: "Inter_700Bold" },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 36 },
  otpBox: { width: 44, height: 54, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  otpText: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1, left: -9999 },
  primaryBtn: { width: '100%', backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 15, alignItems: "center", justifyContent: 'center', marginTop: 12 },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  timerRow: { marginTop: 24 },
  timerText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  timerCount: { fontFamily: "Inter_600SemiBold" },
  resendLink: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.primary },
  field: { width: '100%', marginBottom: 24 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "Inter_400Regular", fontSize: 15 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, paddingRight: 16 },
  eyeBtn: { paddingVertical: 13, paddingLeft: 8 },
});
