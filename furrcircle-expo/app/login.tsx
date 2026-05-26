import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import Constants from "expo-constants";
import { colors } from "../src/lib/theme";
import { useAuthStore } from "../src/lib/auth-store";
import { authApi } from "../services/auth/authApi";

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

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [otpLoginBusy, setOtpLoginBusy] = useState(false);

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your username/email/phone and password.");
      return;
    }
    setBusy(true);
    const err = await login(identifier.trim(), password);
    setBusy(false);
    
    if (err) {
      if (err.startsWith("unverified:")) {
        const parts = err.split(":");
        // parts[1] is userId, parts[2] is emailOrPhone
        Alert.alert(
          "Verify Account", 
          "Your account is not verified. Let's verify it now.",
          [
            {
              text: "Verify Now",
              onPress: () => router.push({
                pathname: "/otp-verify",
                params: {
                  userId: parts[1],
                  emailOrPhone: parts[2],
                  type: "email-verify-login"
                }
              })
            }
          ]
        );
      } else {
        Alert.alert("Login failed", err);
      }
    } else {
      router.replace("/(tabs)");
    }
  }

  // Handle Firebase Phone OTP Login
  async function handlePhoneOtpLogin() {
    const trimmedInput = identifier.trim();
    if (!trimmedInput) {
      Alert.alert("Error", "Please enter your phone number first (+91...)");
      return;
    }

    const isPhone = /^[+0-9]+$/.test(trimmedInput);
    if (!isPhone) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number (e.g. +919876543210) for OTP login.");
      return;
    }

    setOtpLoginBusy(true);
    try {
      const firebaseAuth = getFirebaseAuth();
      if (firebaseAuth) {
        console.log(`Requesting Firebase OTP for login: ${trimmedInput}`);
        const confirmation = await firebaseAuth().signInWithPhoneNumber(trimmedInput);
        setOtpLoginBusy(false);

        router.push({
          pathname: "/otp-verify",
          params: {
            emailOrPhone: trimmedInput,
            initialVerificationId: confirmation.verificationId,
            type: "phone-verify-login"
          }
        });
      } else {
        // Expo Go Fallback
        setOtpLoginBusy(false);
        Alert.alert("Warning", "Phone verification is not available in Expo Go. Navigating for mock login verification.");
        router.push({
          pathname: "/otp-verify",
          params: {
            emailOrPhone: trimmedInput,
            type: "phone-verify-login"
          }
        });
      }
    } catch (err: any) {
      console.warn("Firebase Phone Auth login failed. Falling back to backend SMS OTP...", err);
      try {
        const res = await authApi.sendPhoneOtp(trimmedInput);
        setOtpLoginBusy(false);
        if (res && res.success === true) {
          router.push({
            pathname: "/otp-verify",
            params: {
              userId: res.userId,
              emailOrPhone: trimmedInput,
              type: "email-verify-signup"
            }
          });
        } else {
          Alert.alert("OTP Failed", "Could not send verification code.");
        }
      } catch (fallbackErr: any) {
        setOtpLoginBusy(false);
        console.error("Backend OTP Login Fallback Error:", fallbackErr);
        Alert.alert("OTP Failed", fallbackErr.message || "Failed to send verification code via Firebase or backend SMS. Please check formatting.");
      }
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <Image source={require("../src/assets/doodle-puppy.png")} style={styles.heroImg} resizeMode="contain" />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome back! 🐾</Text>
          <Text style={styles.subtitle}>Sign in to reconnect with your furry world</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Phone number, email, or username</Text>
            <TextInput
              style={styles.input}
              placeholder="Username, email, or phone (+91...)"
              placeholderTextColor={colors.foreground + "44"}
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 0 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.foreground + "44"}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push("/forgot-password")}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.7 }]} onPress={handleLogin} disabled={busy || otpLoginBusy}>
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Sign in</Text>
            }
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Phone OTP Login Option */}
          <TouchableOpacity 
            style={[styles.phoneOtpBtn, otpLoginBusy && { opacity: 0.7 }]} 
            onPress={handlePhoneOtpLogin} 
            disabled={busy || otpLoginBusy}
          >
            {otpLoginBusy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.phoneOtpBtnText}>📱  Log in with Phone OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialBtn, { marginTop: 12 }]} onPress={() => Alert.alert("Coming soon", "Apple Sign-in coming soon!")}>
            <Text style={styles.socialBtnText}>🍎  Continue with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { marginTop: 12 }]} onPress={() => Alert.alert("Coming soon", "Google Sign-in coming soon!")}>
            <Text style={styles.socialBtnText}>🌐  Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1 },
  hero: { height: height * 0.30, backgroundColor: "rgba(255,107,107,0.12)", alignItems: "center", justifyContent: "center" },
  heroImg: { width: "60%", height: "85%" },
  card: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -20, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, color: colors.foreground, lineHeight: 32 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground + "88", marginTop: 6, marginBottom: 20, lineHeight: 21 },
  field: { marginBottom: 16 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground + "99", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground, backgroundColor: colors.surface },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 16 },
  eyeBtn: { paddingVertical: 13, paddingLeft: 8 },
  eyeText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.primary },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 15, alignItems: "center" },
  primaryBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.foreground + "66" },
  phoneOtpBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 24, paddingVertical: 14, alignItems: "center", backgroundColor: colors.white },
  phoneOtpBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.primary },
  socialBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 24, paddingVertical: 14, alignItems: "center", backgroundColor: colors.white },
  socialBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground + "88" },
  footerLink: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.primary },
});
