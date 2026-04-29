import React, { useState } from "react";
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ChevronRight } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";

export default function ChangePhoneScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [phone, setPhone] = useState("");

  const handleNext = () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit phone number");
      return;
    }
    router.replace({
      pathname: "/profile/verify-otp",
      params: {
        phone: `+91${phone}`
      }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} keyboardShouldPersistTaps="handled">
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
            <ArrowLeft size={24} color={colors.textPrimary} />
          </Pressable>

          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.textPrimary }}>Change Phone</Text>
            <Text style={{ fontSize: 15, color: colors.textMuted, marginTop: 10, lineHeight: 24 }}>
              Enter your new mobile number. We'll send a verification code to confirm it's you.
            </Text>
          </View>

          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSecondary, marginBottom: 12, marginLeft: 4 }}>New Phone Number</Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: "hidden" }}>
              <View style={{ paddingHorizontal: 20, height: 60, justifyContent: "center", alignItems: "center", borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.bgCard }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>+91</Text>
              </View>
              <TextInput
                placeholder="98765 43210"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, "").slice(0, 10))}
                keyboardType="number-pad"
                autoFocus
                style={{ flex: 1, height: 60, paddingHorizontal: 18, fontSize: 18, fontWeight: "700", color: colors.textPrimary }}
              />
            </View>
          </View>

          <Pressable
            onPress={handleNext}
            disabled={phone.length < 10}
            style={{
              backgroundColor: colors.brand,
              height: 60,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
              opacity: phone.length < 10 ? 0.6 : 1,
              shadowColor: colors.brand,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>Send Code</Text>
            <ChevronRight size={22} color="#fff" />
          </Pressable>
          
          <View style={{ marginTop: 24, padding: 16, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
            <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
              Updating your phone number will affect how you sign in. Please make sure you have access to the new number.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
