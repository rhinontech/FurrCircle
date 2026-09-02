import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import {
  Avatar,
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
  Segmented,
  Text,
} from "../../src/components/ui";
import { ageLabel, medications, petById, prescriptions, records, timeline } from "../../src/data/mock";
import { radius, spacing, useTheme } from "../../src/theme";

export default function PatientDetail() {
  const { tk } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = petById(id ?? "p_1") ?? petById("p_1")!;
  const [tab, setTab] = useState<"summary" | "timeline" | "notes">("summary");
  const [note, setNote] = useState("");

  const petRecords = records.filter((r) => r.petId === pet.id);
  const petMeds = medications.filter((m) => m.petId === pet.id);
  const petTimeline = timeline.filter((t) => t.petId === pet.id);
  const rx = prescriptions.filter((p) => p.petId === pet.id);

  return (
    <Screen>
      <ScreenHeader title={pet.name} subtitle="Patient record" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <GlassCard shadow="md">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Avatar uri={pet.photo} name={pet.name} species={pet.species} size={62} />
            <View style={{ flex: 1 }}>
              <Text variant="subheading">{pet.name}</Text>
              <Text variant="caption" tone="secondary">
                {pet.breed} · {pet.sex === "male" ? "M" : "F"} · {ageLabel(pet.dob)} · {pet.weightKg} kg
              </Text>
              <View style={{ flexDirection: "row", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                {pet.allergies.map((a) => (
                  <Badge key={a} label={a} tone="danger" icon="alert-circle" />
                ))}
                {pet.conditions.map((c) => (
                  <Badge key={c} label={c} tone="warning" />
                ))}
              </View>
            </View>
          </View>

          {/* Access provenance is always visible to the clinician. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: spacing.md,
              padding: spacing.sm,
              borderRadius: radius.sm,
              backgroundColor: tk.verifiedSoft,
            }}
          >
            <Ionicons name="lock-open" size={13} color={tk.verified} />
            <Text variant="micro" tone="verified" style={{ flex: 1 }}>
              OWNER SHARED 2 RECORDS FOR TODAY&apos;S APPOINTMENT · ACCESS LOGGED
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
            <Button label="Start consultation" icon="videocam" style={{ flex: 1 }} onPress={() => router.push("/consult/va_1")} />
            <Button label="Message" variant="glass" icon="chatbubble-ellipses-outline" onPress={() => router.push("/messages")} />
          </View>
        </GlassCard>

        <Segmented
          style={{ marginTop: spacing.lg }}
          value={tab}
          onChange={setTab}
          options={[
            { value: "summary", label: "Summary" },
            { value: "timeline", label: "Timeline" },
            { value: "notes", label: "Notes" },
          ]}
        />

        {tab === "summary" ? (
          <>
            <SectionHeader title="Owner shared" />
            <View style={{ gap: spacing.sm }}>
              {petRecords.slice(0, 2).map((r) => (
                <ListRow
                  key={r.id}
                  icon={r.fileType === "pdf" ? "document-text" : "image"}
                  tone="verified"
                  title={r.title}
                  subtitle={`${r.date} · ${r.clinic}`}
                  right={<Badge label="Owner shared" tone="verified" />}
                />
              ))}
            </View>

            <SectionHeader title="Current medications" />
            <View style={{ gap: spacing.sm }}>
              {petMeds.map((m) => (
                <ListRow
                  key={m.id}
                  icon="medkit"
                  tone="primary"
                  title={`${m.name} · ${m.dosage}`}
                  subtitle={`${m.frequency} · adherence ${Math.round(m.adherence * 100)}%`}
                  chevron={false}
                />
              ))}
            </View>

            <SectionHeader title="Prescriptions" />
            <View style={{ gap: spacing.sm }}>
              {rx.map((p) => (
                <ListRow
                  key={p.id}
                  icon="receipt"
                  tone="verified"
                  title={`Issued ${p.issuedOn}`}
                  subtitle={p.items.map((i) => i.name).join(", ")}
                  right={<Badge label={p.status} tone={p.status === "active" ? "success" : "neutral"} />}
                />
              ))}
            </View>

            <SectionHeader title="Clinical actions" />
            <View style={{ gap: spacing.sm }}>
              <ListRow icon="document-text" tone="primary" title="Write consultation summary" subtitle="Publish to the owner when ready" onPress={() => {}} />
              <ListRow icon="clipboard" tone="verified" title="Create a care plan" subtitle="Tasks, reminders and a follow-up date" onPress={() => {}} />
              <ListRow icon="receipt" tone="success" title="Generate prescription" subtitle="Subject to local prescribing rules" onPress={() => {}} />
              <ListRow icon="repeat" tone="warning" title="Request a follow-up" subtitle="Creates a reminder for the owner" onPress={() => {}} />
            </View>
          </>
        ) : null}

        {tab === "timeline" ? (
          <GlassCard style={{ marginTop: spacing.lg }}>
            {petTimeline.map((t, i) => (
              <View key={t.id} style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ alignItems: "center", width: 38 }}>
                  <IconTile icon={t.icon} tone={t.tone} size={38} />
                  {i < petTimeline.length - 1 ? (
                    <View style={{ flex: 1, width: 2, backgroundColor: tk.separator, marginVertical: 4 }} />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingBottom: i < petTimeline.length - 1 ? spacing.lg : 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14, flex: 1 }} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Badge label={t.source === "clinic" ? "Clinic created" : "Owner shared"} tone={t.source === "clinic" ? "verified" : "neutral"} />
                  </View>
                  <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
                    {t.detail}
                  </Text>
                  <Text variant="micro" tone="muted" style={{ marginTop: 4 }}>
                    {t.at.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </GlassCard>
        ) : null}

        {tab === "notes" ? (
          <>
            <SectionHeader title="Private professional note" />
            <View style={[glassSurface(tk), { borderRadius: radius.lg, padding: spacing.md, minHeight: 150 }]}>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                placeholder="Only your clinic can see this until you publish a section to the owner."
                placeholderTextColor={tk.textMuted}
                style={{ color: tk.text, fontSize: 15, fontWeight: "500", flex: 1, textAlignVertical: "top" }}
              />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <Button label="Save privately" variant="glass" style={{ flex: 1 }} onPress={() => {}} />
              <Button label="Publish to owner" style={{ flex: 1 }} disabled={!note.trim()} onPress={() => setNote("")} />
            </View>

            <GlassCard style={{ marginTop: spacing.lg, flexDirection: "row", gap: spacing.sm }} shadow="sm">
              <Ionicons name="warning" size={16} color={tk.warning} style={{ marginTop: 1 }} />
              <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                FurrCircle never auto-generates a diagnosis or a prescription. Anything you publish is text you
                wrote and confirmed.
              </Text>
            </GlassCard>
          </>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}
