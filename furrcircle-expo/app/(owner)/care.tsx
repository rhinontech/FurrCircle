import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PetSwitcher } from "../../src/components/cards/PetSwitcher";
import {
  Avatar,
  Badge,
  GlassCard,
  glassShadow,
  glassSurface,
  IconTile,
  ListRow,
  Screen,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../../src/components/ui";
import { ageLabel, medications, petById, records, timeline, vaccines } from "../../src/data/mock";
import { useSession } from "../../src/store/session";
import { radius, spacing, useTheme } from "../../src/theme";

const QUICK_ADD = [
  { icon: "document-attach", label: "Record", tone: "verified", href: "/care/records" },
  { icon: "medkit", label: "Medicine", tone: "primary", href: "/care/medications" },
  { icon: "shield-checkmark", label: "Vaccine", tone: "success", href: "/care/vaccines" },
  { icon: "pulse", label: "Symptom", tone: "warning", href: "/care/symptoms" },
  { icon: "barbell", label: "Weight", tone: "community", href: "/care/symptoms" },
] as const;

const vaccineTone = {
  "up-to-date": "success",
  "due-soon": "warning",
  overdue: "danger",
  scheduled: "primary",
} as const;

export default function Care() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activePetId } = useSession();

  const pet = petById(activePetId)!;
  const petMeds = useMemo(() => medications.filter((m) => m.petId === activePetId), [activePetId]);
  const petVaccines = useMemo(() => vaccines.filter((v) => v.petId === activePetId), [activePetId]);
  const petRecords = useMemo(() => records.filter((r) => r.petId === activePetId), [activePetId]);
  const petTimeline = useMemo(() => timeline.filter((t) => t.petId === activePetId), [activePetId]);

  return (
    <Screen>
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text variant="title" style={{ flex: 1 }}>
            Care
          </Text>
          <Pressable
            onPress={() => router.push("/care/passport")}
            style={({ pressed }) => [
              glassSurface(tk, "chip"),
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: radius.pill,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="qr-code-outline" size={14} color={tk.primary} />
            <Text variant="caption" tone="primary" style={{ fontWeight: "700" }}>
              Passport
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: spacing.md }}>
          <PetSwitcher />
        </View>

        {/* Identity ------------------------------------------------------- */}
        <GlassCard shadow="lg" style={{ marginTop: spacing.lg, padding: spacing.xl }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
            <Avatar uri={pet.photo} name={pet.name} species={pet.species} size={70} ring="brand" />
            <View style={{ flex: 1 }}>
              <Text variant="heading">{pet.name}</Text>
              <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
                {pet.breed} · {pet.sex === "male" ? "Male" : "Female"} · {ageLabel(pet.dob)}
              </Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.sm, flexWrap: "wrap" }}>
                <Badge label={`${pet.weightKg} kg`} tone="primary" icon="barbell" />
                {pet.sterilized ? <Badge label="Sterilised" tone="success" /> : null}
                {pet.microchipId ? <Badge label="Chipped" tone="verified" icon="hardware-chip" /> : null}
              </View>
            </View>
          </View>

          {(pet.conditions.length > 0 || pet.allergies.length > 0) && (
            <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
              {pet.conditions.length > 0 ? (
                <FlagRow icon="pulse" tone={tk.warning} bg={tk.warningSoft} label="Active conditions" items={pet.conditions} />
              ) : null}
              {pet.allergies.length > 0 ? (
                <FlagRow icon="alert-circle" tone={tk.danger} bg={tk.dangerSoft} label="Allergies" items={pet.allergies} />
              ) : null}
            </View>
          )}
        </GlassCard>

        {/* Quick add ------------------------------------------------------ */}
        <SectionHeader title="Quick add" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
          {QUICK_ADD.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => router.push(a.href as never)}
              style={({ pressed }) => [
                glassSurface(tk),
                glassShadow(tk, "sm"),
                {
                  width: 86,
                  paddingVertical: spacing.md,
                  borderRadius: radius.lg,
                  alignItems: "center",
                  gap: 6,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <IconTile icon={a.icon} tone={a.tone} size={34} />
              <Text variant="micro" tone="secondary">
                {a.label.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Medications ---------------------------------------------------- */}
        <SectionHeader title="Medications" action="All" onAction={() => router.push("/care/medications")} />
        {petMeds.length ? (
          <View style={{ gap: spacing.sm }}>
            {petMeds.map((m) => (
              <ListRow
                key={m.id}
                icon="medkit"
                tone="primary"
                title={`${m.name} · ${m.dosage}`}
                subtitle={`${m.frequency} at ${m.timesPerDay.join(", ")}${m.prescribedBy ? ` · ${m.prescribedBy}` : ""}`}
                onPress={() => router.push("/care/medications")}
                right={
                  <View style={{ alignItems: "flex-end" }}>
                    <Text variant="bodyStrong" tone={m.adherence > 0.85 ? "success" : "warning"}>
                      {Math.round(m.adherence * 100)}%
                    </Text>
                    <Text variant="micro" tone="muted">
                      TAKEN
                    </Text>
                  </View>
                }
              />
            ))}
          </View>
        ) : (
          <GlassCard>
            <Text variant="caption" tone="secondary">
              No active medications for {pet.name}.
            </Text>
          </GlassCard>
        )}

        {/* Vaccines ------------------------------------------------------- */}
        <SectionHeader title="Vaccines" action="All" onAction={() => router.push("/care/vaccines")} />
        <View style={{ gap: spacing.sm }}>
          {petVaccines.map((v) => (
            <ListRow
              key={v.id}
              icon="shield-checkmark"
              tone={vaccineTone[v.status]}
              title={v.name}
              subtitle={v.givenOn ? `Given ${v.givenOn} · ${v.clinic}` : `Not recorded yet`}
              onPress={() => router.push("/care/vaccines")}
              right={
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Badge
                    label={v.status === "up-to-date" ? "Up to date" : v.status === "due-soon" ? "Due soon" : v.status}
                    tone={vaccineTone[v.status]}
                  />
                  <Text variant="micro" tone="muted">
                    {v.dueOn.toUpperCase()}
                  </Text>
                </View>
              }
            />
          ))}
        </View>

        {/* Records -------------------------------------------------------- */}
        <SectionHeader title="Medical records" action={`${petRecords.length} files`} onAction={() => router.push("/care/records")} />
        <GlassCard padded={false} style={{ paddingVertical: spacing.xs }}>
          {petRecords.slice(0, 3).map((r, i) => (
            <View key={r.id}>
              <Pressable
                onPress={() => router.push("/care/records")}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  padding: spacing.md,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <IconTile icon={r.fileType === "pdf" ? "document-text" : "image"} tone="verified" size={38} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text variant="caption" tone="secondary" numberOfLines={1}>
                    {r.date} · {r.clinic}
                  </Text>
                </View>
                {r.sharedWith.length ? <Ionicons name="people" size={15} color={tk.verified} /> : null}
                <Ionicons name="chevron-forward" size={16} color={tk.textMuted} />
              </Pressable>
              {i < Math.min(petRecords.length, 3) - 1 ? (
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: 66 }} />
              ) : null}
            </View>
          ))}
        </GlassCard>

        {/* Timeline ------------------------------------------------------- */}
        <SectionHeader title="Health timeline" />
        <GlassCard>
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
                  <Badge label={t.source === "clinic" ? "Clinic" : "You"} tone={t.source === "clinic" ? "verified" : "neutral"} />
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
      </ScreenScroll>
    </Screen>
  );
}

function FlagRow({
  icon,
  tone,
  bg,
  label,
  items,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tone: string;
  bg: string;
  label: string;
  items: string[];
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: bg,
      }}
    >
      <Ionicons name={icon} size={15} color={tone} />
      <Text variant="micro" color={tone}>
        {label.toUpperCase()}
      </Text>
      <Text variant="caption" color={tone} style={{ flex: 1 }} numberOfLines={1}>
        {items.join(" · ")}
      </Text>
    </View>
  );
}
