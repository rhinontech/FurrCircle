import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import Constants from "expo-constants";
import { colors } from "../src/lib/theme";
import { authApi } from "../services/auth/authApi";
import { useAuthStore } from "../src/lib/auth-store";
import { Eye, EyeOff } from "lucide-react-native";

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

export default function SignupScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  // Live username check state
  const [usernameCheck, setUsernameCheck] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState("");
  const checkTimeoutRef = useRef<any>(null);

  // Debounced live username checking
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      setUsernameCheck('idle');
      setUsernameError("");
      return;
    }

    if (trimmedUsername.length < 3) {
      setUsernameCheck('invalid');
      setUsernameError("Must be at least 3 characters");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setUsernameCheck('invalid');
      setUsernameError("Only letters, numbers, underscores, and periods allowed");
      return;
    }

    setUsernameCheck('checking');
    setUsernameError("");

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(trimmedUsername);
        if (res.available) {
          setUsernameCheck('available');
        } else {
          setUsernameCheck('taken');
          setUsernameError("This username is already taken");
        }
      } catch (err: any) {
        setUsernameCheck('invalid');
        setUsernameError(err.message || "Failed to check username");
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [username]);

  async function handleSignup() {
    if (!username.trim() || !name.trim() || !emailOrPhone.trim() || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }

    if (usernameCheck !== 'available') {
      Alert.alert("Invalid username", usernameError || "Please choose an available username.");
      return;
    }

    const trimmedInput = emailOrPhone.trim();
    const isEmail = trimmedInput.includes("@");

    setBusy(true);

    if (isEmail) {
      // Email flow -> register first, get unverified state, then verify OTP
      try {
        const res = await authApi.register({
          username: username.trim().toLowerCase(),
          name: name.trim(),
          emailOrPhone: trimmedInput.toLowerCase(),
          password,
          role: "owner"
        });

        setBusy(false);

        if (res && res.success === true && res.isVerified === false) {
          const smsFailed = res.smsFailed === true;
          if (smsFailed) {
            Alert.alert(
              "Account Saved ✅",
              "Your account has been created but we couldn't send the verification email right now. Please tap \"Resend\" on the next screen to try again.",
              [{
                text: "Continue to Verify",
                onPress: () => router.push({
                  pathname: "/otp-verify",
                  params: {
                    userId: res.userId,
                    emailOrPhone: res.emailOrPhone,
                    type: "email-verify-signup"
                  }
                })
              }]
            );
          } else {
            router.push({
              pathname: "/otp-verify",
              params: {
                userId: res.userId,
                emailOrPhone: res.emailOrPhone,
                type: "email-verify-signup"
              }
            });
          }
        } else {
          Alert.alert("Registration complete", "Verification needed.");
        }

      } catch (err: any) {
        setBusy(false);
        const backendMsg = err.response?.data?.message;
        Alert.alert("Sign up failed", backendMsg || err.message || "An error occurred.");
      }
    } else {
      // Phone flow:
      // 1. Register account with backend FIRST (saves details regardless of OTP outcome)
      // 2. Then send Firebase OTP — if that fails, fall back to backend SMS resend
      try {
        // Step 1: Create the account on the backend (unverified, with backend OTP)
        const regRes = await authApi.register({
          username: username.trim().toLowerCase(),
          name: name.trim(),
          emailOrPhone: trimmedInput,
          password,
          role: "owner",
          useBackendOtp: true,       // creates account as unverified + sends SMS
        });

        // Account saved ✅ — whether SMS was sent or not, the user exists in DB.
        // smsFailed means the SMS couldn't go out but the account IS created.
        const userId = regRes?.userId;
        const emailOrPhone = regRes?.emailOrPhone || trimmedInput;
        const smsFailed = regRes?.smsFailed === true;

        // Step 2: Also try Firebase OTP in parallel for better delivery
        const firebaseAuth = getFirebaseAuth();
        if (firebaseAuth && !smsFailed) {
          try {
            console.log(`Requesting Firebase Phone OTP for: ${trimmedInput}`);
            const confirmation = await firebaseAuth().signInWithPhoneNumber(trimmedInput);
            setBusy(false);

            // Firebase OTP sent → use Firebase-based OTP screen
            router.push({
              pathname: "/otp-verify",
              params: {
                username: username.trim().toLowerCase(),
                name: name.trim(),
                emailOrPhone: trimmedInput,
                password,
                initialVerificationId: confirmation.verificationId,
                type: "phone-verify-signup"
              }
            });
            return;
          } catch (firebaseErr: any) {
            // Firebase failed — fall through to backend SMS OTP screen below
            console.warn("Firebase OTP also failed after backend registration, using backend SMS:", firebaseErr);
          }
        }

        // Backend SMS OTP (or smsFailed fallback)
        setBusy(false);

        if (smsFailed) {
          // OTP couldn't be sent right now, but account IS created.
          // Take the user to OTP screen — they can tap Resend once SMS service is back.
          Alert.alert(
            "Account Saved ✅",
            "Your account has been created but we couldn't send the verification code right now. Please tap \"Resend\" on the next screen to try again.",
            [{
              text: "Continue to Verify",
              onPress: () => router.push({
                pathname: "/otp-verify",
                params: { userId, emailOrPhone, type: "email-verify-signup" }
              })
            }]
          );
        } else {
          // SMS sent via backend → use backend OTP screen
          router.push({
            pathname: "/otp-verify",
            params: { userId, emailOrPhone, type: "email-verify-signup" }
          });
        }

      } catch (err: any) {
        setBusy(false);
        console.error("Phone signup registration error:", err);
        const backendMsg = err.response?.data?.message;
        Alert.alert("Sign up failed", backendMsg || err.message || "An error occurred. Please try again.");
      }
    }

  }

  const renderUsernameStatus = () => {
    switch (usernameCheck) {
      case 'checking':
        return <ActivityIndicator size="small" color={colors.primary} style={styles.statusLoader} />;
      case 'available':
        return <Text style={styles.statusAvailable}>✓ Available</Text>;
      case 'taken':
      case 'invalid':
        return <Text style={styles.statusError}>✗ {usernameError}</Text>;
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={[styles.hero, { paddingTop: insets.top, height: height * 0.28 + insets.top }]}>
          <Image source={require("../src/assets/doodle-boy-dog.png")} style={styles.heroImg} resizeMode="contain" />
        </View>

        <View style={[styles.card, { paddingBottom: 40 + insets.bottom }]}>
          <Text style={styles.title}>Join FurrCircle 🐶</Text>
          <Text style={styles.subtitle}>Create your free account and start your pet journey</Text>

          {/* Username */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Username</Text>
              {renderUsernameStatus()}
            </View>
            <TextInput
              style={[
                styles.input,
                usernameCheck === 'available' && styles.inputSuccess,
                (usernameCheck === 'taken' || usernameCheck === 'invalid') && styles.inputErrorStyle
              ]}
              placeholder="e.g. alex_johnson"
              placeholderTextColor={colors.foreground + "44"}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
            />
          </View>

          {/* Full name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Alex Johnson"
              placeholderTextColor={colors.foreground + "44"}
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Phone or email */}
          <View style={styles.field}>
            <Text style={styles.label}>Phone number or email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com or +919876543210"
              placeholderTextColor={colors.foreground + "44"}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
            />
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 0 }]}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.foreground + "44"}
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

          <Text style={styles.terms}>
            By signing up, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>

          <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.7 }]} onPress={handleSignup} disabled={busy}>
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Create account</Text>
            }
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert("Coming soon", "Apple Sign-in coming soon!")}>
            <Text style={styles.socialBtnText}>🍎  Continue with Apple</Text>
          </TouchableOpacity> */}
          {/* <TouchableOpacity style={[styles.socialBtn, { marginTop: 12 }]} onPress={() => Alert.alert("Coming soon", "Google Sign-in coming soon!")}>
            <Text style={styles.socialBtnText}>🌐  Continue with Google</Text>
          </TouchableOpacity> */}

          <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 0 }]}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.footerLink}>Sign in</Text>
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
  hero: { height: height * 0.28, backgroundColor: "rgba(37,99,235,0.09)", alignItems: "center", justifyContent: "center" },
  heroImg: { width: "55%", height: "85%" },
  card: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -20, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, color: colors.foreground, lineHeight: 32 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground + "88", marginTop: 6, marginBottom: 28, lineHeight: 21 },
  field: { marginBottom: 16 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom:0 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground + "99", marginBottom:6 },
  statusLoader: { marginRight: 4 },
  statusAvailable: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "green" },
  statusError: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "red", flex: 1, textAlign: "right", marginLeft: 8 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground, backgroundColor: colors.surface },
  inputSuccess: { borderColor: "green" },
  inputErrorStyle: { borderColor: "red" },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, paddingRight: 16 },
  eyeBtn: { paddingVertical: 13, paddingLeft: 8 },
  eyeText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary },
  terms: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.foreground + "77", lineHeight: 18, marginBottom: 24 },
  termsLink: { fontFamily: "Inter_600SemiBold", color: colors.primary },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 15, alignItems: "center" },
  primaryBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.foreground + "66" },
  socialBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 24, paddingVertical: 14, alignItems: "center", backgroundColor: colors.white },
  socialBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground + "88" },
  footerLink: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.primary },
});
