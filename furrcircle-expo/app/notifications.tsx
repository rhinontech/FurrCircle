import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  Badge,
  GlassCard,
  IconTile,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Segmented,
  Text,
} from "../src/components/ui";
import { spacing, useTheme } from "../src/theme";
import type { Tone } from "../src/components/ui/Badge";

type Item = {
  id: string;
  group: "care" | "appointments" | "community";
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tone: Tone;
  title: string;
  body: string;
  ago: string;
  unread?: boolean;
  href?: string;
};

const ITEMS: Item[] = [
  {
    id: "n1",
    group: "appointments",
    icon: "videocam",
    tone: "success",
    title: "Your consultation is ready to join",
    body: "Dr. Sneha Rao · Milo · skin flare review",
    ago: "2m",
    unread: true,
    href: "/consult/a_1",
  },
  {
    id: "n2",
    group: "care",
    icon: "medkit",
    tone: "primary",
    title: "Omega-3 supplement due at 8:00 PM",
    body: "Milo · 1 capsule after dinner",
    ago: "1h",
    unread: true,
    href: "/care/medications",
  },
  {
    id: "n3",
    group: "appointments",
    icon: "document-text",
    tone: "verified",
    title: "Dr. Sneha Rao shared a consultation note",
    body: "Added to Milo's health timeline",
    ago: "yesterday",
    href: "/(owner)/care",
  },
  {
    id: "n4",
    group: "care",
    icon: "shield-half",
    tone: "warning",
    title: "Leptospirosis vaccination is past due",
    body: "Milo · was due 10 Aug 2026",
    ago: "2d",
    href: "/care/vaccines",
  },
  {
    id: "n5",
    group: "community",
    icon: "shield-checkmark",
    tone: "community",
    title: "A vet answered a question you saved",
    body: "Dr. Meera Krishnan on senior cats and thirst",
    ago: "2d",
    href: "/question/q_3",
  },
  {
    id: "n6",
    group: "community",
    icon: "alert-circle",
    tone: "danger",
    title: "Lost pet alert 2.1 km away",
    body: "Beagle named Coco, last seen near Domlur",
    ago: "3d",
    href: "/(owner)/community",
  },
];

export default function Notifications() {
  const { tk } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "care" | "appointments" | "community">("all");

  const list = ITEMS.filter((i) => filter === "all" || i.group === filter);

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        back
        size="compact"
        right={
          <Pressable onPress={() => router.push("/settings/notifications")} hitSlop={8}>
            <Ionicons name="options-outline" size={20} color={tk.text} />
          </Pressable>
        }
      />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <Segmented
          scrollable
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "care", label: "Care" },
            { value: "appointments", label: "Appointments" },
            { value: "community", label: "Community" },
          ]}
        />

        <SectionHeader title={`${list.filter((i) => i.unread).length} unread`} action="Mark all read" onAction={() => {}} />
        <GlassCard padded={false} style={{ paddingVertical: spacing.xs }}>
          {list.map((n, i) => (
            <View key={n.id}>
              <Pressable
                onPress={() => n.href && router.push(n.href as never)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  gap: spacing.md,
                  padding: spacing.md,
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: n.unread ? tk.primarySoft : "transparent",
                })}
              >
                <IconTile icon={n.icon} tone={n.tone} size={40} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={2}>
                    {n.title}
                  </Text>
                  <Text variant="caption" tone="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
                    {n.body}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text variant="micro" tone="muted">
                    {n.ago.toUpperCase()}
                  </Text>
                  {n.unread ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tk.primary }} /> : null}
                </View>
              </Pressable>
              {i < list.length - 1 ? (
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: 68 }} />
              ) : null}
            </View>
          ))}
        </GlassCard>
      </ScreenScroll>
    </Screen>
  );
}
