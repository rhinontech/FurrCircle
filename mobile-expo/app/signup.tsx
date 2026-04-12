import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { Heart, Mail, Lock, User, ChevronRight, PawPrint, Stethoscope, Building2, Phone, MapPin } from "lucide-react-native";
import { useAuth, type UserRole } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type SignupRole = "owner" | "shelter" | "veterinarian";

const ROLES: { key: SignupRole; label: string; icon: typeof PawPrint }[] = [
  { key: "owner", label: "Pet Owner", icon: PawPrint },
  { key: "veterinarian", label: "Veterinarian", icon: Stethoscope },
  { key: "shelter", label: "Shelter", icon: Building2 },
];

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();

  const [role, setRole] = useState<SignupRole>("owner");

  const handleRolePress = (key: SignupRole) => {
    if (key === "shelter") {
      Alert.alert("Coming Soon", "Shelter accounts are not available yet. Stay tuned!");
      return;
    }
    setRole(key);
  };
  const [loading, setLoading] = useState(false);

  // Shared fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Shelter-specific
  const [shelterPhone, setShelterPhone] = useState("");
  const [shelterCity, setShelterCity] = useState("");

  // Vet-specific
  const [vetHospital, setVetHospital] = useState("");
  const [vetProfession, setVetProfession] = useState("");
  const [vetPhone, setVetPhone] = useState("");
  const [vetCity, setVetCity] = useState("");

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const extra: Record<string, string> = {};
    if (role === "shelter") {
      if (shelterPhone.trim()) extra.phone_number = shelterPhone.trim();
      if (shelterCity.trim()) extra.city = shelterCity.trim();
    } else if (role === "veterinarian") {
      if (vetHospital.trim()) extra.hospital_name = vetHospital.trim();
      if (vetProfession.trim()) extra.profession = vetProfession.trim();
      if (vetPhone.trim()) extra.phone = vetPhone.trim();
      if (vetCity.trim()) extra.city = vetCity.trim();
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, role as UserRole, Object.keys(extra).length ? extra : undefined);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputRow = (icon: React.ReactNode, input: React.ReactNode) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16 }}>
      {icon}
      {input}
    </View>
  );

  const textInput = (props: React.ComponentProps<typeof TextInput>) => (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={{ flex: 1, height: 52, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
      {...props}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 }}>

          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.heroBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Heart size={32} color="#fff" fill="#fff" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary }}>Create Account</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>Join the PawsHub family today</Text>
          </View>

          {/* Role Toggles */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>I am a...</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            {ROLES.map(({ key, label, icon: Icon }) => (
              <Pressable
                key={key}
                onPress={() => handleRolePress(key)}
                style={{ flex: 1, backgroundColor: role === key ? colors.brand + '15' : colors.bgCard, borderWidth: 1, borderColor: role === key ? colors.brand : colors.border, borderRadius: 16, padding: 12, alignItems: 'center', gap: 6, opacity: key === 'shelter' ? 0.6 : 1 }}
              >
                <Icon size={22} color={role === key ? colors.brand : colors.textMuted} />
                <Text style={{ fontSize: 12, fontWeight: role === key ? '700' : '500', color: role === key ? colors.brand : colors.textPrimary }}>{label}</Text>
                {key === 'shelter' && (
                  <View style={{ backgroundColor: colors.textMuted + '30', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' }}>Soon</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <View style={{ gap: 12, marginBottom: 32 }}>
            {/* Name — label varies by role */}
            {inputRow(
              <User size={18} color={colors.textMuted} />,
              textInput({
                placeholder: role === "veterinarian" ? "Dr. Full Name" : role === "shelter" ? "Shelter / Organization Name" : "Full Name",
                value: name,
                onChangeText: setName,
              })
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
              })
            )}

            {/* Password */}
            {inputRow(
              <Lock size={18} color={colors.textMuted} />,
              textInput({
                placeholder: "Password",
                value: password,
                onChangeText: setPassword,
                secureTextEntry: true,
              })
            )}

            {/* Shelter-specific fields */}
            {role === "shelter" && (
              <>
                {inputRow(
                  <Phone size={18} color={colors.textMuted} />,
                  textInput({
                    placeholder: "Phone number (optional)",
                    value: shelterPhone,
                    onChangeText: setShelterPhone,
                    keyboardType: "phone-pad",
                  })
                )}
                {inputRow(
                  <MapPin size={18} color={colors.textMuted} />,
                  textInput({
                    placeholder: "City (optional)",
                    value: shelterCity,
                    onChangeText: setShelterCity,
                  })
                )}
              </>
            )}

            {/* Vet-specific fields */}
            {role === "veterinarian" && (
              <>
                {inputRow(
                  <Building2 size={18} color={colors.textMuted} />,
                  textInput({
                    placeholder: "Clinic / Hospital name (optional)",
                    value: vetHospital,
                    onChangeText: setVetHospital,
                  })
                )}
                {inputRow(
                  <Stethoscope size={18} color={colors.textMuted} />,
                  textInput({
                    placeholder: "Specialty (optional)",
                    value: vetProfession,
                    onChangeText: setVetProfession,
                  })
                )}
                {inputRow(
                  <Phone size={18} color={colors.textMuted} />,
                  textInput({
                    placeholder: "Phone number (optional)",
                    value: vetPhone,
                    onChangeText: setVetPhone,
                    keyboardType: "phone-pad",
                  })
                )}
                {inputRow(
                  <MapPin size={18} color={colors.textMuted} />,
                  textInput({
                    placeholder: "City (optional)",
                    value: vetCity,
                    onChangeText: setVetCity,
                  })
                )}
              </>
            )}
          </View>

          {role === "veterinarian" && (
            <View style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
                Veterinarian accounts require admin verification before you can access all features. You can log in after registering.
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleSignup}
            disabled={loading}
            style={{ backgroundColor: colors.brand, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Sign Up</Text>
                <ChevronRight size={18} color="#fff" />
              </>
            )}
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>Already have an account?</Text>
            <Pressable onPress={() => router.push("/login")}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.brand }}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
