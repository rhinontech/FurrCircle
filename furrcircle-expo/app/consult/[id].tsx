import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Badge,
  Button,
  GlassBlur,
  GlassCard,
  glassSurface,
  IconTile,
  Text,
  VerifiedMark,
} from "../../src/components/ui";
import { appointments, clinicById, petById, recordById, vetAgenda, vetById } from "../../src/data/mock";
import { palette, radius, spacing, useTheme } from "../../src/theme";

type Phase = "pre-call" | "in-call" | "ended";

const CHECKS = [
  { key: "mic", icon: "mic", label: "Microphone", detail: "Ready" },
  { key: "camera", icon: "videocam", label: "Camera", detail: "Ready" },
  { key: "network", icon: "wifi", label: "Network", detail: "Strong · 42 ms" },
] as const;

export default function ConsultRoom() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const appt = [...appointments, ...vetAgenda].find((a) => a.id === id) ?? appointments[0];
  const vet = vetById(appt.vetId) ?? vetById("v_1")!;
  const clinic = clinicById(appt.clinicId)!;
  const pet = petById(appt.petId)!;
  const shared = appt.sharedRecordIds.map(recordById).filter(Boolean);

  const [phase, setPhase] = useState<Phase>("pre-call");
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [speaker, setSpeaker] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [panel, setPanel] = useState<"context" | "chat">("context");

  useEffect(() => {
    if (phase !== "in-call") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const remaining = Math.max(0, appt.durationMin * 60 - elapsed);
  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  if (phase === "ended") {
    return <AfterCall appt={appt} vetName={vet.name} petName={pet.name} onDone={() => router.back()} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.brand[950] }}>
      {/* Video stage — a real build swaps this for the provider's view. */}
      <LinearGradient
        colors={[palette.brand[800], palette.brand[950], "#04070F"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={{ flex: 1, paddingTop: insets.top + spacing.md }}>
        {/* Top bar --------------------------------------------------------- */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(255,255,255,0.14)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" color="#FFFFFF" numberOfLines={1}>
              {appt.type === "video" ? "Video consultation" : "Voice consultation"}
            </Text>
            <Text variant="micro" color="rgba(255,255,255,0.6)" numberOfLines={1}>
              {pet.name.toUpperCase()} · {clinic.name.toUpperCase()}
            </Text>
          </View>
          {phase === "in-call" ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: radius.pill,
                backgroundColor: "rgba(255,255,255,0.14)",
              }}
            >
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette.mint[400] }} />
              <Text variant="micro" color="#FFFFFF">
                {clock}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Participants ---------------------------------------------------- */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg }}>
          <Avatar uri={vet.photo} name={vet.name} size={116} ring="verified" />
          <View style={{ alignItems: "center", gap: 5 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text variant="heading" color="#FFFFFF">
                {vet.name}
              </Text>
              {vet.verified ? <VerifiedMark size={16} /> : null}
            </View>
            <Text variant="caption" color="rgba(255,255,255,0.6)">
              {vet.speciality}
            </Text>
            <Text variant="caption" color="rgba(255,255,255,0.45)" style={{ marginTop: 4 }}>
              {phase === "pre-call" ? `Starts ${appt.startsAt}` : "Connected"}
            </Text>
          </View>

          {phase === "in-call" && cameraOn ? (
            <View
              style={{
                position: "absolute",
                right: spacing.xl,
                bottom: 0,
                width: 92,
                height: 128,
                borderRadius: radius.lg,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
                backgroundColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={30} color="rgba(255,255,255,0.5)" />
              <Text variant="micro" color="rgba(255,255,255,0.5)" style={{ marginTop: 6 }}>
                YOU
              </Text>
            </View>
          ) : null}
        </View>

        {/* Pre-call checks -------------------------------------------------- */}
        {phase === "pre-call" ? (
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {CHECKS.map((c) => (
                <View
                  key={c.key}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: spacing.md,
                    borderRadius: radius.lg,
                    backgroundColor: "rgba(255,255,255,0.09)",
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: "rgba(255,255,255,0.14)",
                  }}
                >
                  <Ionicons name={c.icon} size={18} color={palette.mint[300]} />
                  <Text variant="micro" color="#FFFFFF">
                    {c.label.toUpperCase()}
                  </Text>
                  <Text variant="micro" color="rgba(255,255,255,0.5)" style={{ fontSize: 10 }}>
                    {c.detail}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Context / chat panel --------------------------------------------- */}
        <GlassBlur
          intensity={40}
          style={{
            marginTop: spacing.lg,
            borderTopLeftRadius: radius["2xl"],
            borderTopRightRadius: radius["2xl"],
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(255,255,255,0.16)",
            paddingTop: spacing.lg,
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          }}
          tinted={false}
        >
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(8,16,34,0.72)" }]} pointerEvents="none" />

          <View style={{ flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.xl }}>
            {(["context", "chat"] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPanel(p)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: radius.pill,
                  backgroundColor: panel === p ? "rgba(255,255,255,0.18)" : "transparent",
                }}
              >
                <Text variant="caption" color={panel === p ? "#FFFFFF" : "rgba(255,255,255,0.55)"} style={{ fontWeight: "700" }}>
                  {p === "context" ? "Visit context" : "Chat"}
                </Text>
              </Pressable>
            ))}
          </View>

          {panel === "context" ? (
            <ScrollView
              style={{ maxHeight: 168 }}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm }}
              showsVerticalScrollIndicator={false}
            >
              <PanelRow icon="chatbox-ellipses" label="Reason" value={appt.reason} />
              <PanelRow icon="paw" label="Patient" value={`${pet.name} · ${pet.breed} · ${pet.weightKg} kg`} />
              {pet.allergies.length ? <PanelRow icon="alert-circle" label="Allergies" value={pet.allergies.join(", ")} danger /> : null}
              <PanelRow
                icon="document-text"
                label="Shared records"
                value={shared.length ? shared.map((r) => r!.title).join(" · ") : "None shared for this visit"}
              />
              <PanelRow icon="images" label="Media" value="2 photos of the affected area" />
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm, minHeight: 120 }}>
              <ChatBubble from="them" text="Hi Aarav — I can see you. Can you show me the left flank?" />
              <ChatBubble from="me" text="Yes, one second." />
            </View>
          )}

          {/* Controls -------------------------------------------------------- */}
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
            {phase === "pre-call" ? (
              <Button
                label={appt.type === "video" ? "Join video call" : "Join voice call"}
                icon={appt.type === "video" ? "videocam" : "call"}
                full
                size="lg"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  setPhase("in-call");
                }}
              />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <CallControl icon={muted ? "mic-off" : "mic"} active={!muted} onPress={() => setMuted((m) => !m)} label="Mute" />
                <CallControl
                  icon={cameraOn ? "videocam" : "videocam-off"}
                  active={cameraOn}
                  onPress={() => setCameraOn((c) => !c)}
                  label="Camera"
                />
                <CallControl icon="camera-reverse" active onPress={() => {}} label="Flip" />
                <CallControl icon={speaker ? "volume-high" : "volume-mute"} active={speaker} onPress={() => setSpeaker((s) => !s)} label="Speaker" />
                <Pressable
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                    setPhase("ended");
                  }}
                  style={({ pressed }) => ({
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    backgroundColor: palette.coral[500],
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: "135deg" }] }} />
                </Pressable>
              </View>
            )}

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md }}>
              <Ionicons name="alert-circle-outline" size={13} color="rgba(255,255,255,0.5)" />
              <Text variant="micro" color="rgba(255,255,255,0.5)" style={{ flex: 1, letterSpacing: 0 }}>
                Virtual care may not be suitable for emergencies. Personal phone numbers are never shared.
              </Text>
            </View>
          </View>
        </GlassBlur>
      </View>
    </View>
  );
}

function PanelRow({
  icon,
  label,
  value,
  danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
      <Ionicons name={icon} size={14} color={danger ? palette.coral[300] : "rgba(255,255,255,0.5)"} style={{ marginTop: 2 }} />
      <Text variant="micro" color="rgba(255,255,255,0.5)" style={{ width: 92 }}>
        {label.toUpperCase()}
      </Text>
      <Text variant="caption" color={danger ? palette.coral[300] : "rgba(255,255,255,0.9)"} style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

function ChatBubble({ from, text }: { from: "me" | "them"; text: string }) {
  const me = from === "me";
  return (
    <View
      style={{
        alignSelf: me ? "flex-end" : "flex-start",
        maxWidth: "82%",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.lg,
        backgroundColor: me ? palette.brand[500] : "rgba(255,255,255,0.13)",
      }}
    >
      <Text variant="caption" color="#FFFFFF">
        {text}
      </Text>
    </View>
  );
}

function CallControl({
  icon,
  active,
  onPress,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => ({
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.34)",
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={21} color="#FFFFFF" />
    </Pressable>
  );
}

/* ------------------------------------------------------------- after a call */

function AfterCall({
  appt,
  vetName,
  petName,
  onDone,
}: {
  appt: { reason: string; durationMin: number };
  vetName: string;
  petName: string;
  onDone: () => void;
}) {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: tk.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing["3xl"],
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing["3xl"],
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          <IconTile icon="checkmark-circle" tone="success" size={64} />
          <Text variant="title" center style={{ marginTop: spacing.sm }}>
            Consultation complete
          </Text>
          <Text variant="caption" tone="secondary" center>
            {appt.reason} · {petName} · {appt.durationMin} min with {vetName}
          </Text>
        </View>

        <GlassCard style={{ marginTop: spacing["2xl"] }}>
          <Badge label="Vet summary" tone="verified" icon="document-text" />
          <Text variant="body" style={{ marginTop: spacing.md }}>
            Skin is responding well to the current dose. Continue Apoquel for another two weeks, keep the weekly
            medicated bath, and send photos if redness returns.
          </Text>
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginVertical: spacing.lg }} />
          <Text variant="micro" tone="muted">
            CARE PLAN
          </Text>
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {["Apoquel ½ tablet daily · 14 days", "Medicated bath weekly", "Follow-up on 15 Sep 2026"].map((t) => (
              <View key={t} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Ionicons name="ellipse" size={6} color={tk.primary} />
                <Text variant="caption" tone="secondary">
                  {t}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <Button label="Add to care timeline and set reminders" icon="notifications" full size="lg" onPress={onDone} />
          <Button label="Book follow-up" variant="glass" icon="calendar" full onPress={onDone} />
          <Button label="Message the clinic" variant="ghost" icon="chatbubble-ellipses" full onPress={onDone} />
        </View>

        <GlassCard style={{ marginTop: spacing.xl, alignItems: "center" }} shadow="sm">
          <Text variant="bodyStrong">How was this visit?</Text>
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} hitSlop={6}>
                <Ionicons name="star-outline" size={26} color={tk.warning} />
              </Pressable>
            ))}
          </View>
          <Text variant="micro" tone="muted" style={{ marginTop: spacing.sm }}>
            REVIEWS COME ONLY FROM COMPLETED APPOINTMENTS
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
}
