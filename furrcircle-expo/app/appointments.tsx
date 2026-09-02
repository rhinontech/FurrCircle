import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  GlassCard,
  Screen,
  ScreenHeader,
  ScreenScroll,
  Segmented,
  Text,
} from "../src/components/ui";
import { appointments, petById, vetById } from "../src/data/mock";
import type { AppointmentStatus, ConsultType } from "../src/data/types";
import { spacing, useTheme } from "../src/theme";
import { Ionicons } from "@expo/vector-icons";

const consultIcon: Record<ConsultType, React.ComponentProps<typeof Ionicons>["name"]> = {
  "in-clinic": "business",
  voice: "call",
  video: "videocam",
};

const tone: Record<AppointmentStatus, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  requested: "warning",
  accepted: "primary",
  scheduled: "primary",
  ready: "success",
  "in-consultation": "success",
  completed: "neutral",
  declined: "danger",
  "reschedule-proposed": "warning",
  cancelled: "danger",
  "no-show": "danger",
};

export default function Appointments() {
  const { tk } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  const list = appointments.filter((a) => (filter === "past" ? a.status === "completed" : a.status !== "completed"));

  return (
    <Screen>
      <ScreenHeader title="Appointments" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
          ]}
        />

        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          {list.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Nothing here yet"
              body="Booked consultations and their full history will appear on this screen."
              action={<Button label="Find a vet" onPress={() => router.push("/(owner)/vet")} />}
            />
          ) : null}

          {list.map((a) => {
            const v = vetById(a.vetId)!;
            const pet = petById(a.petId)!;
            return (
              <Pressable key={a.id} onPress={() => router.push(`/appointment/${a.id}`)}>
                <GlassCard>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                    <Avatar uri={v.photo} name={v.name} size={44} ring={v.verified ? "verified" : "none"} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                        {v.name}
                      </Text>
                      <Text variant="caption" tone="secondary" numberOfLines={1}>
                        {a.reason} · {pet.name}
                      </Text>
                    </View>
                    <Badge label={a.status === "ready" ? "Ready" : a.status.replace("-", " ")} tone={tone[a.status]} />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      marginTop: spacing.md,
                      paddingTop: spacing.md,
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: tk.separator,
                    }}
                  >
                    <Ionicons name={consultIcon[a.type]} size={15} color={tk.textMuted} />
                    <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
                      {a.startsAt}
                    </Text>
                    <Text variant="caption" style={{ fontWeight: "700" }}>
                      ₹{a.fee}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>
      </ScreenScroll>
    </Screen>
  );
}
