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
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

// Safe Firebase Auth Loader
const getFirebaseAuth = () => {
  if (Constants.appOwnership === 'expo' || Platform.OS === 'web') return null;
  try {
    return require("@react-native-firebase/auth").default;
  } catch {
    return null;
  }
};

export default function VerifyOtpPhoneScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { updateProfile } = useAuth();
  const params = useLocalSearchParams();
  const inputRef = useRef<TextInput>(null);

  // Extract phone from params
  const { phone } = params as { phone: string };

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<any>(null);
  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // 1. Send OTP on mount
  useEffect(() => {
    sendOtp();
  }, []);

  // 2. Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const sendOtp = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      Alert.alert("Warning", "Phone verification is not available in Expo Go. Please use a Development Build.");
      return;
    }

    try {
      setLoading(true);
      setIsResending(true);
      const confirmation = await auth().signInWithPhoneNumber(phone);
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
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code");
      return;
    }

    if (!confirm) {
      Alert.alert("Error", "OTP session not found. Please try resending.");
      return;
    }

    setLoading(true);
    try {
      // A. Verify Firebase Code
      await confirm.confirm(code);

      // B. Verification Success! Update profile
      await updateProfile({ phone });
      
      Alert.alert("Success", "Phone number updated successfully!", [
        { text: "Great!", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error("Verification Error:", error);
      Alert.alert("Verification Failed", "The code you entered is invalid or has expired.");
      setCode("");
    } finally {
      setLoading(false);
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
                backgroundColor: isFocused ? colors.brand + "08" : colors.bgCard,
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
                    elevation: isFocused ? 3 : 0,
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
              Verify Number
            </Text>
            
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ 
                fontSize: 15, 
                color: colors.textMuted, 
                textAlign: "center",
                lineHeight: 22
              }}>
                Enter the code sent to
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
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
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
                  Verify & Update
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
