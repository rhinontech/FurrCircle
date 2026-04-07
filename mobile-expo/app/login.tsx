import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { Heart, Mail, Lock, ChevronRight, Stethoscope } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    try {
      await login(demoEmail, "mock-password");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Could not sign in to the demo account");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      // AuthContext handles state & persistence, router automatically handles redirect in layout
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 }}>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: colors.heroBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Heart size={36} color="#fff" fill="#fff" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary }}>Welcome Back</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>Sign in as a Pet Owner or Veterinarian</Text>
          </View>

          {/* Login Form */}
          <View style={{ marginBottom: 28 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>Welcome back</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>Sign in to continue</Text>

            <View style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.infoBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Stethoscope size={20} color="#0ea5e9" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Demo Vet Login</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Use the veterinarian dashboard instantly</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>Dr. Maya Singh · maya.vet@pawshub.app</Text>
              <Pressable
                onPress={() => handleDemoLogin("maya.vet@pawshub.app")}
                disabled={loading}
                style={{ backgroundColor: colors.infoBg, borderRadius: 14, paddingVertical: 13, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.brandText }}>Continue As Vet Demo</Text>
              </Pressable>
            </View>

            {/* Email */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, marginBottom: 12 }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, marginBottom: 24 }}>
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

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={{ backgroundColor: colors.brand, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Sign In</Text>
                  <ChevronRight size={18} color="#fff" />
                </>
              )}
            </Pressable>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>Don't have an account?</Text>
              <Pressable onPress={() => router.push("/signup")}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.brand }}>Sign Up</Text>
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
