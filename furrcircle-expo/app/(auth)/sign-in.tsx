import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AmbientBackground, GlassCard, glassSurface, Text } from "../../src/components/ui";
import { Button } from "../../src/components/ui/Button";
import type { Role } from "../../src/data/types";
import { useSession } from "../../src/store/session";
import { radius, spacing, useTheme } from "../../src/theme";

const roleCopy: Record<Role, { title: string; blurb: string }> = {
  owner: { title: "Create your owner account", blurb: "Pets, records and appointments in one place." },
  vet: { title: "Create your professional account", blurb: "Verification is reviewed before you can consult." },
  shelter: { title: "Create your rescue account", blurb: "List adoptables and raise alerts in your city." },
};

export default function SignIn() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useSession();
  const params = useLocalSearchParams<{ role?: Role }>();
  const role: Role = params.role ?? "owner";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const copy = roleCopy[role];
  const canSubmit = identifier.trim().length > 3 && password.length >= 6;

  const submit = () => {
    setBusy(true);
    // Stands in for the auth call. The account is registered under the role the
    // person picked — never silently as an owner.
    setTimeout(() => {
      setBusy(false);
      signIn([role]);
      router.replace(role === "vet" ? "/(vet)/today" : "/(owner)/today");
    }, 550);
  };

  const field = (
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    opts: { secure?: boolean; icon: React.ComponentProps<typeof Ionicons>["name"]; keyboard?: "email-address" | "default" },
  ) => (
    <View
      style={[
        glassSurface(tk),
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          height: 52,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
        },
      ]}
    >
      <Ionicons name={opts.icon} size={17} color={tk.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={tk.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={opts.keyboard ?? "default"}
        secureTextEntry={opts.secure && !showPassword}
        style={{ flex: 1, color: tk.text, fontSize: 15, fontWeight: "500" }}
      />
      {opts.secure ? (
        <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={17} color={tk.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <AmbientBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + spacing.lg,
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing["3xl"],
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={[
              glassSurface(tk, "chip"),
              { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={tk.text} />
          </Pressable>

          <Text variant="title" style={{ marginTop: spacing.xl }}>
            {copy.title}
          </Text>
          <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
            {copy.blurb}
          </Text>

          <View style={{ gap: spacing.md, marginTop: spacing["2xl"] }}>
            {field("Email or phone number", identifier, setIdentifier, {
              icon: "mail-outline",
              keyboard: "email-address",
            })}
            {field("Password", password, setPassword, { icon: "lock-closed-outline", secure: true })}
          </View>

          <Pressable hitSlop={8} style={{ alignSelf: "flex-end", marginTop: spacing.md }}>
            <Text variant="caption" tone="primary" style={{ fontWeight: "700" }}>
              Forgot password?
            </Text>
          </Pressable>

          <Button
            label="Continue"
            full
            size="lg"
            loading={busy}
            disabled={!canSubmit}
            style={{ marginTop: spacing.xl }}
            onPress={submit}
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginVertical: spacing.xl }}>
            <View style={{ flex: 1, height: 1, backgroundColor: tk.separator }} />
            <Text variant="caption" tone="muted">
              or
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: tk.separator }} />
          </View>

          <View style={{ gap: spacing.md }}>
            <Button label="Continue with Google" variant="glass" icon="logo-google" full size="lg" onPress={submit} />
            {Platform.OS === "ios" ? (
              <Button label="Continue with Apple" variant="glass" icon="logo-apple" full size="lg" onPress={submit} />
            ) : null}
          </View>

          <GlassCard style={{ marginTop: spacing.xl }} shadow="sm">
            <Text variant="caption" tone="muted">
              We&apos;ll verify your email or phone, then ask for location and notification permission so
              medication, vaccination and appointment reminders reach you on time. By continuing you agree to
              the FurrCircle Terms and Privacy Policy.
            </Text>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
