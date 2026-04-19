import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Heart, Home, CheckCircle } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userAdoptionsApi } from "@/services/users/adoptionsApi";

type ApplicationType = "adoption" | "foster";

export default function ApplyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    petId: string;
    petName?: string;
    applicationType?: ApplicationType;
  }>();

  const [applicationType, setApplicationType] = useState<ApplicationType>(
    params.applicationType === "foster" ? "foster" : "adoption"
  );
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const petName = params.petName || "this pet";

  const handleSubmit = async () => {
    if (!params.petId) {
      setError("No pet selected.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await userAdoptionsApi.submit({
        petId: params.petId,
        type: applicationType,
        message: message.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <View style={{ paddingTop: 16, paddingBottom: 20 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.bgCard,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        {!done ? (
          <>
            {/* Header */}
            <View style={{ marginBottom: 28 }}>
              <Text
                style={{ fontSize: 24, fontWeight: "800", color: colors.textPrimary, marginBottom: 8 }}
              >
                Apply for {petName}
              </Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }}>
                Tell the owner a bit about yourself and why you'd be a great match.
              </Text>
            </View>

            {/* Type toggle */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 10 }}
              >
                Application Type
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {(["adoption", "foster"] as ApplicationType[]).map((t) => {
                  const isActive = applicationType === t;
                  const Icon = t === "adoption" ? Heart : Home;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setApplicationType(t)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 14,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: isActive ? colors.brand : colors.border,
                        backgroundColor: isActive ? colors.brand + "15" : colors.bgCard,
                      }}
                    >
                      <Icon
                        size={18}
                        color={isActive ? colors.brand : colors.textMuted}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: isActive ? colors.brand : colors.textMuted,
                          textTransform: "capitalize",
                        }}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Your Info */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}
              >
                Your Name
              </Text>
              <TextInput
                value={user?.name || ""}
                editable={false}
                style={[inputStyle, { opacity: 0.6 }]}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}
              >
                Phone Number
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Your contact number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={inputStyle}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}
              >
                City
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Where do you live?"
                placeholderTextColor={colors.textMuted}
                style={inputStyle}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}
              >
                Message to the Owner
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder={`Tell them why you'd be a great ${applicationType} family for ${petName}...`}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={[inputStyle, { minHeight: 120, paddingTop: 14 }]}
              />
            </View>

            {error ? (
              <View
                style={{
                  backgroundColor: "#ef444420",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 13, color: "#ef4444" }}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: colors.brand,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                  Submit Application
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          /* Success */
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#10b981" + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={40} color="#10b981" />
            </View>
            <Text
              style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary, textAlign: "center" }}
            >
              Application Sent!
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 22,
                maxWidth: 280,
              }}
            >
              Your {applicationType} application for {petName} has been submitted. The owner will
              review it and get back to you.
            </Text>
            <Pressable
              onPress={() => router.replace("/(tabs)/discover")}
              style={{
                marginTop: 8,
                backgroundColor: colors.brand,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 32,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                Back to Discover
              </Text>
            </Pressable>
            <Pressable onPress={() => router.back()}>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>Go Back</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
