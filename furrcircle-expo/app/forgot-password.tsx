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
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { colors } from "../src/lib/theme";
import { authApi } from "../services/auth/authApi";
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tk = useTokens();
  
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  const startsWithNumber = /^\d/.test(identifier);
  const prefixAnim = useRef(new Animated.Value(startsWithNumber ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(prefixAnim, {
      toValue: startsWithNumber ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [startsWithNumber]);

  const animWidth = prefixAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 46],
  });
  const animOpacity = prefixAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  async function handleSendResetCode() {
    let trimmedInput = identifier.trim();
    if (!trimmedInput) {
      Alert.alert("Missing field", "Please enter your username, email, or phone number.");
      return;
    }

    const isNumeric = /^\d+$/.test(trimmedInput);
    if (isNumeric) {
      if (trimmedInput.length !== 10) {
        Alert.alert("Invalid Phone Number", "Phone number must be exactly 10 digits.");
        return;
      }
      trimmedInput = `+91${trimmedInput}`;
    }

    setLoading(true);

    const isDirectPhone = /^[+0-9]+$/.test(trimmedInput);

    if (isDirectPhone) {
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
          const res = await authApi.forgotPassword(trimmedInput, true);
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
              const fallbackRes = await authApi.forgotPassword(trimmedInput, true);
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
    <PageContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.heroContainer}>
            <Image 
              source={require("../src/assets/doodle-puppy.png")} 
              style={styles.heroImg} 
              resizeMode="contain" 
            />
          </View>

          <GlassBlur style={[styles.card, { borderColor: tk.glassBorder }]}>
            <Text style={[styles.title, { color: tk.text }]}>Forgot Password? 🔑</Text>
            <Text style={[styles.subtitle, { color: tk.textMuted }]}>
              Enter your username, email, or phone number to reset your password.
            </Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: tk.textMuted }]}>Username, email, or phone</Text>
              <View style={{ backgroundColor: tk.glassChip, borderColor: tk.glassBorder, paddingLeft: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14 }}>
                <Animated.View style={{
                  width: animWidth,
                  opacity: animOpacity,
                  overflow: "hidden",
                  flexDirection: "row",
                  alignItems: "center",
                }}>
                  <View style={{ width: 46, flexDirection: "row", alignItems: "center" }}>
                    <Text style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 15,
                      color: tk.text,
                    }}>+91</Text>
                    <View style={{
                      width: 1.5,
                      height: 16,
                      backgroundColor: tk.glassBorder,
                      marginLeft: 8,
                      marginRight: 8,
                    }} />
                  </View>
                </Animated.View>
                <TextInput
                  style={{ flex: 1, paddingVertical: 13, paddingHorizontal: 0, fontFamily: "Inter_400Regular", fontSize: 15, color: tk.text }}
                  placeholder="Alex or you@example.com or +91..."
                  placeholderTextColor={tk.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </View>
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
          </GlassBlur>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 12, marginBottom: 20 },
  backText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.primary },
  heroContainer: { height: height * 0.22, width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: "transparent" },
  heroImg: { width: "50%", height: "100%" },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: '100%',
    marginBottom: 40,
    alignItems: 'center',
  },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  field: { width: '100%', marginBottom: 24 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "Inter_400Regular", fontSize: 15 },
  primaryBtn: { width: '100%', backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 15, alignItems: "center", justifyContent: 'center' },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
