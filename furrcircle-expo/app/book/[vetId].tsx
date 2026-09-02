import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  glassSurface,
  IconTile,
  Screen,
  ScreenHeader,
  Text,
  VerifiedMark,
} from "../../src/components/ui";
import { clinicById, pets, records, vetById } from "../../src/data/mock";
import type { ConsultType } from "../../src/data/types";
import { radius, spacing, useTheme } from "../../src/theme";

const STEPS = ["Pet", "Type", "Reason", "Sharing", "Slot", "Review"] as const;

const TYPES: { value: ConsultType; icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; blurb: string; fee: number }[] = [
  { value: "in-clinic", icon: "business", label: "In-clinic", blurb: "Physical examination at the clinic", fee: 800 },
  { value: "video", icon: "videocam", label: "Video call", blurb: "See and show — good for skin, gait, behaviour", fee: 600 },
  { value: "voice", icon: "call", label: "Voice call", blurb: "Quick advice and follow-ups", fee: 400 },
];

const REASONS = [
  "Routine check-up",
  "Symptoms",
  "Follow-up",
  "Vaccination",
  "Prescription refill",
  "Behaviour",
  "Nutrition",
  "Other",
];

const SLOTS = [
  { day: "Today", times: ["5:30 PM", "6:00 PM", "7:15 PM"] },
  { day: "Tomorrow", times: ["10:00 AM", "11:30 AM", "4:45 PM", "6:00 PM"] },
];

export default function BookConsultation() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { vetId } = useLocalSearchParams<{ vetId: string }>();

  const vet = vetById(vetId ?? "v_1") ?? vetById("v_1")!;
  const clinic = clinicById(vet.clinicId)!;

  const [step, setStep] = useState(0);
  const [petId, setPetId] = useState(pets[0].id);
  const [type, setType] = useState<ConsultType>(vet.consultTypes[0]);
  const [reason, setReason] = useState<string | null>(null);
  const [shared, setShared] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [booked, setBooked] = useState(false);

  const pet = pets.find((p) => p.id === petId)!;
  const petRecords = records.filter((r) => r.petId === petId);
  const fee = TYPES.find((t) => t.value === type)!.fee;

  const canAdvance = [true, true, reason !== null, true, slot !== null, consent][step];

  const next = () => {
    Haptics.selectionAsync().catch(() => {});
    if (step < STEPS.length - 1) return setStep(step + 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setBooked(true);
  };

  if (booked) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
          <IconTile icon="checkmark-circle" tone="success" size={72} />
          <Text variant="title" center>
            Request sent
          </Text>
          <Text variant="body" tone="secondary" center style={{ maxWidth: 300 }}>
            {vet.name} has your request for {pet.name} on {slot}. You&apos;ll get a notification the moment the
            clinic accepts or proposes another time.
          </Text>
          <Badge label="Requested" tone="warning" style={{ marginTop: spacing.sm }} />
          <View style={{ marginTop: spacing.xl, gap: spacing.sm, alignSelf: "stretch" }}>
            <Button label="View appointment" full size="lg" onPress={() => router.replace("/appointments")} />
            <Button label="Back to vets" variant="ghost" full onPress={() => router.dismissAll()} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Book consultation" subtitle={`${vet.name} · ${clinic.name}`} back size="compact" />

      {/* Progress ---------------------------------------------------------- */}
      <View style={{ flexDirection: "row", gap: 5, paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i <= step ? tk.primary : tk.separator,
            }}
          />
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] }}
      >
        <Text variant="micro" tone="muted">
          STEP {step + 1} OF {STEPS.length}
        </Text>

        {step === 0 ? (
          <>
            <Text variant="heading" style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
              Who is this visit for?
            </Text>
            <View style={{ gap: spacing.md }}>
              {pets.map((p) => (
                <SelectCard key={p.id} active={p.id === petId} onPress={() => setPetId(p.id)}>
                  <Avatar uri={p.photo} name={p.name} species={p.species} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text variant="subheading">{p.name}</Text>
                    <Text variant="caption" tone="secondary">
                      {p.breed} · {p.weightKg} kg
                    </Text>
                  </View>
                </SelectCard>
              ))}
            </View>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text variant="heading" style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
              How would you like to consult?
            </Text>
            <View style={{ gap: spacing.md }}>
              {TYPES.filter((t) => vet.consultTypes.includes(t.value)).map((t) => (
                <SelectCard key={t.value} active={t.value === type} onPress={() => setType(t.value)}>
                  <IconTile icon={t.icon} tone={t.value === type ? "primary" : "neutral"} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="subheading">{t.label}</Text>
                    <Text variant="caption" tone="secondary">
                      {t.blurb}
                    </Text>
                  </View>
                  <Text variant="bodyStrong">₹{t.fee}</Text>
                </SelectCard>
              ))}
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text variant="heading" style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
              What&apos;s the reason?
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {REASONS.map((r) => (
                <Pressable key={r} onPress={() => setReason(r)}>
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 11,
                      borderRadius: radius.pill,
                      backgroundColor: reason === r ? tk.primary : tk.glassChip,
                      borderWidth: StyleSheet.hairlineWidth * 2,
                      borderColor: reason === r ? tk.primary : tk.glassBorder,
                    }}
                  >
                    <Text variant="caption" color={reason === r ? tk.onPrimary : tk.textSecondary} style={{ fontWeight: "700" }}>
                      {r}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
              <Ionicons name="pulse" size={16} color={tk.danger} style={{ marginTop: 1 }} />
              <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                Collapse, seizures, heavy bleeding, difficulty breathing or a bloated abdomen need in-person
                emergency care now — not a booking.
              </Text>
            </GlassCard>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text variant="heading" style={{ marginTop: spacing.sm }}>
              What can {vet.name.split(" ")[1]} see?
            </Text>
            <Text variant="caption" tone="secondary" style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
              Records stay private until you share them, and access ends with this appointment unless you extend
              it.
            </Text>

            <Pressable>
              <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }} shadow="sm">
                <IconTile icon="camera" tone="community" size={42} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                    Add photos or a video
                  </Text>
                  <Text variant="caption" tone="secondary">
                    Symptoms are much easier to assess with media.
                  </Text>
                </View>
                <Ionicons name="add-circle" size={22} color={tk.community} />
              </GlassCard>
            </Pressable>

            <Text variant="micro" tone="muted" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
              {pet.name.toUpperCase()}&apos;S RECORDS
            </Text>
            <View style={{ gap: spacing.sm }}>
              {petRecords.map((r) => {
                const on = shared.includes(r.id);
                return (
                  <Pressable
                    key={r.id}
                    onPress={() =>
                      setShared((prev) => (on ? prev.filter((x) => x !== r.id) : [...prev, r.id]))
                    }
                    style={[
                      glassSurface(tk),
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.md,
                        padding: spacing.md,
                        borderRadius: radius.lg,
                        borderColor: on ? tk.verified : tk.glassBorder,
                        borderWidth: on ? 1.5 : StyleSheet.hairlineWidth * 2,
                      },
                    ]}
                  >
                    <IconTile icon={r.fileType === "pdf" ? "document-text" : "image"} tone={on ? "verified" : "neutral"} size={38} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                        {r.title}
                      </Text>
                      <Text variant="caption" tone="secondary" numberOfLines={1}>
                        {r.date} · {r.clinic}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: on ? tk.verified : tk.border,
                        backgroundColor: on ? tk.verified : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {on ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text variant="heading" style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
              Pick a time
            </Text>
            {SLOTS.map((group) => (
              <View key={group.day} style={{ marginBottom: spacing.lg }}>
                <Text variant="micro" tone="muted" style={{ marginBottom: spacing.sm }}>
                  {group.day.toUpperCase()}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {group.times.map((t) => {
                    const label = `${group.day}, ${t}`;
                    const on = slot === label;
                    return (
                      <Pressable key={label} onPress={() => setSlot(label)}>
                        <View
                          style={{
                            paddingHorizontal: 18,
                            paddingVertical: 12,
                            borderRadius: radius.md,
                            backgroundColor: on ? tk.primary : tk.glassChip,
                            borderWidth: StyleSheet.hairlineWidth * 2,
                            borderColor: on ? tk.primary : tk.glassBorder,
                          }}
                        >
                          <Text variant="caption" color={on ? tk.onPrimary : tk.text} style={{ fontWeight: "700" }}>
                            {t}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            {vet.availableNow ? (
              <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }} shadow="sm">
                <IconTile icon="flash" tone="warning" size={40} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                    Or request an instant consult
                  </Text>
                  <Text variant="caption" tone="secondary">
                    Sent to vets available right now. Not guaranteed.
                  </Text>
                </View>
              </GlassCard>
            ) : null}
          </>
        ) : null}

        {step === 5 ? (
          <>
            <Text variant="heading" style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
              Review and confirm
            </Text>

            <GlassCard>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <Avatar uri={vet.photo} name={vet.name} size={48} ring="verified" />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Text variant="subheading">{vet.name}</Text>
                    {vet.verified ? <VerifiedMark size={14} /> : null}
                  </View>
                  <Text variant="caption" tone="secondary">
                    {clinic.name}
                  </Text>
                </View>
              </View>

              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginVertical: spacing.lg }} />

              <SummaryRow label="Pet" value={`${pet.name} · ${pet.breed}`} />
              <SummaryRow label="Type" value={TYPES.find((t) => t.value === type)!.label} />
              <SummaryRow label="Reason" value={reason ?? "—"} />
              <SummaryRow label="When" value={slot ?? "—"} />
              <SummaryRow label="Shared" value={shared.length ? `${shared.length} records` : "No records"} />

              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginVertical: spacing.lg }} />

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text variant="subheading" style={{ flex: 1 }}>
                  Total
                </Text>
                <Text variant="heading" tone="primary">
                  ₹{fee}
                </Text>
              </View>
              <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>
                Free cancellation up to 2 hours before. Later cancellations and no-shows are charged in full.
              </Text>
            </GlassCard>

            <Pressable onPress={() => setConsent((c) => !c)} style={{ marginTop: spacing.lg }}>
              <GlassCard style={{ flexDirection: "row", gap: spacing.md }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: consent ? tk.primary : tk.border,
                    backgroundColor: consent ? tk.primary : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  {consent ? <Ionicons name="checkmark" size={13} color={tk.onPrimary} /> : null}
                </View>
                <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
                  I consent to {clinic.name} accessing the records I selected for this appointment, and I
                  understand this consultation is not a substitute for emergency treatment.
                </Text>
              </GlassCard>
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      {/* Footer ------------------------------------------------------------ */}
      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: tk.separator,
        }}
      >
        {step > 0 ? <Button label="Back" variant="glass" onPress={() => setStep(step - 1)} /> : null}
        <Button
          label={step === STEPS.length - 1 ? `Confirm · ₹${fee}` : "Continue"}
          iconRight={step === STEPS.length - 1 ? undefined : "arrow-forward"}
          style={{ flex: 1 }}
          size="lg"
          disabled={!canAdvance}
          onPress={next}
        />
      </View>
    </Screen>
  );
}

function SelectCard({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const { tk } = useTheme();
  return (
    <Pressable onPress={onPress}>
      <GlassCard
        shadow={active ? "md" : "sm"}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          borderColor: active ? tk.primary : tk.glassBorder,
          borderWidth: active ? 1.5 : StyleSheet.hairlineWidth * 2,
        }}
      >
        {children}
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
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
      <Text variant="caption" tone="muted" style={{ width: 84 }}>
        {label}
      </Text>
      <Text variant="caption" style={{ flex: 1, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}
