import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { colors } from "../src/lib/theme";
import { useAuthStore } from "../src/lib/auth-store";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setBusy(true);
    const err = await login(email.trim(), password);
    setBusy(false);
    if (err) {
      Alert.alert("Login failed", err);
    } else {
      router.replace("/(tabs)");
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

          {/* Quick fill hint */}
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>🔑 Try: <Text style={styles.hintVal}>priya@furr.com</Text> / <Text style={styles.hintVal}>password123</Text></Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.foreground + "44"}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
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

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.7 }]} onPress={handleLogin} disabled={busy}>
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

          <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert("Coming soon", "Apple Sign-in coming soon!")}>
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
  hero: { height: height * 0.32, backgroundColor: "rgba(255,107,107,0.12)", alignItems: "center", justifyContent: "center" },
  heroImg: { width: "65%", height: "85%" },
  card: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -20, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, color: colors.foreground, lineHeight: 32 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground + "88", marginTop: 6, marginBottom: 20, lineHeight: 21 },
  hintBox: { backgroundColor: "rgba(37,99,235,0.07)", borderRadius: 12, padding: 12, marginBottom: 20 },
  hintText: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.foreground + "99" },
  hintVal: { fontFamily: "Inter_600SemiBold", color: colors.primary },
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
  socialBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 24, paddingVertical: 14, alignItems: "center", backgroundColor: colors.white },
  socialBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground + "88" },
  footerLink: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.primary },
});
