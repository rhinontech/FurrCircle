import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  IconTile,
  ListRow,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../../src/components/ui";
import { clinics, pets, records } from "../../src/data/mock";
import { radius, spacing, useTheme } from "../../src/theme";

const GRANTS = [
  {
    id: "g1",
    clinicId: "c_1",
    petId: "p_1",
    scope: "Consultations, lab reports",
    kind: "Ongoing care relationship",
    since: "12 Aug 2026",
    records: 2,
  },
  {
    id: "g2",
    clinicId: "c_2",
    petId: "p_2",
    scope: "Surgery discharge summary",
    kind: "This appointment only",
    since: "Today",
    records: 1,
  },
];

const AUDIT = [
  { who: "Dr. Sneha Rao", what: "Opened: Dermatology consultation note", when: "Yesterday, 6:38 PM" },
  { who: "Dr. Sneha Rao", what: "Opened: Complete blood count", when: "Yesterday, 6:39 PM" },
  { who: "Paws & Claws front desk", what: "Viewed appointment summary", when: "12 Aug, 5:52 PM" },
];

export default function Sharing() {
  const { tk } = useTheme();
  const [grants, setGrants] = useState(GRANTS);

  const revoke = (id: string, clinicName: string) =>
    Alert.alert(
      "Revoke access?",
      `${clinicName} will no longer be able to open new records. Clinical notes they already created stay in their own records where the law requires it.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Revoke", style: "destructive", onPress: () => setGrants((g) => g.filter((x) => x.id !== id)) },
      ],
    );

  return (
    <Screen>
      <ScreenHeader title="Record sharing" subtitle="You decide who sees what, and for how long" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <SectionHeader title={`${grants.length} active grants`} style={{ marginTop: 0 }} />
        <View style={{ gap: spacing.md }}>
          {grants.map((g) => {
            const clinic = clinics.find((c) => c.id === g.clinicId)!;
            const pet = pets.find((p) => p.id === g.petId)!;
            return (
              <GlassCard key={g.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <IconTile icon="business" tone="verified" size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="subheading" numberOfLines={1}>
                      {clinic.name}
                    </Text>
                    <Text variant="caption" tone="secondary" numberOfLines={1}>
                      {pet.name} · {g.records} records
                    </Text>
                  </View>
                  <Avatar uri={pet.photo} name={pet.name} species={pet.species} size={38} />
                </View>

                <View
                  style={{
                    marginTop: spacing.md,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: tk.glassChip,
                    gap: 4,
                  }}
                >
                  <Detail label="Scope" value={g.scope} />
                  <Detail label="Basis" value={g.kind} />
                  <Detail label="Since" value={g.since} />
                </View>

                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                  <Button label="Change scope" variant="glass" size="sm" style={{ flex: 1 }} onPress={() => {}} />
                  <Button label="Revoke" variant="danger" size="sm" onPress={() => revoke(g.id, clinic.name)} />
                </View>
              </GlassCard>
            );
          })}
        </View>

        <SectionHeader title="Access log" action="Export" onAction={() => {}} />
        <GlassCard padded={false} style={{ paddingVertical: spacing.xs }}>
          {AUDIT.map((a, i) => (
            <View key={a.when}>
              <View style={{ flexDirection: "row", gap: spacing.md, padding: spacing.md }}>
                <IconTile icon="eye" tone="neutral" size={36} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                    {a.who}
                  </Text>
                  <Text variant="caption" tone="secondary" numberOfLines={1}>
                    {a.what}
                  </Text>
                </View>
                <Text variant="micro" tone="muted" style={{ maxWidth: 90, textAlign: "right" }}>
                  {a.when.toUpperCase()}
                </Text>
              </View>
              {i < AUDIT.length - 1 ? (
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: 62 }} />
              ) : null}
            </View>
          ))}
        </GlassCard>

        <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="information-circle" size={16} color={tk.textMuted} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Revoking stops future access. A clinic may still be required to retain notes it created for you, for
            the period its medical regulator sets — that copy is theirs, not shared onward.
          </Text>
        </GlassCard>
      </ScreenScroll>
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row" }}>
      <Text variant="micro" tone="muted" style={{ width: 58 }}>
        {label.toUpperCase()}
      </Text>
      <Text variant="caption" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}
