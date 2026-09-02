import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import {
  Badge,
  Button,
  GlassCard,
  IconTile,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../../src/components/ui";
import { petById, vaccines } from "../../src/data/mock";
import { useSession } from "../../src/store/session";
import { radius, spacing, useTheme } from "../../src/theme";

const tone = { "up-to-date": "success", "due-soon": "warning", overdue: "danger", scheduled: "primary" } as const;
const label = { "up-to-date": "Up to date", "due-soon": "Due soon", overdue: "Past due", scheduled: "Scheduled" } as const;

export default function Vaccines() {
  const { tk } = useTheme();
  const { activePetId } = useSession();
  const pet = petById(activePetId)!;
  const list = vaccines.filter((v) => v.petId === activePetId);
  const needsAttention = list.filter((v) => v.status === "overdue" || v.status === "due-soon");

  return (
    <Screen>
      <ScreenHeader
        title="Vaccines"
        subtitle={pet.name}
        back
        size="compact"
        right={<Button label="Add" size="sm" icon="add" onPress={() => {}} />}
      />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        {needsAttention.length ? (
          <GlassCard shadow="md">
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <IconTile icon="alarm" tone="warning" size={44} />
              <View style={{ flex: 1 }}>
                <Text variant="subheading">{needsAttention.length} to sort out</Text>
                {/* Deliberately calm language — overdue is common and fixable. */}
                <Text variant="caption" tone="secondary">
                  Book whenever it suits you; the clinic will update the record.
                </Text>
              </View>
            </View>
            <Button label="Book a vaccination slot" full style={{ marginTop: spacing.lg }} onPress={() => {}} />
          </GlassCard>
        ) : null}

        <SectionHeader title="Schedule" />
        <View style={{ gap: spacing.md }}>
          {list.map((v) => (
            <GlassCard key={v.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <IconTile icon="shield-checkmark" tone={tone[v.status]} size={44} />
                <View style={{ flex: 1 }}>
                  <Text variant="subheading" numberOfLines={1}>
                    {v.name}
                  </Text>
                  <Text variant="caption" tone="secondary" numberOfLines={1}>
                    {v.givenOn ? `Last given ${v.givenOn}` : "No record yet"}
                  </Text>
                </View>
                <Badge label={label[v.status]} tone={tone[v.status]} />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  marginTop: spacing.md,
                  paddingTop: spacing.md,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: tk.separator,
                }}
              >
                <Field label="Next due" value={v.dueOn} />
                <Field label="Clinic" value={v.clinic ?? "—"} />
                <Field label="Batch" value={v.batch ?? "—"} />
              </View>

              {v.status !== "up-to-date" ? (
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                  <Button label="Book" size="sm" style={{ flex: 1 }} onPress={() => {}} />
                  <Button label="I have the certificate" size="sm" variant="glass" onPress={() => {}} />
                </View>
              ) : null}
            </GlassCard>
          ))}
        </View>

        <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="notifications" size={16} color={tk.primary} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Reminders go out 14 days, 3 days and 1 day before a due date. Next due dates follow the schedule your
            vet set, or the date you entered.
          </Text>
        </GlassCard>
      </ScreenScroll>
    </Screen>
  );
}

function Field({ label: l, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="micro" tone="muted">
        {l.toUpperCase()}
      </Text>
      <Text variant="caption" style={{ fontWeight: "700", marginTop: 2 }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
