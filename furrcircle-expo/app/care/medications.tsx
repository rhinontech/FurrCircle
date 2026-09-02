import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  Badge,
  Button,
  GlassCard,
  IconTile,
  ProgressRing,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../../src/components/ui";
import { medications, petById } from "../../src/data/mock";
import { useSession } from "../../src/store/session";
import { radius, spacing, useTheme } from "../../src/theme";

type DoseState = "pending" | "done" | "skipped";

export default function Medications() {
  const { tk } = useTheme();
  const { activePetId } = useSession();
  const pet = petById(activePetId)!;
  const list = medications.filter((m) => m.petId === activePetId);

  const [doses, setDoses] = useState<Record<string, DoseState>>({ m_1: "done", m_2: "pending" });

  const mark = (id: string, state: DoseState) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDoses((d) => ({ ...d, [id]: state }));
  };

  return (
    <Screen>
      <ScreenHeader title="Medications" subtitle={pet.name} back size="compact" right={<Button label="Add" size="sm" icon="add" onPress={() => {}} />} />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <SectionHeader title="Today's doses" style={{ marginTop: 0 }} />
        <View style={{ gap: spacing.md }}>
          {list.map((m) => {
            const state = doses[m.id] ?? "pending";
            return (
              <GlassCard key={m.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <IconTile icon="medkit" tone={state === "done" ? "success" : state === "skipped" ? "warning" : "primary"} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="subheading" numberOfLines={1}>
                      {m.name}
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {m.dosage} · {m.frequency} at {m.timesPerDay.join(", ")}
                    </Text>
                  </View>
                  <ProgressRing progress={m.adherence} size={44} stroke={5} tone={m.adherence > 0.85 ? "success" : "warning"}>
                    <Text variant="micro">{Math.round(m.adherence * 100)}</Text>
                  </ProgressRing>
                </View>

                <View
                  style={{
                    marginTop: spacing.md,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: tk.glassChip,
                  }}
                >
                  <Text variant="caption" tone="secondary">
                    {m.instructions}
                  </Text>
                  {m.prescribedBy ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 }}>
                      <Ionicons name="shield-checkmark" size={12} color={tk.verified} />
                      <Text variant="micro" tone="verified">
                        PRESCRIBED BY {m.prescribedBy.toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                  {(
                    [
                      { s: "done" as const, label: "Given", icon: "checkmark" },
                      { s: "skipped" as const, label: "Skipped", icon: "close" },
                      { s: "pending" as const, label: "Snooze", icon: "time" },
                    ]
                  ).map((opt) => {
                    const on = state === opt.s;
                    return (
                      <Pressable key={opt.s} onPress={() => mark(m.id, opt.s)} style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            paddingVertical: 10,
                            borderRadius: radius.md,
                            backgroundColor: on ? (opt.s === "done" ? tk.success : opt.s === "skipped" ? tk.warning : tk.primary) : tk.glassChip,
                            borderWidth: StyleSheet.hairlineWidth * 2,
                            borderColor: on ? "transparent" : tk.glassBorder,
                          }}
                        >
                          <Ionicons name={opt.icon as never} size={14} color={on ? "#FFFFFF" : tk.textSecondary} />
                          <Text variant="caption" color={on ? "#FFFFFF" : tk.textSecondary} style={{ fontWeight: "700" }}>
                            {opt.label}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    marginTop: spacing.md,
                    paddingTop: spacing.md,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: tk.separator,
                  }}
                >
                  <Badge label={m.endDate ? `Until ${m.endDate}` : "Ongoing"} tone="neutral" icon="calendar" />
                  <View style={{ flex: 1 }} />
                  <Text variant="caption" tone="muted">
                    Started {m.startDate}
                  </Text>
                </View>
              </GlassCard>
            );
          })}
        </View>

        <SectionHeader title="Reminders" />
        <GlassCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <IconTile icon="notifications" tone="primary" size={42} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                Dose reminders on
              </Text>
              <Text variant="caption" tone="secondary">
                Push at 8:00 AM and 8:00 PM · refill alert 3 days before
              </Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={{ marginTop: spacing.lg, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="lock-closed" size={16} color={tk.verified} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Your adherence history is yours. It is shared with a vet only when you choose to share it.
          </Text>
        </GlassCard>
      </ScreenScroll>
    </Screen>
  );
}
