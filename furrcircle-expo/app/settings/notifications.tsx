import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import {
  GlassCard,
  IconTile,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../../src/components/ui";
import { spacing, useTheme } from "../../src/theme";
import type { Tone } from "../../src/components/ui/Badge";

type Pref = { key: string; icon: React.ComponentProps<typeof Ionicons>["name"]; tone: Tone; label: string; detail: string };

const GROUPS: { title: string; note?: string; items: Pref[] }[] = [
  {
    title: "Care",
    note: "Keep these on even if you mute everything else.",
    items: [
      { key: "meds", icon: "medkit", tone: "primary", label: "Medication reminders", detail: "At each scheduled dose time" },
      { key: "vax", icon: "shield-checkmark", tone: "success", label: "Vaccination due", detail: "14 days, 3 days and 1 day before" },
      { key: "grooming", icon: "water", tone: "community", label: "Grooming and care tasks", detail: "Baths, nails, weight checks" },
      { key: "followups", icon: "repeat", tone: "warning", label: "Follow-ups", detail: "When a vet sets a review date" },
    ],
  },
  {
    title: "Appointments",
    items: [
      { key: "status", icon: "calendar", tone: "primary", label: "Booking status changes", detail: "Requested, accepted, rescheduled, cancelled" },
      { key: "soon", icon: "alarm", tone: "warning", label: "Starting soon", detail: "1 hour and 10 minutes before" },
      { key: "room", icon: "videocam", tone: "verified", label: "Waiting room and call start", detail: "When the vet is ready for you" },
      { key: "clinical", icon: "document-text", tone: "verified", label: "New prescription, plan or record", detail: "Anything a clinic shares with you" },
    ],
  },
  {
    title: "Community",
    note: "Safe to mute — care alerts are unaffected.",
    items: [
      { key: "answers", icon: "chatbubbles", tone: "community", label: "Answers to your questions", detail: "Including verified vet answers" },
      { key: "lost", icon: "alert-circle", tone: "danger", label: "Lost pet alerts nearby", detail: "Within 5 km of your area" },
      { key: "social", icon: "heart", tone: "neutral", label: "Likes, follows and mentions", detail: "Social activity on your posts" },
    ],
  },
];

const CHANNELS = [
  { key: "push", icon: "phone-portrait", label: "Push", detail: "On this device" },
  { key: "email", icon: "mail", label: "Email", detail: "Care summaries and receipts" },
  { key: "sms", icon: "chatbox", label: "SMS", detail: "Appointment reminders only" },
] as const;

export default function NotificationSettings() {
  const { tk } = useTheme();
  const [on, setOn] = useState<Record<string, boolean>>({
    meds: true,
    vax: true,
    grooming: true,
    followups: true,
    status: true,
    soon: true,
    room: true,
    clinical: true,
    answers: true,
    lost: true,
    social: false,
    push: true,
    email: true,
    sms: false,
  });

  const toggle = (k: string) => setOn((s) => ({ ...s, [k]: !s[k] }));

  return (
    <Screen>
      <ScreenHeader title="Notifications" subtitle="Mute the social noise, keep the care alerts" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <SectionHeader title="Channels" style={{ marginTop: 0 }} />
        <GlassCard padded={false} style={{ paddingVertical: spacing.xs }}>
          {CHANNELS.map((c, i) => (
            <View key={c.key}>
              <Row icon={c.icon} tone="primary" label={c.label} detail={c.detail} value={on[c.key]} onToggle={() => toggle(c.key)} />
              {i < CHANNELS.length - 1 ? (
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: 62 }} />
              ) : null}
            </View>
          ))}
        </GlassCard>

        {GROUPS.map((g) => (
          <React.Fragment key={g.title}>
            <SectionHeader title={g.title} />
            {g.note ? (
              <Text variant="caption" tone="muted" style={{ marginBottom: spacing.md, marginTop: -spacing.sm }}>
                {g.note}
              </Text>
            ) : null}
            <GlassCard padded={false} style={{ paddingVertical: spacing.xs }}>
              {g.items.map((p, i) => (
                <View key={p.key}>
                  <Row icon={p.icon} tone={p.tone} label={p.label} detail={p.detail} value={on[p.key]} onToggle={() => toggle(p.key)} />
                  {i < g.items.length - 1 ? (
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: 62 }} />
                  ) : null}
                </View>
              ))}
            </GlassCard>
          </React.Fragment>
        ))}
      </ScreenScroll>
    </Screen>
  );
}

function Row({
  icon,
  tone,
  label,
  detail,
  value,
  onToggle,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tone: Tone;
  label: string;
  detail: string;
  value: boolean;
  onToggle: () => void;
}) {
  const { tk } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md }}>
      <IconTile icon={icon} tone={value ? tone : "neutral"} size={36} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" style={{ fontSize: 14 }}>
          {label}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: tk.primary }} />
    </View>
  );
}
