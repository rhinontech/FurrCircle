import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Badge,
  GlassCard,
  glassSurface,
  Screen,
  ScreenScroll,
  SectionHeader,
  Segmented,
  Text,
} from "../../src/components/ui";
import { ageLabel, pets } from "../../src/data/mock";
import { radius, spacing, useTheme } from "../../src/theme";

/** Patient rows the clinic is allowed to see, with the reason for that access. */
const roster = [
  { petId: "p_1", owner: "Aarav Mehta", lastVisit: "12 Aug 2026", next: "Today, 5:30 PM", access: "Ongoing care", scope: "2 records" },
  { petId: "p_2", owner: "Ritu Nair", lastVisit: "20 Jan 2026", next: "Today, 6:00 PM", access: "This appointment", scope: "No records" },
  { petId: "p_1", owner: "Sameer Joshi", lastVisit: "27 Aug 2026", next: "Today, 6:45 PM", access: "Post-op window", scope: "3 records" },
];

export default function Patients() {
  const insets = useSafeAreaInsets();
  const { tk } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"active" | "follow-up" | "all">("active");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((r) => {
      const pet = pets.find((p) => p.id === r.petId)!;
      return pet.name.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q);
    });
  }, [query]);

  return (
    <Screen>
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + spacing.sm }}>
        <Text variant="title">Patients</Text>

        <View
          style={[
            glassSurface(tk),
            {
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              height: 48,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.lg,
              marginTop: spacing.lg,
            },
          ]}
        >
          <Ionicons name="search" size={17} color={tk.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Pet name, owner or appointment ID"
            placeholderTextColor={tk.textMuted}
            style={{ flex: 1, color: tk.text, fontSize: 15, fontWeight: "500" }}
          />
        </View>

        <Segmented
          style={{ marginTop: spacing.md }}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "active", label: "Active" },
            { value: "follow-up", label: "Follow-up" },
            { value: "all", label: "All" },
          ]}
        />

        <SectionHeader title={`${results.length} patients`} />
        <View style={{ gap: spacing.md }}>
          {results.map((r, i) => {
            const pet = pets.find((p) => p.id === r.petId)!;
            return (
              <Pressable key={`${r.petId}-${i}`} onPress={() => router.push(`/patient/${r.petId}`)}>
                <GlassCard>
                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <Avatar uri={pet.photo} name={pet.name} species={pet.species} size={52} />
                    <View style={{ flex: 1 }}>
                      <Text variant="subheading" numberOfLines={1}>
                        {pet.name}
                      </Text>
                      <Text variant="caption" tone="secondary" numberOfLines={1}>
                        {pet.breed} · {ageLabel(pet.dob)} · {r.owner}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                        {pet.allergies.map((a) => (
                          <Badge key={a} label={a} tone="danger" icon="alert-circle" />
                        ))}
                        {pet.conditions.map((c) => (
                          <Badge key={c} label={c} tone="warning" />
                        ))}
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: spacing.md,
                      paddingTop: spacing.md,
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: tk.separator,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="micro" tone="muted">
                        LAST VISIT
                      </Text>
                      <Text variant="caption" style={{ fontWeight: "700", marginTop: 2 }}>
                        {r.lastVisit}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="micro" tone="muted">
                        NEXT
                      </Text>
                      <Text variant="caption" tone="primary" style={{ fontWeight: "700", marginTop: 2 }}>
                        {r.next}
                      </Text>
                    </View>
                  </View>

                  {/* Every row states why this clinic can see this patient. */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: spacing.md,
                      padding: spacing.sm,
                      borderRadius: radius.sm,
                      backgroundColor: tk.verifiedSoft,
                    }}
                  >
                    <Ionicons name="lock-open" size={13} color={tk.verified} />
                    <Text variant="micro" tone="verified" style={{ flex: 1 }}>
                      ACCESS: {r.access.toUpperCase()} · {r.scope.toUpperCase()}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="information-circle" size={16} color={tk.textMuted} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            You only see pets with a current appointment, a completed care relationship, or explicit owner
            sharing. Every record you open is written to an audit log.
          </Text>
        </GlassCard>
      </ScreenScroll>
    </Screen>
  );
}
