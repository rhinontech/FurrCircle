import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AmbientBackground, GlassCard, IconTile, Text } from "../../src/components/ui";
import { Button } from "../../src/components/ui/Button";
import type { Role } from "../../src/data/types";
import { radius, spacing, useTheme } from "../../src/theme";

const ROLES: { role: Role; icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; blurb: string }[] = [
  {
    role: "owner",
    icon: "paw",
    title: "I am a Pet Owner",
    blurb: "Records, reminders, appointments and your local community — available right away.",
  },
  {
    role: "vet",
    icon: "medkit",
    title: "I am a Vet / Clinic",
    blurb: "Manage availability, consult patients, and publish trusted advice once verified.",
  },
  {
    role: "shelter",
    icon: "home",
    title: "I am a Shelter / Rescue",
    blurb: "List adoptable pets, handle applications, and raise rescue alerts nearby.",
  },
];

export default function Welcome() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <AmbientBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + spacing["2xl"],
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing["3xl"],
        }}
      >
        <View style={{ alignItems: "center", marginBottom: spacing["2xl"] }}>
          <Image
            source={require("../../assets/logo-mark.png")}
            style={{ width: 108, height: 108 }}
            contentFit="contain"
          />
          <Text variant="display" center style={{ marginTop: spacing.lg }}>
            FurrCircle
          </Text>
          <Text variant="body" tone="secondary" center style={{ marginTop: spacing.sm, maxWidth: 300 }}>
            Everything for your pet&apos;s care, trusted vets, and local pet people.
          </Text>
        </View>

        <Text variant="caption" tone="muted" style={{ marginBottom: spacing.md }}>
          CHOOSE HOW YOU&apos;LL USE FURRCIRCLE
        </Text>

        <View style={{ gap: spacing.md }}>
          {ROLES.map((r) => {
            const active = selected === r.role;
            return (
              <Pressable key={r.role} onPress={() => setSelected(r.role)}>
                <GlassCard
                  shadow={active ? "lg" : "sm"}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    borderColor: active ? tk.primary : tk.glassBorder,
                    borderWidth: active ? 1.5 : StyleSheet.hairlineWidth * 2,
                  }}
                >
                  <IconTile icon={r.icon} tone={active ? "primary" : "neutral"} size={46} />
                  <View style={{ flex: 1 }}>
                    <Text variant="subheading">{r.title}</Text>
                    <Text variant="caption" tone="secondary" style={{ marginTop: 3 }}>
                      {r.blurb}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: active ? tk.primary : tk.border,
                      backgroundColor: active ? tk.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {active ? <Ionicons name="checkmark" size={13} color={tk.onPrimary} /> : null}
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Continue"
          iconRight="arrow-forward"
          full
          size="lg"
          disabled={!selected}
          style={{ marginTop: spacing["2xl"] }}
          onPress={() => router.push({ pathname: "/(auth)/sign-in", params: { role: selected! } })}
        />

        <View
          style={{
            marginTop: spacing.xl,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: tk.glassChip,
            flexDirection: "row",
            gap: spacing.sm,
          }}
        >
          <Ionicons name="lock-closed" size={14} color={tk.textMuted} style={{ marginTop: 2 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Health records stay private by default and are kept separate from your public pet profile. You
            choose what a vet can see, and when.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
