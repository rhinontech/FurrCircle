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
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!username.trim() || !name.trim() || !trimmedEmail || !trimmedPhone || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }

    if (usernameCheck !== 'available') {
      Alert.alert("Invalid username", usernameError || "Please choose an available username.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    // Phone validation
    if (trimmedPhone.length < 10) {
      Alert.alert("Invalid phone number", "Phone number must be at least 10 digits long.");
      return;
    }

    const fullPhone = `+91${trimmedPhone}`;
    setBusy(true);

    try {
      // Create the account on the backend.
      // We pass emailOrPhone as the email address, which tells the backend to trigger the email OTP verification flow.
      const regRes = await authApi.register({
        username: username.trim().toLowerCase(),
        name: name.trim(),
        email: trimmedEmail.toLowerCase(),
        phone: fullPhone,
        emailOrPhone: trimmedEmail.toLowerCase(),
        password,
        role: "owner"
      });

      setBusy(false);

      if (regRes && regRes.token) {
        await setSession(regRes);
      } else {
        Alert.alert("Registration complete", "Verification needed.");
      }

    } catch (err: any) {
      setBusy(false);
      console.error("Signup registration error:", err);
      const backendMsg = err.response?.data?.message;
      Alert.alert("Sign up failed", backendMsg || err.message || "An error occurred. Please try again.");
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

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.foreground + "44"}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Phone number */}
          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.phonePrefix}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="9876543210"
                placeholderTextColor={colors.foreground + "44"}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={10}
                value={phone}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^0-9]/g, "");
                  setPhone(filtered);
                }}
              />
            </View>
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
  phoneInputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 16 },
  phonePrefix: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground, marginRight: 8, borderRightWidth: 1.5, borderRightColor: colors.border, paddingRight: 10 },
  phoneInput: { flex: 1, paddingVertical: 13, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground },
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
