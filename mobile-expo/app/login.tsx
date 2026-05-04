import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import {
  Mail,
  Lock,
  ChevronRight,
} from "@/components/ui/IconCompat";
import { useAuth, type UserRole } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

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
  const { login } = useAuth();
  const { colors, isDark } = useTheme();

  const selectedRole = "owner" as UserRole;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  // OTP is only for development builds / production, not Expo Go
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (isOtpMode) {
      if (!phone || phone.length !== 10) {
        Alert.alert("Error", "Please enter a valid 10-digit phone number");
        return;
      }

      setLoading(true);
      try {
        const auth = getFirebaseAuth();
        const phoneNumber = `+91${phone.trim()}`;

        if (auth) {
          console.log(`Requesting Login OTP for: ${phoneNumber}`);
          const confirmation = await auth().signInWithPhoneNumber(phoneNumber);

          router.push({
            pathname: "/otp-verify",
            params: {
              phone: phoneNumber,
              type: 'login',
              initialVerificationId: confirmation.verificationId,
            },
          });
        } else {
          // Fallback for Expo Go (development only)
          Alert.alert("Warning", "Phone verification is not available in Expo Go.");
          router.push({
            pathname: "/otp-verify",
            params: {
              phone: phoneNumber,
              type: 'login',
            },
          });
        }
      } catch (error: any) {
        console.error("Login OTP Error:", error);
        Alert.alert("Error", "Failed to send verification code. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password, selectedRole);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero gradient section */}
          <LinearGradient
            colors={isDark ? ["#1a2744", "#0f172a"] : [colors.brand + "18", colors.brand + "06"]}
            style={{ alignItems: "center", paddingTop: 40, paddingBottom: 36, paddingHorizontal: 24 }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 28,
                overflow: "hidden",
                marginBottom: 20,
                shadowColor: colors.brand,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              <Image
                source={
                  isDark
                    ? require("../assets/furrcircle_main_dark_logo.png")
                    : require("../assets/furrcircle_main_light_logo.png")
                }
                style={{ width: 100, height: 100 }}
                resizeMode="cover"
              />
            </View>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 }}>
              Welcome Back
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 6, textAlign: "center" }}>
              Sign in to your FurrCircle account
            </Text>
          </LinearGradient>

          {/* Form card */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              marginTop: -16,
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: 40,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {/* Section label */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Sign In
              </Text>
            </View>

            {isOtpMode ? (
              /* Phone Number Input for OTP Mode */
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.bgCard,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: 16,
                  overflow: "hidden",
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 16,
                    height: 54,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRightWidth: 1,
                    borderRightColor: colors.border,
                    backgroundColor: colors.bgSubtle,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>
                    +91
                  </Text>
                </View>
                <TextInput
                  placeholder="98765 43210"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    if (cleaned.length <= 10) setPhone(cleaned);
                  }}
                  keyboardType="number-pad"
                  maxLength={10}
                  style={{ flex: 1, height: 54, paddingHorizontal: 14, fontSize: 15, color: colors.textPrimary }}
                />
              </View>
            ) : (
              <>
                {/* Email */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.bgCard,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    marginBottom: 12,
                  }}
                >
                  <Mail size={18} color={colors.textMuted} />
                  <TextInput
                    placeholder="Email address"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ flex: 1, height: 54, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
                  />
                </View>

                {/* Password */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.bgCard,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    marginBottom: 10,
                  }}
                >
                  <Lock size={18} color={colors.textMuted} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={{ flex: 1, height: 54, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
                  />
                </View>
              </>
            )}

            {/* Forgot password */}
            {!isOtpMode && (
              <Pressable
                onPress={() => router.push("/forgot-password")}
                style={{ alignSelf: "flex-end", marginBottom: 28 }}
              >
                <Text style={{ fontSize: 13, color: colors.brand, fontWeight: "600" }}>
                  Forgot password?
                </Text>
              </Pressable>
            )}

            {/* Sign In button */}
            <LinearGradient
              colors={[colors.brand, colors.brand + "cc"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                marginBottom: 20,
                shadowColor: colors.brand,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={{
                  height: 56,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                      {isOtpMode ? "Get OTP" : "Sign In"}
                    </Text>
                    <ChevronRight size={18} color="#fff" />
                  </>
                )}
              </Pressable>
            </LinearGradient>

            {/* Divider */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "500" }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            {/* Sign up link */}
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>Don't have an account?</Text>
              <Pressable onPress={() => router.push("/signup")}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.brand }}>Sign Up</Text>
              </Pressable>
            </View>

            {/* Powered by */}
            <View style={{ marginTop: 'auto', paddingTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, opacity: 0.5 }}>
              <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Powered by
              </Text>
              <Image
                source={require("../assets/rhinon_tech_dark_logo.png")}
                style={{ width: 110, height: 26 }}
                resizeMode="contain"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
