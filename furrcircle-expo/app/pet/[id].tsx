import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

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
  StatRow,
  Text,
} from "../../src/components/ui";
import { ageLabel, medications, petById, records, timeline, vaccines } from "../../src/data/mock";
import { spacing, useTheme } from "../../src/theme";

export default function PetDetail() {
  const { tk } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = petById(id ?? "p_1") ?? petById("p_1")!;
  const [publicProfile, setPublicProfile] = useState(true);

  const petVaccines = vaccines.filter((v) => v.petId === pet.id);
  const petRecords = records.filter((r) => r.petId === pet.id);
  const petMeds = medications.filter((m) => m.petId === pet.id);
  const petTimeline = timeline.filter((t) => t.petId === pet.id);

  return (
    <Screen>
      <ScreenHeader
        title=""
        back
        size="compact"
        right={<Button label="Edit" size="sm" variant="glass" icon="create-outline" onPress={() => {}} />}
      />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <GlassCard shadow="lg" style={{ alignItems: "center", padding: spacing.xl }}>
          <Avatar uri={pet.photo} name={pet.name} species={pet.species} size={100} ring="brand" />
          <Text variant="title" style={{ marginTop: spacing.md }}>
            {pet.name}
          </Text>
          <Text variant="caption" tone="secondary">
            {pet.breed} · {pet.sex === "male" ? "Male" : "Female"} · {ageLabel(pet.dob)}
          </Text>

          <View style={{ marginTop: spacing.lg }}>
            <StatRow
              stats={[
                { label: "Weight", value: `${pet.weightKg} kg` },
                { label: "Vaccines", value: `${petVaccines.filter((v) => v.status === "up-to-date").length}/${petVaccines.length}` },
                { label: "Records", value: String(petRecords.length) },
              ]}
            />
          </View>
        </GlassCard>

        <SectionHeader title="Identity" />
        <GlassCard>
          <Row label="Microchip" value={pet.microchipId ?? "Not recorded"} />
          <Row label="Date of birth" value={new Date(pet.dob).toDateString().slice(4)} />
          <Row label="Sterilised" value={pet.sterilized ? "Yes" : "No"} />
          <Row label="Emergency contact" value={pet.emergencyContact} />
        </GlassCard>

        <SectionHeader title="Health flags" />
        <GlassCard>
          <Text variant="micro" tone="muted">
            ALLERGIES
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {pet.allergies.length ? (
              pet.allergies.map((a) => <Badge key={a} label={a} tone="danger" icon="alert-circle" />)
            ) : (
              <Text variant="caption" tone="secondary">
                None recorded
              </Text>
            )}
          </View>
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginVertical: spacing.md }} />
          <Text variant="micro" tone="muted">
            CONDITIONS
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {pet.conditions.length ? (
              pet.conditions.map((c) => <Badge key={c} label={c} tone="warning" />)
            ) : (
              <Text variant="caption" tone="secondary">
                None recorded
              </Text>
            )}
          </View>
        </GlassCard>

        <SectionHeader title="Care" />
        <View style={{ gap: spacing.sm }}>
          <ListRow icon="medkit" tone="primary" title="Medications" subtitle={`${petMeds.length} active`} onPress={() => router.push("/care/medications")} />
          <ListRow icon="shield-checkmark" tone="success" title="Vaccines" subtitle={`${petVaccines.length} on the schedule`} onPress={() => router.push("/care/vaccines")} />
          <ListRow icon="document-text" tone="verified" title="Medical records" subtitle={`${petRecords.length} files · private`} onPress={() => router.push("/care/records")} />
          <ListRow icon="qr-code" tone="community" title="Pet passport" subtitle="Shareable summary for travel or a new vet" onPress={() => router.push("/care/passport")} />
        </View>

        <SectionHeader title="Public profile" />
        <GlassCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <IconTile icon="globe-outline" tone={publicProfile ? "community" : "neutral"} size={42} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                Show {pet.name} in Community
              </Text>
              <Text variant="caption" tone="secondary">
                Name, photo, breed and age only.
              </Text>
            </View>
            <Switch value={publicProfile} onValueChange={setPublicProfile} trackColor={{ true: tk.community }} />
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: tk.separator,
            }}
          >
            <Ionicons name="lock-closed" size={14} color={tk.verified} style={{ marginTop: 1 }} />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              Records, medications, owner contact details and location are never part of a public profile.
            </Text>
          </View>
        </GlassCard>

        <SectionHeader title="Recent timeline" action="All" onAction={() => router.push("/(owner)/care")} />
        <View style={{ gap: spacing.sm }}>
          {petTimeline.slice(0, 3).map((t) => (
            <ListRow key={t.id} icon={t.icon} tone={t.tone} title={t.title} subtitle={`${t.detail} · ${t.at}`} chevron={false} />
          ))}
        </View>
      </ScreenScroll>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
      <Text variant="caption" tone="muted" style={{ width: 130 }}>
        {label}
      </Text>
      <Text variant="caption" style={{ flex: 1, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}
