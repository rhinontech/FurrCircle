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
  // Heart,
  Mail,
  Lock,
  User,
  ChevronRight,
  // PawPrint,
  // Stethoscope,
  // Building2,
  Phone,
  // MapPin,
} from "@/components/ui/IconCompat";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

// type SignupRole = "owner" | "shelter" | "veterinarian";

// const ROLES: { key: SignupRole; label: string; icon: typeof PawPrint }[] = [
//   { key: "owner", label: "Pet Owner", icon: PawPrint },
//   { key: "veterinarian", label: "Veterinarian", icon: Stethoscope },
//   // { key: "shelter", label: "Shelter", icon: Building2 },
// ];

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, isDark } = useTheme();

  // const [role, setRole] = useState<SignupRole>("owner");
  const role = "owner" as const;

  // const handleRolePress = (key: SignupRole) => {
  //   if (key === "shelter") {
  //     Alert.alert("Coming Soon", "Shelter accounts are not available yet. Stay tuned!");
  //     return;
  //   }
  //   setRole(key);
  // };

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Shelter-specific
  // const [shelterCity, setShelterCity] = useState("");

  // Vet-specific
  // const [vetHospital, setVetHospital] = useState("");
  // const [vetProfession, setVetProfession] = useState("");
  // const [vetCity, setVetCity] = useState("");

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password || !phone.trim()) {
      Alert.alert("Error", "Please fill in all required fields including phone number");
      return;
    }

    if (phone.length !== 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
      return;
    }

    const extra: Record<string, string> = {};

    // if (role === "shelter") {
    //   if (shelterCity.trim()) extra.city = shelterCity.trim();
    // } else if (role === "veterinarian") {
    //   if (vetHospital.trim()) extra.hospital_name = vetHospital.trim();
    //   if (vetProfession.trim()) extra.profession = vetProfession.trim();
    //   if (vetCity.trim()) extra.city = vetCity.trim();
    // }

    router.push({
      pathname: "/otp-verify",
      params: {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: `+91${phone.trim()}`,
        extraData: JSON.stringify(extra),
      },
    });
  };

  const inputRow = (icon: React.ReactNode, input: React.ReactNode) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgCard,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 16,
      }}
    >
      {icon}
      {input}
    </View>
  );

  const textInput = (props: React.ComponentProps<typeof TextInput>) => (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={{
        flex: 1,
        height: 54,
        marginLeft: 12,
        fontSize: 15,
        color: colors.textPrimary,
      }}
      {...props}
    />
  );

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
            style={{ alignItems: "center", paddingTop: 36, paddingBottom: 32, paddingHorizontal: 24 }}
          >
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 24,
                overflow: "hidden",
                marginBottom: 16,
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
                style={{ width: 90, height: 90 }}
                resizeMode="cover"
              />
            </View>
            <Text style={{ fontSize: 26, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 }}>
              Create Account
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 6, textAlign: "center" }}>
              Join the FurrCircle family today
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
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 20, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Your Details
            </Text>

            {/* Role Toggles — commented out: pet owners only */}
            {/* <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 8, textTransform: "uppercase" }}>
              I am a...
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
              {ROLES.map(({ key, label, icon: Icon }) => (
                <Pressable
                  key={key}
                  onPress={() => handleRolePress(key)}
                  style={{
                    flex: 1,
                    backgroundColor: role === key ? colors.brand + "15" : colors.bgCard,
                    borderWidth: 1,
                    borderColor: role === key ? colors.brand : colors.border,
                    borderRadius: 16,
                    padding: 12,
                    alignItems: "center",
                    gap: 6,
                    opacity: key === "shelter" ? 0.6 : 1,
                  }}
                >
                  <Icon size={22} color={role === key ? colors.brand : colors.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: role === key ? "700" : "500", color: role === key ? colors.brand : colors.textPrimary }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View> */}

            <View style={{ gap: 12, marginBottom: 32 }}>
              {/* Name */}
              {inputRow(
                <User size={18} color={colors.textMuted} />,
                textInput({ placeholder: "Full Name", value: name, onChangeText: setName }),
              )}

              {/* Email */}
              {inputRow(
                <Mail size={18} color={colors.textMuted} />,
                textInput({
                  placeholder: "Email address",
                  value: email,
                  onChangeText: setEmail,
                  keyboardType: "email-address",
                  autoCapitalize: "none",
                }),
              )}

              {/* Password */}
              {inputRow(
                <Lock size={18} color={colors.textMuted} />,
                textInput({ placeholder: "Password", value: password, onChangeText: setPassword, secureTextEntry: true }),
              )}

              {/* Phone Number */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.bgCard,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: 16,
                  overflow: "hidden",
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

              {/* Vet-specific fields — commented out */}
              {/* {role === "veterinarian" && (
                <>
                  {inputRow(<Building2 size={18} color={colors.textMuted} />, textInput({ placeholder: "Clinic / Hospital name (optional)", value: vetHospital, onChangeText: setVetHospital }))}
                  {inputRow(<Stethoscope size={18} color={colors.textMuted} />, textInput({ placeholder: "Specialty (optional)", value: vetProfession, onChangeText: setVetProfession }))}
                  {inputRow(<MapPin size={18} color={colors.textMuted} />, textInput({ placeholder: "City (optional)", value: vetCity, onChangeText: setVetCity }))}
                </>
              )} */}
            </View>

            {/* Vet verification note — commented out */}
            {/* {role === "veterinarian" && (
              <View style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
                  Veterinarian accounts require admin verification before you can access all features. You can log in after registering.
                </Text>
              </View>
            )} */}

            {/* Sign Up button */}
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
                onPress={handleSignup}
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
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Create Account</Text>
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

            {/* Sign in link */}
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>Already have an account?</Text>
              <Pressable onPress={() => router.push("/login")}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.brand }}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
