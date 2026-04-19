import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  Heart,
  Mail,
  Lock,
  ChevronRight,
  PawPrint,
  Stethoscope,
  Building2,
} from "@/components/ui/IconCompat";
import { useAuth, type UserRole } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type LoginRole = "owner" | "shelter" | "veterinarian";

const ROLES: {
  key: LoginRole;
  label: string;
  icon: typeof PawPrint;
  heading: string;
  hint: string;
}[] = [
  {
    key: "owner",
    label: "Pet Owner",
    icon: PawPrint,
    heading: "Welcome back",
    hint: "Sign in to manage your pets and discover vets",
  },
  {
    key: "veterinarian",
    label: "Veterinarian",
    icon: Stethoscope,
    heading: "Vet Sign In",
    hint: "Sign in to manage appointments and patient records",
  },
  {
    key: "shelter",
    label: "Shelter",
    icon: Building2,
    heading: "Shelter Sign In",
    hint: "Sign in to manage your rescue listings and adoption requests",
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, isDark } = useTheme();

  const [selectedRole, setSelectedRole] = useState<LoginRole>("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const currentRole = ROLES.find((r) => r.key === selectedRole)!;

  const handleRolePress = (key: LoginRole) => {
    if (key === "shelter") {
      Alert.alert(
        "Coming Soon",
        "Shelter accounts are not available yet. Stay tuned!",
      );
      return;
    }
    setSelectedRole(key);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, selectedRole as UserRole);
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
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 40,
          }}
        >
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View>
              <Image
                source={
                  isDark
                    ? require("../assets/furrcircle_main_dark_logo.png")
                    : require("../assets/furrcircle_main_light_logo.png")
                }
                style={{ width: 150, height: 150 }}
                resizeMode="contain"
              />
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: colors.textPrimary,
              }}
            >
              Welcome Back
            </Text>
            <Text
              style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}
            >
              Sign in to your FurrCircle account
            </Text>
          </View>

          {/* Role Toggles */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colors.textMuted,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Sign in as...
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 28 }}>
            {ROLES.map(({ key, label, icon: Icon }) => (
              <Pressable
                key={key}
                onPress={() => handleRolePress(key)}
                style={{
                  flex: 1,
                  backgroundColor:
                    selectedRole === key ? colors.brand + "15" : colors.bgCard,
                  borderWidth: 1,
                  borderColor:
                    selectedRole === key ? colors.brand : colors.border,
                  borderRadius: 16,
                  padding: 12,
                  alignItems: "center",
                  gap: 6,
                  opacity: key === "shelter" ? 0.6 : 1,
                }}
              >
                <Icon
                  size={22}
                  color={selectedRole === key ? colors.brand : colors.textMuted}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: selectedRole === key ? "700" : "500",
                    color:
                      selectedRole === key ? colors.brand : colors.textPrimary,
                  }}
                >
                  {label}
                </Text>
                {key === "shelter" && (
                  <View
                    style={{
                      backgroundColor: colors.textMuted + "30",
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "700",
                        color: colors.textMuted,
                        textTransform: "uppercase",
                      }}
                    >
                      Soon
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* Heading + hint */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: 4,
            }}
          >
            {currentRole.heading}
          </Text>
          <Text
            style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}
          >
            {currentRole.hint}
          </Text>

          {/* Email */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.bgCard,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
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
              style={{
                flex: 1,
                height: 52,
                marginLeft: 12,
                fontSize: 15,
                color: colors.textPrimary,
              }}
            />
          </View>

          {/* Password */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.bgCard,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              paddingHorizontal: 16,
              marginBottom: 28,
            }}
          >
            <Lock size={18} color={colors.textMuted} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{
                flex: 1,
                height: 52,
                marginLeft: 12,
                fontSize: 15,
                color: colors.textPrimary,
              }}
            />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: colors.brand,
              borderRadius: 14,
              height: 54,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 16,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text
                  style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}
                >
                  Sign In
                </Text>
                <ChevronRight size={18} color="#fff" />
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push("/forgot-password")}
            style={{ alignItems: "center", marginBottom: 16 }}
          >
            <Text
              style={{ fontSize: 14, color: colors.brand, fontWeight: "600" }}
            >
              Forgot password?
            </Text>
          </Pressable>

          <View
            style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}
          >
            <Text style={{ fontSize: 14, color: colors.textMuted }}>
              Don't have an account?
            </Text>
            <Pressable onPress={() => router.push("/signup")}>
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: colors.brand }}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
