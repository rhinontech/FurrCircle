import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

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
  VerifiedMark,
} from "../../src/components/ui";
import { appointments, clinicById, petById, prescriptions, recordById, vetAgenda, vetById } from "../../src/data/mock";
import type { AppointmentStatus } from "../../src/data/types";
import { spacing, useTheme } from "../../src/theme";

/** The lifecycle the owner can see, in order. */
const FLOW: AppointmentStatus[] = ["requested", "accepted", "scheduled", "ready", "in-consultation", "completed"];

const FLOW_LABEL: Record<string, string> = {
  requested: "Requested",
  accepted: "Accepted",
  scheduled: "Scheduled",
  ready: "Ready to join",
  "in-consultation": "In consultation",
  completed: "Completed",
};

export default function AppointmentDetail() {
  const { tk } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const appt = [...appointments, ...vetAgenda].find((a) => a.id === id) ?? appointments[0];
  const vet = vetById(appt.vetId) ?? vetById("v_1")!;
  const clinic = clinicById(appt.clinicId)!;
  const pet = petById(appt.petId)!;
  const shared = appt.sharedRecordIds.map(recordById).filter(Boolean);
  const rx = prescriptions.find((p) => p.petId === appt.petId && appt.status === "completed");

  const stageIndex = FLOW.indexOf(appt.status);

  return (
    <Screen>
      <ScreenHeader title="Appointment" subtitle={`${clinic.name}`} back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <GlassCard shadow="lg">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Avatar uri={vet.photo} name={vet.name} size={52} ring={vet.verified ? "verified" : "none"} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text variant="subheading" numberOfLines={1}>
                  {vet.name}
                </Text>
                {vet.verified ? <VerifiedMark size={14} /> : null}
              </View>
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {vet.speciality}
              </Text>
            </View>
            <Badge
              label={FLOW_LABEL[appt.status] ?? appt.status}
              tone={appt.status === "ready" ? "success" : appt.status === "requested" ? "warning" : appt.status === "completed" ? "neutral" : "primary"}
            />
          </View>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginVertical: spacing.lg }} />

          <Row icon="paw" label="Patient" value={`${pet.name} · ${pet.breed}`} />
          <Row icon="chatbox-ellipses" label="Reason" value={appt.reason} />
          <Row
            icon={appt.type === "in-clinic" ? "business" : appt.type === "video" ? "videocam" : "call"}
            label="Type"
            value={appt.type === "in-clinic" ? "In-clinic visit" : appt.type === "video" ? "Video consultation" : "Voice consultation"}
          />
          <Row icon="calendar" label="When" value={`${appt.startsAt} · ${appt.durationMin} min`} />
          <Row icon="card" label="Fee" value={`₹${appt.fee} · paid`} />

          {appt.status === "ready" ? (
            <Button
              label="Join consultation"
              icon={appt.type === "video" ? "videocam" : "call"}
              full
              size="lg"
              style={{ marginTop: spacing.lg }}
              onPress={() => router.push(`/consult/${appt.id}`)}
            />
          ) : null}
        </GlassCard>

        {/* Lifecycle ------------------------------------------------------- */}
        <SectionHeader title="Status history" />
        <GlassCard>
          {FLOW.map((s, i) => {
            const reached = i <= stageIndex;
            const current = i === stageIndex;
            return (
              <View key={s} style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ alignItems: "center", width: 24 }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: reached ? tk.primary : tk.border,
                      backgroundColor: reached ? tk.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {reached ? <Ionicons name="checkmark" size={10} color={tk.onPrimary} /> : null}
                  </View>
                  {i < FLOW.length - 1 ? (
                    <View style={{ flex: 1, width: 2, backgroundColor: i < stageIndex ? tk.primary : tk.separator, marginVertical: 2 }} />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingBottom: i < FLOW.length - 1 ? spacing.lg : 0 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 14 }} tone={reached ? "default" : "muted"}>
                    {FLOW_LABEL[s]}
                  </Text>
                  {current ? (
                    <Text variant="caption" tone="primary" style={{ marginTop: 2 }}>
                      Current state · you were notified
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </GlassCard>

        {/* Shared records --------------------------------------------------- */}
        <SectionHeader title="What the clinic can see" action="Change" onAction={() => router.push("/settings/sharing")} />
        {shared.length ? (
          <View style={{ gap: spacing.sm }}>
            {shared.map((r) => (
              <ListRow
                key={r!.id}
                icon={r!.fileType === "pdf" ? "document-text" : "image"}
                tone="verified"
                title={r!.title}
                subtitle={`${r!.date} · shared for this appointment`}
                chevron={false}
              />
            ))}
          </View>
        ) : (
          <GlassCard>
            <Text variant="caption" tone="secondary">
              No records shared. The clinic sees only the reason for this visit and {pet.name}&apos;s basic
              identity.
            </Text>
          </GlassCard>
        )}

        {/* Outcome ---------------------------------------------------------- */}
        {appt.status === "completed" ? (
          <>
            <SectionHeader title="Consultation outcome" />
            <GlassCard>
              <Badge label="Vet summary" tone="verified" icon="document-text" />
              <Text variant="body" style={{ marginTop: spacing.md }}>
                {appt.note}
              </Text>
            </GlassCard>

            {rx ? (
              <>
                <SectionHeader title="Prescription" />
                <GlassCard>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                    <IconTile icon="receipt" tone="primary" size={42} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                        Issued {rx.issuedOn}
                      </Text>
                      <Text variant="caption" tone="secondary">
                        {vet.name} · {rx.items.length} items
                      </Text>
                    </View>
                    <Badge label={rx.status} tone={rx.status === "active" ? "success" : "neutral"} />
                  </View>
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginVertical: spacing.lg }} />
                  {rx.items.map((it) => (
                    <View key={it.name} style={{ marginBottom: spacing.sm }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                        {it.name}
                      </Text>
                      <Text variant="caption" tone="secondary">
                        {it.dosage} · {it.duration}
                      </Text>
                    </View>
                  ))}
                </GlassCard>
              </>
            ) : null}
          </>
        ) : null}

        {/* Actions ----------------------------------------------------------- */}
        <SectionHeader title="Actions" />
        <View style={{ gap: spacing.sm }}>
          <ListRow icon="chatbubble-ellipses" tone="primary" title="Message the clinic" subtitle="Tied to this appointment · no phone numbers" onPress={() => router.push("/messages")} />
          <ListRow icon="calendar" tone="verified" title="Reschedule" subtitle="Free up to 2 hours before" onPress={() => {}} />
          <ListRow icon="close-circle" tone="danger" title="Cancel appointment" subtitle="Refund per the clinic's cancellation policy" onPress={() => {}} />
        </View>

        <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="pulse" size={16} color={tk.danger} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            This appointment does not replace emergency treatment. If {pet.name} is in distress, go to Emergency
            care nearby.
          </Text>
        </GlassCard>
      </ScreenScroll>
    </Screen>
  );
}

function Row({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  const { tk } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
      <Ionicons name={icon} size={15} color={tk.textMuted} />
      <Text variant="caption" tone="muted" style={{ width: 66 }}>
        {label}
      </Text>
      <Text variant="caption" style={{ flex: 1, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}
