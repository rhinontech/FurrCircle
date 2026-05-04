import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { ChevronLeft, ShieldCheck, Clock, PawPrint } from "@/components/ui/IconCompat";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth, type UserRole } from "../contexts/AuthContext";

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
  const { colors, isDark } = useTheme();
  const { register, loginOtp } = useAuth();
  const params = useLocalSearchParams();
  const inputRef = useRef<TextInput>(null);

  // Extract user data from params
  const { name, email, password, role, phone, extraData, type } = params as any;
  const extra = extraData ? JSON.parse(extraData) : {};

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<any>(null);
  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // 1. Initial setup (Auto-send moved to signup button)
  // useEffect(() => {
  //   // If we came from signup, the SMS is already on its way.
  //   // We just need to wait for the user to enter the code.
  // }, []);

  // 2. Timer logic
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const isSendingRef = useRef(false);
  const sendOtp = async () => {
    if (isSendingRef.current) {
      console.log("OTP send already in progress, skipping...");
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      Alert.alert("Warning", "Phone verification is not available in Expo Go. Please use a Development Build.");
      return;
    }

    try {
      console.log(`Requesting OTP for: ${phone}`);
      setLoading(true);
      setIsResending(true);
      isSendingRef.current = true;
      
      const confirmation = await auth().signInWithPhoneNumber(phone as string);
      
      console.log("OTP sent successfully, session created.");
      setConfirm(confirmation);
      setTimer(60);
      setCode("");
    } catch (error: any) {
      console.error("Firebase SMS Error:", error);
      Alert.alert("Error", "Failed to send SMS. Please check the phone number and try again.");
      router.back();
    } finally {
      setLoading(false);
      setIsResending(false);
      isSendingRef.current = false;
    }
  };

  const isVerifyingRef = useRef(false);
  const handleVerify = async () => {
    if (isVerifyingRef.current) return;
    
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code");
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      Alert.alert("Error", "Auth service unavailable.");
      return;
    }

    // Check if we have an active session (either from resend or from signup)
    const verificationId = confirm?.verificationId || params.initialVerificationId as string;

    if (!verificationId && !confirm) {
      Alert.alert("Error", "Verification session not found. Please try resending the code.");
      return;
    }

    setLoading(true);
    isVerifyingRef.current = true;
    try {
      console.log("Attempting to verify code...");
      
      if (confirm) {
        // Use the confirmation result object if available (e.g. from a Resend)
        await confirm.confirm(code);
      } else {
        // Use the verification ID from the signup screen
        const credential = auth.PhoneAuthProvider.credential(verificationId, code);
        await auth().signInWithCredential(credential);
      }
      
      console.log("Firebase verification successful!");

      try {
        if (type === 'login') {
          await loginOtp(phone as string);
        } else {
          await register(
            name as string,
            email as string,
            password as string,
            role as UserRole,
            { ...extra, phone: phone as string, phone_number: phone as string }
          );
        }
      } catch (backendError: any) {
        console.error("Backend Error:", backendError);
        Alert.alert("Action Failed", backendError.message || "Could not complete the process. Please try again.");
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      const errorCode = error?.code || "";
      if (errorCode.includes("invalid-verification-code")) {
        Alert.alert("Wrong Code", "The code you entered is incorrect. Please try again.");
      } else if (errorCode.includes("code-expired") || errorCode.includes("session-expired")) {
        Alert.alert("Code Expired", "This code has expired. Please request a new one.");
      } else if (errorCode.includes("too-many-requests")) {
        Alert.alert("Too Many Attempts", "Too many failed attempts. Please wait a few minutes before trying again.");
      } else {
        Alert.alert("Verification Failed", "The code you entered is invalid or has expired.");
      }
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
    }
  };

  const renderOtpBoxes = () => {
    return (
      <Pressable 
        onPress={() => inputRef.current?.focus()}
        style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          width: '100%', 
          paddingHorizontal: 4,
          marginBottom: 32
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const char = code[index] || "";
          const isFocused = code.length === index;
          const isFilled = code.length > index;

          return (
            <View
              key={index}
              style={{
                width: 46,
                height: 56,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: isFocused ? colors.brand : (isFilled ? colors.brand + "40" : colors.border),
                backgroundColor: isFocused ? (isDark ? "#1a243d" : "#f0f4ff") : colors.bgCard,
                justifyContent: 'center',
                alignItems: 'center',
                ...Platform.select({
                  ios: {
                    shadowColor: colors.brand,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isFocused ? 0.15 : 0,
                    shadowRadius: 8,
                  },
                  android: {
                    // Removed elevation to fix internal shadow artifacts on some Android devices
                  }
                })
              }}
            >
              <Text style={{ 
                fontSize: 22, 
                fontWeight: '700', 
                color: isFocused || isFilled ? colors.textPrimary : colors.textMuted 
              }}>
                {char}
              </Text>
            </View>
          );
        })}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable 
            onPress={() => router.back()} 
            style={{ 
              width: 44, 
              height: 44, 
              borderRadius: 22, 
              backgroundColor: colors.bgCard,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 32
            }}
          >
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Pressable>

          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View style={{ marginBottom: 24 }}>
              <View style={{ 
                width: 88, 
                height: 88, 
                borderRadius: 44, 
                backgroundColor: colors.brand + "10", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                <View style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: 32, 
                  backgroundColor: colors.brand + "20", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <ShieldCheck size={36} color={colors.brand} />
                </View>
                <View style={{ 
                  position: 'absolute', 
                  bottom: -2, 
                  right: -2, 
                  backgroundColor: colors.bg, 
                  padding: 6, 
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.bg
                }}>
                  <PawPrint size={20} color={colors.brand} />
                </View>
              </View>
            </View>

            <Text style={{ 
              fontSize: 28, 
              fontWeight: "900", 
              color: colors.textPrimary,
              textAlign: 'center'
            }}>
              Verify Account
            </Text>
            
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ 
                fontSize: 15, 
                color: colors.textMuted, 
                textAlign: "center",
                lineHeight: 22
              }}>
                We've sent a code to your phone
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontWeight: "700", color: colors.textPrimary, fontSize: 16 }}>{phone}</Text>
                <Pressable onPress={() => router.back()} style={{ marginLeft: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.brand, fontWeight: '700' }}>Edit</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={{ width: '100%' }}>
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
              caretHidden={true}
              selectionColor="transparent"
              cursorColor="transparent"
              underlineColorAndroid="transparent"
              style={{ 
                position: 'absolute', 
                opacity: 0, 
                width: 1, 
                height: 1,
                left: -100, // Move it off-screen for extra safety
              }}
              autoFocus
            />

            <Pressable
              onPress={handleVerify}
              disabled={loading || code.length < 6}
              style={{
                backgroundColor: colors.brand,
                height: 58,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                opacity: (loading || code.length < 6) ? 0.7 : 1,
                shadowColor: colors.brand,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>
                  Continue
                </Text>
              )}
            </Pressable>

            <View style={{ alignItems: "center", marginTop: 24 }}>
              {timer > 0 ? (
                <View style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  gap: 8,
                  backgroundColor: colors.bgCard,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <Clock size={16} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '600' }}>
                    Resend in <Text style={{ color: colors.textPrimary }}>{timer}s</Text>
                  </Text>
                </View>
              ) : (
                <Pressable 
                  onPress={sendOtp} 
                  disabled={isResending}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 15 }}>
                    Resend Code
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

