import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Badge,
  Button,
  GlassCard,
  glassShadow,
  glassSurface,
  IconTile,
  ListRow,
  Screen,
  ScreenScroll,
  SectionHeader,
  Segmented,
  Text,
} from "../../src/components/ui";
import { petById, vetAgenda } from "../../src/data/mock";
import type { ConsultType } from "../../src/data/types";
import { radius, spacing, useTheme } from "../../src/theme";

const consultIcon: Record<ConsultType, React.ComponentProps<typeof Ionicons>["name"]> = {
  "in-clinic": "business",
  voice: "call",
  video: "videocam",
};

const HOURS = ["4 PM", "5 PM", "6 PM", "7 PM", "8 PM"];
const DAYS = [
  { d: "Mon", n: 1, count: 6 },
  { d: "Tue", n: 2, count: 4 },
  { d: "Wed", n: 3, count: 7 },
  { d: "Thu", n: 4, count: 3 },
  { d: "Fri", n: 5, count: 8, today: true },
  { d: "Sat", n: 6, count: 5 },
  { d: "Sun", n: 7, count: 0 },
];

export default function Schedule() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [view, setView] = useState<"day" | "week" | "list">("day");

  return (
    <Screen>
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text variant="title" style={{ flex: 1 }}>
            Schedule
          </Text>
          <Button label="Create slot" size="sm" icon="add" onPress={() => {}} />
        </View>

        <Segmented
          style={{ marginTop: spacing.lg }}
          value={view}
          onChange={setView}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
            { value: "list", label: "List" },
          ]}
        />

        {/* Week strip ----------------------------------------------------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.lg }}
        >
          {DAYS.map((day) => (
            <Pressable key={day.d}>
              <View
                style={[
                  glassSurface(tk, day.today ? "card" : "chip"),
                  {
                    width: 58,
                    paddingVertical: spacing.md,
                    borderRadius: radius.lg,
                    alignItems: "center",
                    gap: 4,
                    borderColor: day.today ? tk.primary : tk.glassBorder,
                    borderWidth: day.today ? 1.5 : StyleSheet.hairlineWidth * 2,
                  },
                ]}
              >
                <Text variant="micro" tone="muted">
                  {day.d.toUpperCase()}
                </Text>
                <Text variant="subheading" tone={day.today ? "primary" : "default"}>
                  {day.n}
                </Text>
                <View
                  style={{
                    width: 18,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: day.count === 0 ? tk.separator : day.count > 6 ? tk.warning : tk.success,
                  }}
                />
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {view === "day" ? (
          <>
            <GlassCard padded={false} style={{ padding: spacing.md }}>
              {HOURS.map((h) => {
                const slot = vetAgenda.find((a) => a.startsAt.startsWith(h.split(" ")[0]));
                return (
                  <View key={h} style={{ flexDirection: "row", gap: spacing.md, minHeight: 62 }}>
                    <Text variant="micro" tone="muted" style={{ width: 44, paddingTop: 4 }}>
                      {h}
                    </Text>
                    <View style={{ flex: 1, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tk.separator, paddingTop: 6 }}>
                      {slot ? (
                        <Pressable
                          onPress={() => router.push(`/appointment/${slot.id}`)}
                          style={({ pressed }) => [
                            {
                              flexDirection: "row",
                              alignItems: "center",
                              gap: spacing.sm,
                              padding: spacing.md,
                              borderRadius: radius.md,
                              backgroundColor: slot.type === "in-clinic" ? tk.primarySoft : tk.verifiedSoft,
                              borderLeftWidth: 3,
                              borderLeftColor: slot.type === "in-clinic" ? tk.primary : tk.verified,
                              opacity: pressed ? 0.7 : 1,
                            },
                          ]}
                        >
                          <Ionicons
                            name={consultIcon[slot.type]}
                            size={15}
                            color={slot.type === "in-clinic" ? tk.primary : tk.verified}
                          />
                          <View style={{ flex: 1 }}>
                            <Text variant="caption" style={{ fontWeight: "700" }} numberOfLines={1}>
                              {petById(slot.petId)?.name} · {slot.ownerName}
                            </Text>
                            <Text variant="micro" tone="muted" numberOfLines={1}>
                              {slot.reason.toUpperCase()}
                            </Text>
                          </View>
                        </Pressable>
                      ) : (
                        <Pressable
                          style={({ pressed }) => ({
                            padding: spacing.md,
                            borderRadius: radius.md,
                            borderWidth: StyleSheet.hairlineWidth * 2,
                            borderStyle: "dashed",
                            borderColor: tk.border,
                            opacity: pressed ? 0.5 : 1,
                          })}
                        >
                          <Text variant="caption" tone="muted">
                            Free · tap to block or open a slot
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </GlassCard>

            <SectionHeader title="Availability rules" />
            <View style={{ gap: spacing.sm }}>
              <ListRow icon="repeat" tone="primary" title="Weekday clinic hours" subtitle="Mon–Sat · 9:00 AM – 8:00 PM · 20 min slots" onPress={() => {}} />
              <ListRow icon="videocam" tone="verified" title="Teleconsult window" subtitle="Mon–Fri · 5:00 – 7:00 PM · 15 min slots" onPress={() => {}} />
              <ListRow icon="hourglass" tone="neutral" title="Buffer and limits" subtitle="10 min buffer · max 14 consults/day · 2 h lead time" onPress={() => {}} />
              <ListRow icon="airplane" tone="warning" title="Block leave" subtitle="No blocked periods scheduled" onPress={() => {}} />
            </View>
          </>
        ) : null}

        {view === "week" ? (
          <GlassCard>
            <Text variant="subheading">This week</Text>
            <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
              {DAYS.map((d) => (
                <View key={d.d} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <Text variant="caption" tone={d.today ? "primary" : "secondary"} style={{ width: 40, fontWeight: "700" }}>
                    {d.d}
                  </Text>
                  <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: tk.separator, overflow: "hidden" }}>
                    <View
                      style={{
                        width: `${Math.min(100, (d.count / 8) * 100)}%`,
                        height: "100%",
                        borderRadius: 5,
                        backgroundColor: d.count > 6 ? tk.warning : d.count === 0 ? tk.separator : tk.success,
                      }}
                    />
                  </View>
                  <Text variant="caption" tone="muted" style={{ width: 56, textAlign: "right" }}>
                    {d.count ? `${d.count} appts` : "Closed"}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        ) : null}

        {view === "list" ? (
          <View style={{ gap: spacing.md }}>
            {vetAgenda.map((a) => {
              const pet = petById(a.petId)!;
              return (
                <Pressable key={a.id} onPress={() => router.push(`/appointment/${a.id}`)}>
                  <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }} shadow="sm">
                    <IconTile icon={consultIcon[a.type]} tone={a.type === "in-clinic" ? "primary" : "verified"} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                        {a.startsAt} · {pet.name}
                      </Text>
                      <Text variant="caption" tone="secondary" numberOfLines={1}>
                        {a.ownerName} · {a.reason}
                      </Text>
                    </View>
                    <Badge label={a.status === "ready" ? "Ready" : a.status} tone={a.status === "ready" ? "success" : "primary"} />
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}
