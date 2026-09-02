import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  glassShadow,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../../src/components/ui";
import { ageLabel, medications, petById, records, vaccines } from "../../src/data/mock";
import { useSession } from "../../src/store/session";
import { palette, radius, spacing, useTheme } from "../../src/theme";

const SECTIONS = [
  { key: "identity", label: "Identity and microchip", always: true },
  { key: "emergency", label: "Emergency contact", always: true },
  { key: "allergies", label: "Allergies and conditions", always: false },
  { key: "vaccines", label: "Vaccination status", always: false },
  { key: "meds", label: "Current medications", always: false },
  { key: "records", label: "Selected records", always: false },
];

export default function Passport() {
  const { tk } = useTheme();
  const { activePetId } = useSession();
  const pet = petById(activePetId)!;

  const [included, setIncluded] = useState<string[]>(["identity", "emergency", "allergies", "vaccines"]);
  const petVaccines = vaccines.filter((v) => v.petId === activePetId);
  const petMeds = medications.filter((m) => m.petId === activePetId);
  const petRecords = records.filter((r) => r.petId === activePetId);

  const toggle = (k: string) =>
    setIncluded((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  return (
    <Screen>
      <ScreenHeader title="Pet passport" subtitle="A read-only summary you can share" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        {/* Preview ---------------------------------------------------------- */}
        <View style={[{ borderRadius: radius.xl, overflow: "hidden" }, glassShadow(tk, "lg")]}>
          <LinearGradient
            colors={tk.scheme === "dark" ? [palette.brand[800], palette.brand[950]] : [palette.brand[600], palette.brand[900]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: spacing.xl }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <Avatar uri={pet.photo} name={pet.name} species={pet.species} size={64} />
              <View style={{ flex: 1 }}>
                <Text variant="heading" color="#FFFFFF">
                  {pet.name}
                </Text>
                <Text variant="caption" color="rgba(255,255,255,0.75)">
                  {pet.breed} · {pet.sex === "male" ? "Male" : "Female"} · {ageLabel(pet.dob)}
                </Text>
              </View>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: radius.md,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="qr-code" size={26} color="#FFFFFF" />
              </View>
            </View>

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: spacing.lg }} />

            {included.includes("identity") ? (
              <PassportRow label="Microchip" value={pet.microchipId ?? "Not recorded"} />
            ) : null}
            {included.includes("emergency") ? <PassportRow label="Emergency" value={pet.emergencyContact} /> : null}
            {included.includes("allergies") ? (
              <PassportRow label="Allergies" value={pet.allergies.length ? pet.allergies.join(", ") : "None recorded"} />
            ) : null}
            {included.includes("vaccines") ? (
              <PassportRow
                label="Vaccines"
                value={`${petVaccines.filter((v) => v.status === "up-to-date").length} of ${petVaccines.length} up to date`}
              />
            ) : null}
            {included.includes("meds") ? (
              <PassportRow label="Medications" value={petMeds.length ? petMeds.map((m) => m.name).join(", ") : "None"} />
            ) : null}
            {included.includes("records") ? <PassportRow label="Records" value={`${petRecords.length} attached`} /> : null}

            <Text variant="micro" color="rgba(255,255,255,0.5)" style={{ marginTop: spacing.lg }}>
              FURRCIRCLE PASSPORT · GENERATED 1 SEP 2026 · LINK EXPIRES IN 7 DAYS
            </Text>
          </LinearGradient>
        </View>

        <SectionHeader title="What to include" />
        <GlassCard padded={false} style={{ paddingVertical: spacing.xs }}>
          {SECTIONS.map((s, i) => {
            const on = included.includes(s.key);
            return (
              <View key={s.key}>
                <Pressable
                  onPress={() => !s.always && toggle(s.key)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    padding: spacing.md,
                    opacity: pressed && !s.always ? 0.6 : 1,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="body">{s.label}</Text>
                    {s.always ? (
                      <Text variant="micro" tone="muted" style={{ marginTop: 2 }}>
                        ALWAYS INCLUDED
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: on ? tk.primary : tk.border,
                      backgroundColor: on ? tk.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: s.always ? 0.6 : 1,
                    }}
                  >
                    {on ? <Ionicons name="checkmark" size={13} color={tk.onPrimary} /> : null}
                  </View>
                </Pressable>
                {i < SECTIONS.length - 1 ? (
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: spacing.md }} />
                ) : null}
              </View>
            );
          })}
        </GlassCard>

        <GlassCard style={{ marginTop: spacing.lg, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="eye-off" size={16} color={tk.verified} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            The passport never includes your phone number, home address or {pet.name}&apos;s live location.
            Anyone with the link sees only what you ticked above.
          </Text>
        </GlassCard>

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <Button
            label="Share passport"
            icon="share-outline"
            full
            size="lg"
            onPress={() =>
              Alert.alert(
                "Share passport?",
                `A read-only link for ${pet.name} will be created with the sections you selected. It expires in 7 days.`,
                [{ text: "Cancel", style: "cancel" }, { text: "Create link" }],
              )
            }
          />
          <Button label="Export as PDF" variant="glass" icon="download-outline" full onPress={() => {}} />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

function PassportRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
      <Text variant="micro" color="rgba(255,255,255,0.55)" style={{ width: 96 }}>
        {label.toUpperCase()}
      </Text>
      <Text variant="caption" color="#FFFFFF" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}
