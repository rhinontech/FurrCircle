import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { Heart, Mail, Lock, User, ChevronRight, PawPrint, Stethoscope } from "lucide-react-native";
import { useAuth, type UserRole } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await register(name, email.trim(), password, role);
      // Registration successful, router will update via layout auth state
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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

          {/* Role Selection */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>I am a...</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <Pressable 
              onPress={() => setRole("owner")}
              style={{ flex: 1, backgroundColor: role === "owner" ? colors.brand + '15' : colors.bgCard, borderWidth: 1, borderColor: role === "owner" ? colors.brand : colors.border, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 }}
            >
              <PawPrint size={24} color={role === "owner" ? colors.brand : colors.textMuted} />
              <Text style={{ fontSize: 14, fontWeight: role === "owner" ? '700' : '500', color: role === "owner" ? colors.brand : colors.textPrimary }}>Pet Owner</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => setRole("veterinarian")}
              style={{ flex: 1, backgroundColor: role === "veterinarian" ? colors.brand + '15' : colors.bgCard, borderWidth: 1, borderColor: role === "veterinarian" ? colors.brand : colors.border, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 }}
            >
              <Stethoscope size={24} color={role === "veterinarian" ? colors.brand : colors.textMuted} />
              <Text style={{ fontSize: 14, fontWeight: role === "veterinarian" ? '700' : '500', color: role === "veterinarian" ? colors.brand : colors.textPrimary }}>Veterinarian</Text>
            </Pressable>
          </View>

          <View style={{ gap: 16, marginBottom: 32 }}>
            {/* Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16 }}>
              <User size={18} color={colors.textMuted} />
              <TextInput
                placeholder={role === "veterinarian" ? "Dr. Full Name" : "Full Name"}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                style={{ flex: 1, height: 52, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
              />
            </View>

            {/* Email */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16 }}>
              <Mail size={18} color={colors.textMuted} />
              <TextInput
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ flex: 1, height: 52, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
              />
            </View>

            {/* Password */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16 }}>
              <Lock size={18} color={colors.textMuted} />
              <TextInput
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{ flex: 1, height: 52, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
              />
            </View>
          </View>

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
