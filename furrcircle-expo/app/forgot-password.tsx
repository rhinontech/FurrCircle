import React, { useState } from "react";
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
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { colors } from "../src/lib/theme";
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendResetCode() {
    const trimmedInput = identifier.trim();
    if (!trimmedInput) {
      Alert.alert("Missing field", "Please enter your username, email, or phone number.");
      return;
    }

    setLoading(true);

    const isDirectPhone = /^[+0-9]+$/.test(trimmedInput);

    if (isDirectPhone) {
      // Direct Phone Flow using Firebase
      try {
        const firebaseAuth = getFirebaseAuth();
        if (firebaseAuth) {
          console.log(`Requesting Firebase reset OTP for direct phone: ${trimmedInput}`);
          const confirmation = await firebaseAuth().signInWithPhoneNumber(trimmedInput);
          setLoading(false);
          router.push({
            pathname: "/otp-verify",
            params: {
              emailOrPhone: trimmedInput,
              initialVerificationId: confirmation.verificationId,
              type: "phone-verify-reset"
            }
          });
        } else {
          // Expo Go Fallback
          setLoading(false);
          Alert.alert("Warning", "Phone verification is not available in Expo Go. Navigating for mock reset.");
          router.push({
            pathname: "/otp-verify",
            params: {
              emailOrPhone: trimmedInput,
              type: "phone-verify-reset"
            }
          });
        }
      } catch (err: any) {
        console.warn("Firebase direct phone reset OTP failed. Falling back to backend SMS reset...", err);
        try {
          const res = await authApi.forgotPassword(trimmedInput, true); // useBackendOtp: true
          setLoading(false);
          if (res.success && res.method === "phone") {
            router.push({
              pathname: "/otp-verify",
              params: {
                userId: res.userId,
                emailOrPhone: res.emailOrPhone,
                type: "email-verify-reset"
              }
            });
          } else {
            Alert.alert("Error", "Could not verify your identity. Please try again.");
          }
        } catch (fallbackErr: any) {
          setLoading(false);
          console.error("Backend Forgot Password Fallback Error:", fallbackErr);
          Alert.alert("Error", fallbackErr.message || "Failed to send reset code via Firebase or backend SMS.");
        }
      }
    } else {
      // Email or Username Flow -> Ask backend to verify and send Email OTP (or return Phone number if phone-only)
      try {
        const res = await authApi.forgotPassword(trimmedInput);
        
        if (res.success && res.method === "email") {
          setLoading(false);
          router.push({
            pathname: "/otp-verify",
            params: {
              userId: res.userId,
              emailOrPhone: res.emailOrPhone,
              type: "email-verify-reset"
            }
          });
        } else if (res.success && res.method === "phone") {
          // If the account only has a phone number registered, backend returns the phone number to verify
          const phone = res.emailOrPhone;
          try {
            const firebaseAuth = getFirebaseAuth();
            if (firebaseAuth) {
              console.log(`Requesting Firebase reset OTP for phone: ${phone}`);
              const confirmation = await firebaseAuth().signInWithPhoneNumber(phone);
              setLoading(false);
              router.push({
                pathname: "/otp-verify",
                params: {
                  emailOrPhone: phone,
                  initialVerificationId: confirmation.verificationId,
                  type: "phone-verify-reset"
                }
              });
            } else {
              // Expo Go Fallback
              setLoading(false);
              Alert.alert("Warning", "Phone verification is not available in Expo Go. Navigating for mock reset.");
              router.push({
                pathname: "/otp-verify",
                params: {
                  emailOrPhone: phone,
                  type: "phone-verify-reset"
                }
              });
            }
          } catch (err: any) {
            console.warn("Firebase phone reset OTP failed (username/email lookup). Falling back to backend SMS reset...", err);
            try {
              const fallbackRes = await authApi.forgotPassword(trimmedInput, true); // useBackendOtp: true
              setLoading(false);
              if (fallbackRes.success) {
                router.push({
                  pathname: "/otp-verify",
                  params: {
                    userId: fallbackRes.userId,
                    emailOrPhone: fallbackRes.emailOrPhone,
                    type: "email-verify-reset"
                  }
                });
              } else {
                Alert.alert("Error", "Could not verify your identity. Please try again.");
              }
            } catch (fallbackErr: any) {
              setLoading(false);
              console.error("Backend Forgot Password Fallback Error:", fallbackErr);
              Alert.alert("Error", fallbackErr.message || "Failed to send reset code via Firebase or backend SMS.");
            }
          }
        } else {
          setLoading(false);
          Alert.alert("Error", "Could not verify your identity. Please try again.");
        }
      } catch (err: any) {
        setLoading(false);
        Alert.alert("Request Failed", err.message || "No account found with this identifier.");
      }
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.heroContainer}>
              <Image 
                source={require("../src/assets/doodle-puppy.png")} 
                style={styles.heroImg} 
                resizeMode="contain" 
              />
            </View>

            <Text style={styles.title}>Forgot Password? 🔑</Text>
            <Text style={styles.subtitle}>
              Enter your username, email, or phone number to reset your password.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Username, email, or phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Alex or you@example.com or +91..."
                placeholderTextColor={colors.foreground + "44"}
                autoCapitalize="none"
                autoCorrect={false}
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, loading && styles.disabledBtn]} 
              onPress={handleSendResetCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 12, marginBottom: 20 },
  backText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.primary },
  content: { flex: 1, alignItems: 'center', paddingTop: 10 },
  heroContainer: { height: height * 0.22, width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  heroImg: { width: "50%", height: "100%" },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, color: colors.foreground, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground + "77", textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  field: { width: '100%', marginBottom: 24 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground + "99", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground, backgroundColor: colors.surface },
  primaryBtn: { width: '100%', backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 15, alignItems: "center", justifyContent: 'center' },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
