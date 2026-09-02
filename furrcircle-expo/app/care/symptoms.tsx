import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import {
  Badge,
  Button,
  GlassCard,
  glassSurface,
  IconTile,
  ListRow,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../../src/components/ui";
import { petById, timeline } from "../../src/data/mock";
import { useSession } from "../../src/store/session";
import { radius, spacing, useTheme } from "../../src/theme";

const SEVERITY = ["Mild", "Moderate", "Severe"] as const;

const VITALS = [
  { icon: "restaurant", label: "Appetite", value: "Normal", tone: "success" },
  { icon: "water", label: "Water", value: "Normal", tone: "success" },
  { icon: "footsteps", label: "Activity", value: "Slightly low", tone: "warning" },
  { icon: "thermometer", label: "Temperature", value: "38.6 °C", tone: "success" },
  { icon: "barbell", label: "Weight", value: "28.4 kg", tone: "primary" },
] as const;

/** Red flags that mean "go now", never a diagnosis or a triage score. */
const URGENT = [
  "Difficulty breathing or blue gums",
  "Collapse, seizure or unresponsiveness",
  "Bloated, hard abdomen with retching",
  "Heavy bleeding or a deep wound",
  "Straining to urinate with no output",
  "Suspected poisoning",
];

export default function Symptoms() {
  const { tk } = useTheme();
  const { activePetId } = useSession();
  const pet = petById(activePetId)!;

  const [note, setNote] = useState("");
  const [severity, setSeverity] = useState<(typeof SEVERITY)[number]>("Mild");
  const logs = timeline.filter((t) => t.petId === activePetId && t.source === "owner");

  return (
    <Screen>
      <ScreenHeader title="Symptoms and vitals" subtitle={pet.name} back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <GlassCard shadow="md">
          <Text variant="subheading">Log what you&apos;re seeing</Text>
          <View
            style={[
              glassSurface(tk, "chip"),
              { borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, minHeight: 92 },
            ]}
          >
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              placeholder={`What changed for ${pet.name}? When did it start?`}
              placeholderTextColor={tk.textMuted}
              style={{ color: tk.text, fontSize: 15, fontWeight: "500", flex: 1, textAlignVertical: "top" }}
            />
          </View>

          <Text variant="micro" tone="muted" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
            SEVERITY
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {SEVERITY.map((s) => {
              const on = severity === s;
              const toneColor = s === "Mild" ? tk.success : s === "Moderate" ? tk.warning : tk.danger;
              return (
                <Pressable key={s} onPress={() => setSeverity(s)} style={{ flex: 1 }}>
                  <View
                    style={{
                      alignItems: "center",
                      paddingVertical: 11,
                      borderRadius: radius.md,
                      backgroundColor: on ? toneColor : tk.glassChip,
                      borderWidth: StyleSheet.hairlineWidth * 2,
                      borderColor: on ? toneColor : tk.glassBorder,
                    }}
                  >
                    <Text variant="caption" color={on ? "#FFFFFF" : tk.textSecondary} style={{ fontWeight: "700" }}>
                      {s}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label="Add photo" variant="glass" size="sm" icon="camera" onPress={() => {}} />
            <Button label="Add video" variant="glass" size="sm" icon="videocam" onPress={() => {}} />
          </View>

          <Button label="Save to timeline" full size="lg" style={{ marginTop: spacing.lg }} disabled={!note.trim()} onPress={() => setNote("")} />
        </GlassCard>

        <SectionHeader title="Today's vitals" />
        <GlassCard padded={false} style={{ paddingVertical: spacing.xs }}>
          {VITALS.map((v, i) => (
            <View key={v.label}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md }}>
                <IconTile icon={v.icon} tone={v.tone} size={36} />
                <Text variant="body" style={{ flex: 1 }}>
                  {v.label}
                </Text>
                <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                  {v.value}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={tk.textMuted} />
              </View>
              {i < VITALS.length - 1 ? (
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: 62 }} />
              ) : null}
            </View>
          ))}
        </GlassCard>

        {/* Emergency checklist — direction, never diagnosis (§7.2). */}
        <SectionHeader title="Is this urgent?" />
        <GlassCard style={{ borderColor: tk.danger + "33" }}>
          <Text variant="caption" tone="secondary">
            If any of these are true, go to emergency care now. Do not wait for a consultation.
          </Text>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {URGENT.map((u) => (
              <View key={u} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Ionicons name="alert-circle" size={15} color={tk.danger} />
                <Text variant="caption" style={{ flex: 1 }}>
                  {u}
                </Text>
              </View>
            ))}
          </View>
          <Button label="Emergency care nearby" variant="danger" full size="lg" icon="pulse" style={{ marginTop: spacing.lg }} onPress={() => {}} />
        </GlassCard>

        <SectionHeader title="Recent logs" />
        <View style={{ gap: spacing.sm }}>
          {logs.map((l) => (
            <ListRow key={l.id} icon={l.icon} tone={l.tone} title={l.title} subtitle={`${l.detail} · ${l.at}`} chevron={false} />
          ))}
        </View>
      </ScreenScroll>
    </Screen>
  );
}
