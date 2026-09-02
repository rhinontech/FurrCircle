import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

import {
  Avatar,
  Badge,
  GlassCard,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../src/components/ui";
import { clinicById, petById, threads, vetById } from "../src/data/mock";
import { spacing, useTheme } from "../src/theme";

export default function Messages() {
  const { tk } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader title="Messages" subtitle="Tied to appointments, never to phone numbers" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <SectionHeader title={`${threads.length} threads`} style={{ marginTop: 0 }} />
        <View style={{ gap: spacing.md }}>
          {threads.map((t) => {
            const v = vetById(t.vetId)!;
            const pet = petById(t.petId)!;
            const clinic = clinicById(t.clinicId)!;
            return (
              <Pressable key={t.id} onPress={() => router.push(`/thread/${t.id}`)}>
                <GlassCard>
                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <Avatar uri={v.photo} name={v.name} size={46} ring={v.verified ? "verified" : "none"} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text variant="bodyStrong" style={{ fontSize: 14, flex: 1 }} numberOfLines={1}>
                          {v.name}
                        </Text>
                        <Text variant="micro" tone="muted">
                          {t.ago.toUpperCase()}
                        </Text>
                      </View>
                      <Text variant="micro" tone="muted" style={{ marginTop: 2 }}>
                        {clinic.name.toUpperCase()} · {pet.name.toUpperCase()}
                      </Text>
                      <Text variant="caption" tone="secondary" style={{ marginTop: 6 }} numberOfLines={2}>
                        {t.lastMessage}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.md }}>
                        {t.resolved ? (
                          <Badge label="Resolved" tone="neutral" icon="checkmark-done" />
                        ) : t.windowClosesIn ? (
                          <Badge label={`${t.windowClosesIn} left in follow-up window`} tone="primary" icon="time" />
                        ) : null}
                      </View>
                    </View>
                    {t.unread ? (
                      <View
                        style={{
                          minWidth: 20,
                          height: 20,
                          borderRadius: 10,
                          paddingHorizontal: 6,
                          backgroundColor: tk.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text variant="micro" color={tk.onPrimary}>
                          {t.unread}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="alert-circle" size={16} color={tk.warning} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Threads open when an appointment is booked and close after the clinic&apos;s follow-up window. They
            are not monitored around the clock — for anything urgent use Emergency care nearby.
          </Text>
        </GlassCard>
      </ScreenScroll>
    </Screen>
  );
}
