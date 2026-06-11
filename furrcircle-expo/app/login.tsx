import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import Constants from "expo-constants";
import { colors } from "../src/lib/theme";
import { useAuthStore } from "../src/lib/auth-store";
import { authApi } from "../services/auth/authApi";
import { Eye, EyeOff } from "../src/components/ui/icons";
import { requestNotificationPermissionEarly } from "../helpers/requestNotificationPermission";
import { PageContainer } from "../src/components/PageContainer";
import { GlassBlur } from "../src/components/ui/Glass";
import { useTokens, useThemeStore } from "../src/lib/theme-store";

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
  const insets = useSafeAreaInsets();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [otpLoginBusy, setOtpLoginBusy] = useState(false);
  const [notifDenied, setNotifDenied] = useState(false);

  useEffect(() => {
    requestNotificationPermissionEarly().then((result) => {
      if (result === 'denied') setNotifDenied(true);
    });
  }, []);

  async function handleLogin() {
    let trimmed = identifier.trim();
    if (!trimmed || !password) {
      Alert.alert("Missing fields", "Please enter your username/email/phone and password.");
      return;
    }

    const isNumeric = /^\d+$/.test(trimmed);
    if (isNumeric) {
      if (trimmed.length !== 10) {
        Alert.alert("Invalid Phone Number", "Phone number must be exactly 10 digits.");
        return;
      }
      trimmed = `+91${trimmed}`;
    }

    setBusy(true);
    const err = await login(trimmed, password);
    setBusy(false);

    if (err) {
      if (err.startsWith("unverified:")) {
        const parts = err.split(":");
        const userId = parts[1];
        const emailOrPhone = parts.slice(2).join(":");
        router.push({
          pathname: "/otp-verify",
          params: {
            userId,
            emailOrPhone,
            type: "email-verify-login"
          }
        });
      } else if (err.startsWith("2fa:")) {
        const parts = err.split(":");
        const userId = parts[1];
        const emailOrPhone = parts.slice(2).join(":");
        router.push({
          pathname: "/otp-verify",
          params: {
            userId,
            emailOrPhone,
            type: "email-verify-login"
          }
        });
      } else {
        Alert.alert("Login failed", err);
      }
    } else {
      router.replace("/(tabs)");
    }
  }

  return (
    <PageContainer>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={[styles.hero, { paddingTop: insets.top, height: height * 0.30 + insets.top }]}>
            <Image source={require("../src/assets/doodle-puppy.png")} style={styles.heroImg} resizeMode="contain" />
          </View>

          <GlassBlur style={[styles.card, { paddingBottom: 40 + insets.bottom, borderColor: tk.glassBorder }]}>
            <Text style={[styles.title, { color: tk.text }]}>Welcome back! 🐾</Text>
            <Text style={[styles.subtitle, { color: tk.textMuted }]}>Sign in to reconnect with your furry world</Text>

            {notifDenied && (
              <View style={[styles.notifBanner, { backgroundColor: dark ? "rgba(251,191,36,0.08)" : "rgba(251,191,36,0.12)", borderColor: dark ? "rgba(251,191,36,0.2)" : "rgba(251,191,36,0.35)" }]}>
                <Text style={[styles.notifBannerText, { color: dark ? "#f59e0b" : "#92400e" }]}>
                  🔔 Notifications are off. OTP codes will still arrive via email or SMS, but enable notifications in Settings for the best experience.
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: tk.textMuted }]}>Phone number, email, or username</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tk.glassChip, borderColor: tk.glassBorder, color: tk.text }]}
                placeholder="Username, email, or phone (+91...)"
                placeholderTextColor={tk.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: tk.textMuted }]}>Password</Text>
              <View style={[styles.inputRow, { backgroundColor: tk.glassChip, borderColor: tk.glassBorder }]}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 0, color: tk.text, backgroundColor: "transparent" }]}
                  placeholder="••••••••"
                  placeholderTextColor={tk.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  {showPassword ? (
                    <EyeOff size={20} color={colors.primary} />
                  ) : (
                    <Eye size={20} color={colors.primary} />
                  )}
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
              <View style={[styles.dividerLine, { backgroundColor: tk.border }]} />
              <Text style={[styles.dividerText, { color: tk.textMuted }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: tk.border }]} />
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: tk.textMuted }]}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/signup")}>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </GlassBlur>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  scroll: { flexGrow: 1 },
  hero: { height: height * 0.30, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  heroImg: { width: "60%", height: "85%" },
  card: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    paddingHorizontal: 28,
    paddingTop: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, lineHeight: 32 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 6, marginBottom: 20, lineHeight: 21 },
  field: { marginBottom: 16 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "Inter_400Regular", fontSize: 15 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, paddingRight: 16 },
  eyeBtn: { paddingVertical: 13, paddingLeft: 8 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.primary },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 15, alignItems: "center" },
  primaryBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  footerLink: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.primary },
  notifBanner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  notifBannerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
});
