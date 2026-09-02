import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

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
  Text,
} from "../src/components/ui";
import { clinics, pets, vets } from "../src/data/mock";
import { radius, spacing, useTheme } from "../src/theme";

const CATEGORIES = ["Skin or coat", "Stomach", "Injury", "Behaviour", "Eyes or ears", "Nutrition", "Other"];
const URGENCY = [
  { value: "routine", label: "Can wait", tone: "success" },
  { value: "soon", label: "Today", tone: "warning" },
  { value: "urgent", label: "Worried", tone: "danger" },
] as const;

type Phase = "compose" | "waiting" | "matched" | "none";

export default function InstantConsult() {
  const { tk } = useTheme();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("compose");
  const [petId, setPetId] = useState(pets[0].id);
  const [category, setCategory] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<(typeof URGENCY)[number]["value"]>("soon");
  const [note, setNote] = useState("");
  const [seconds, setSeconds] = useState(0);

  const available = vets.filter((v) => v.availableNow);

  useEffect(() => {
    if (phase !== "waiting") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    // Demo timing: a vet picks up after a short wait.
    const pick = setTimeout(() => setPhase("matched"), 6000);
    return () => {
      clearInterval(t);
      clearTimeout(pick);
    };
  }, [phase]);

  if (phase === "waiting") {
    return (
      <Screen>
        <ScreenHeader title="" back size="compact" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.lg }}>
          <IconTile icon="flash" tone="warning" size={80} />
          <Text variant="title" center>
            Finding an available vet
          </Text>
          <Text variant="body" tone="secondary" center style={{ maxWidth: 300 }}>
            Your request went to {available.length} vets who are online right now. Response target is under 5
            minutes.
          </Text>
          <Text variant="display" tone="primary">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </Text>
          <Button label="Cancel request" variant="ghost" onPress={() => setPhase("compose")} />
        </View>
      </Screen>
    );
  }

  if (phase === "matched") {
    const vet = available[0];
    return (
      <Screen>
        <ScreenHeader title="" back size="compact" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
          <Avatar uri={vet.photo} name={vet.name} size={96} ring="verified" />
          <Text variant="title" center style={{ marginTop: spacing.sm }}>
            {vet.name} accepted
          </Text>
          <Text variant="body" tone="secondary" center>
            {vet.speciality} · 15 minute consultation · ₹{vet.feeFrom}
          </Text>
          <Button
            label="Join now"
            icon="videocam"
            size="lg"
            full
            style={{ marginTop: spacing.xl }}
            onPress={() => router.replace("/consult/a_1")}
          />
        </View>
      </Screen>
    );
  }

  if (phase === "none") {
    return (
      <Screen>
        <ScreenHeader title="No vet available" back size="compact" />
        <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
          <GlassCard style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing["2xl"] }}>
            <IconTile icon="time" tone="neutral" size={60} />
            <Text variant="subheading" center>
              Nobody picked up this time
            </Text>
            <Text variant="caption" tone="secondary" center style={{ maxWidth: 280 }}>
              Instant consults depend on who is online, so we can never promise one. Here is what you can do
              instead.
            </Text>
          </GlassCard>
          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <ListRow icon="pulse" tone="danger" title="Emergency care nearby" subtitle={`${clinics.filter((c) => c.emergency).length} clinics open now`} onPress={() => router.push("/emergency")} />
            <ListRow icon="calendar" tone="primary" title="Book the next available slot" subtitle="Today from 5:30 PM" onPress={() => router.push("/(owner)/vet")} />
          </View>
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Talk to a vet now" subtitle={`${available.length} vets available`} back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <SectionHeader title="Which pet?" style={{ marginTop: 0 }} />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {pets.map((p) => {
            const on = p.id === petId;
            return (
              <Pressable key={p.id} onPress={() => setPetId(p.id)} style={{ flex: 1 }}>
                <GlassCard
                  style={{
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: spacing.lg,
                    borderColor: on ? tk.primary : tk.glassBorder,
                    borderWidth: on ? 1.5 : StyleSheet.hairlineWidth * 2,
                  }}
                  shadow="sm"
                >
                  <Avatar uri={p.photo} name={p.name} species={p.species} size={44} ring={on ? "brand" : "none"} />
                  <Text variant="caption" style={{ fontWeight: "700" }}>
                    {p.name}
                  </Text>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader title="What's going on?" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCategory(c)}>
              <View
                style={{
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                  borderRadius: radius.pill,
                  backgroundColor: category === c ? tk.primary : tk.glassChip,
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderColor: category === c ? tk.primary : tk.glassBorder,
                }}
              >
                <Text variant="caption" color={category === c ? tk.onPrimary : tk.textSecondary} style={{ fontWeight: "700" }}>
                  {c}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="How urgent does it feel?" />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {URGENCY.map((u) => {
            const on = urgency === u.value;
            const color = u.tone === "success" ? tk.success : u.tone === "warning" ? tk.warning : tk.danger;
            return (
              <Pressable key={u.value} onPress={() => setUrgency(u.value)} style={{ flex: 1 }}>
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: 13,
                    borderRadius: radius.md,
                    backgroundColor: on ? color : tk.glassChip,
                    borderWidth: StyleSheet.hairlineWidth * 2,
                    borderColor: on ? color : tk.glassBorder,
                  }}
                >
                  <Text variant="caption" color={on ? "#FFFFFF" : tk.textSecondary} style={{ fontWeight: "700" }}>
                    {u.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader title="Add detail" />
        <View style={[glassSurface(tk), { borderRadius: radius.lg, padding: spacing.md, minHeight: 90 }]}>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="When did it start? What have you noticed?"
            placeholderTextColor={tk.textMuted}
            style={{ color: tk.text, fontSize: 15, fontWeight: "500", flex: 1, textAlignVertical: "top" }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
          <Button label="Add photo" variant="glass" size="sm" icon="camera" onPress={() => {}} />
          <Button label="Add video" variant="glass" size="sm" icon="videocam" onPress={() => {}} />
        </View>

        <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="information-circle" size={16} color={tk.textMuted} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Instant consults are ₹600 for 15 minutes and depend on who is online — availability is never
            guaranteed. You are only charged once a vet accepts.
          </Text>
        </GlassCard>

        <Button
          label="Request a vet now"
          icon="flash"
          full
          size="lg"
          style={{ marginTop: spacing.lg }}
          disabled={!category}
          onPress={() => {
            setSeconds(0);
            setPhase("waiting");
          }}
        />
        <Button label="No vet available (demo)" variant="ghost" full style={{ marginTop: spacing.sm }} onPress={() => setPhase("none")} />
      </ScreenScroll>
    </Screen>
  );
}
