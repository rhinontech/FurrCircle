import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Button,
  GlassCard,
  glassSurface,
  IconTile,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../../src/components/ui";
import type { Species } from "../../src/data/types";
import { radius, spacing, useTheme } from "../../src/theme";

const SPECIES: { value: Species; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { value: "dog", label: "Dog", icon: "paw" },
  { value: "cat", label: "Cat", icon: "paw" },
  { value: "rabbit", label: "Rabbit", icon: "leaf" },
  { value: "bird", label: "Bird", icon: "egg" },
  { value: "other", label: "Other", icon: "help" },
];

export default function NewPet() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species>("dog");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [dob, setDob] = useState("");
  const [weight, setWeight] = useState("");
  const [sterilized, setSterilized] = useState(false);

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder: string, keyboard?: "numeric") => (
    <View style={{ marginBottom: spacing.md }}>
      <Text variant="micro" tone="muted" style={{ marginBottom: 6 }}>
        {label.toUpperCase()}
      </Text>
      <View style={[glassSurface(tk), { borderRadius: radius.lg, paddingHorizontal: spacing.lg, height: 50, justifyContent: "center" }]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={tk.textMuted}
          keyboardType={keyboard ?? "default"}
          style={{ color: tk.text, fontSize: 15, fontWeight: "500" }}
        />
      </View>
    </View>
  );

  return (
    <Screen>
      <ScreenHeader title="Add a pet" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <Pressable style={{ alignSelf: "center" }}>
          <View
            style={[
              glassSurface(tk),
              {
                width: 108,
                height: 108,
                borderRadius: 54,
                alignItems: "center",
                justifyContent: "center",
                borderStyle: "dashed",
                gap: 4,
              },
            ]}
          >
            <Ionicons name="camera" size={26} color={tk.primary} />
            <Text variant="micro" tone="primary">
              ADD PHOTO
            </Text>
          </View>
        </Pressable>

        <SectionHeader title="Basics" />
        {field("Name", name, setName, "What do you call them?")}

        <Text variant="micro" tone="muted" style={{ marginBottom: 6 }}>
          SPECIES
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
          {SPECIES.map((s) => {
            const on = species === s.value;
            return (
              <Pressable key={s.value} onPress={() => setSpecies(s.value)} style={{ flex: 1 }}>
                <View
                  style={[
                    glassSurface(tk, on ? "card" : "chip"),
                    {
                      alignItems: "center",
                      gap: 5,
                      paddingVertical: spacing.md,
                      borderRadius: radius.md,
                      borderColor: on ? tk.primary : tk.glassBorder,
                      borderWidth: on ? 1.5 : StyleSheet.hairlineWidth * 2,
                    },
                  ]}
                >
                  <Ionicons name={s.icon} size={19} color={on ? tk.primary : tk.textMuted} />
                  <Text variant="micro" tone={on ? "primary" : "muted"} style={{ fontSize: 10 }}>
                    {s.label.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {field("Breed", breed, setBreed, "Golden Retriever, Indie, unknown…")}

        <Text variant="micro" tone="muted" style={{ marginBottom: 6 }}>
          SEX
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
          {(["male", "female"] as const).map((s) => {
            const on = sex === s;
            return (
              <Pressable key={s} onPress={() => setSex(s)} style={{ flex: 1 }}>
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: 13,
                    borderRadius: radius.md,
                    backgroundColor: on ? tk.primary : tk.glassChip,
                    borderWidth: StyleSheet.hairlineWidth * 2,
                    borderColor: on ? tk.primary : tk.glassBorder,
                  }}
                >
                  <Text variant="caption" color={on ? tk.onPrimary : tk.textSecondary} style={{ fontWeight: "700", textTransform: "capitalize" }}>
                    {s}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>{field("Date of birth", dob, setDob, "DD / MM / YYYY")}</View>
          <View style={{ flex: 1 }}>{field("Weight (kg)", weight, setWeight, "0.0", "numeric")}</View>
        </View>

        <Pressable onPress={() => setSterilized((s) => !s)}>
          <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }} shadow="sm">
            <IconTile icon="cut" tone={sterilized ? "success" : "neutral"} size={40} />
            <Text variant="body" style={{ flex: 1 }}>
              Sterilised
            </Text>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: sterilized ? tk.success : tk.border,
                backgroundColor: sterilized ? tk.success : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {sterilized ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
            </View>
          </GlassCard>
        </Pressable>

        <SectionHeader title="Health (optional — add later if you like)" />
        <View style={{ gap: spacing.sm }}>
          <OptionRow icon="alert-circle" tone="danger" label="Allergies" hint="Chicken, dust mites, a medication…" />
          <OptionRow icon="pulse" tone="warning" label="Existing conditions" hint="Dermatitis, hip dysplasia…" />
          <OptionRow icon="medkit" tone="primary" label="Current medications" hint="Name, dosage, frequency" />
          <OptionRow icon="shield-checkmark" tone="success" label="Vaccination history" hint="Type, date, certificate" />
          <OptionRow icon="business" tone="verified" label="Existing vet or clinic" hint="So records stay in one place" />
        </View>

        <GlassCard style={{ marginTop: spacing.lg, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="lock-closed" size={16} color={tk.verified} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Medical details stay private. A public pet profile — if you turn one on — shows only name, photo,
            breed and age.
          </Text>
        </GlassCard>

        <View style={{ gap: spacing.sm, marginTop: spacing.lg, paddingBottom: insets.bottom }}>
          <Button label="Save pet" full size="lg" disabled={!name.trim()} onPress={() => router.back()} />
          <Button label="Upload records later" variant="ghost" full onPress={() => router.back()} />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

function OptionRow({
  icon,
  tone,
  label,
  hint,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tone: "danger" | "warning" | "primary" | "success" | "verified";
  label: string;
  hint: string;
}) {
  const { tk } = useTheme();
  return (
    <Pressable>
      <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }} shadow="sm">
        <IconTile icon={icon} tone={tone} size={40} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" style={{ fontSize: 14 }}>
            {label}
          </Text>
          <Text variant="caption" tone="secondary">
            {hint}
          </Text>
        </View>
        <Ionicons name="add-circle-outline" size={21} color={tk.primary} />
      </GlassCard>
    </Pressable>
  );
}
