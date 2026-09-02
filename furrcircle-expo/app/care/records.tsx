import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import {
  Badge,
  Button,
  GlassCard,
  GlassChip,
  glassSurface,
  IconTile,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../../src/components/ui";
import { petById, records } from "../../src/data/mock";
import type { RecordCategory } from "../../src/data/types";
import { useSession } from "../../src/store/session";
import { radius, spacing, useTheme } from "../../src/theme";

const CATEGORIES: { value: RecordCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "consultation", label: "Consultations" },
  { value: "lab", label: "Lab reports" },
  { value: "prescription", label: "Prescriptions" },
  { value: "vaccination", label: "Vaccination" },
  { value: "surgery", label: "Surgery" },
  { value: "imaging", label: "Imaging" },
  { value: "insurance", label: "Insurance" },
];

const UPLOAD = [
  { icon: "camera", label: "Scan with camera", tone: "primary" },
  { icon: "image", label: "From photos", tone: "community" },
  { icon: "document", label: "Upload a PDF", tone: "verified" },
] as const;

export default function Records() {
  const { tk } = useTheme();
  const router = useRouter();
  const { activePetId } = useSession();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<RecordCategory | "all">("all");

  const pet = petById(activePetId)!;
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) => r.petId === activePetId)
      .filter((r) => (cat === "all" ? true : r.category === cat))
      .filter((r) => (!q ? true : r.title.toLowerCase().includes(q) || r.clinic.toLowerCase().includes(q)));
  }, [activePetId, cat, query]);

  return (
    <Screen>
      <ScreenHeader title="Records" subtitle={`${pet.name} · private by default`} back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {UPLOAD.map((u) => (
            <Pressable key={u.label} style={{ flex: 1 }}>
              <GlassCard style={{ alignItems: "center", gap: 6, paddingVertical: spacing.lg }} shadow="sm">
                <IconTile icon={u.icon} tone={u.tone} size={38} />
                <Text variant="micro" tone="secondary" center>
                  {u.label.toUpperCase()}
                </Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        <View
          style={[
            glassSurface(tk),
            {
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              height: 46,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.lg,
              marginTop: spacing.lg,
            },
          ]}
        >
          <Ionicons name="search" size={16} color={tk.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search title or clinic"
            placeholderTextColor={tk.textMuted}
            style={{ flex: 1, color: tk.text, fontSize: 15, fontWeight: "500" }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.value} onPress={() => setCat(c.value)}>
              <GlassChip active={cat === c.value}>
                <Text variant="caption" color={cat === c.value ? tk.onPrimary : tk.textSecondary} style={{ fontWeight: "700" }}>
                  {c.label}
                </Text>
              </GlassChip>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader title={`${list.length} records`} action="Share set" onAction={() => router.push("/settings/sharing")} />
        <View style={{ gap: spacing.md }}>
          {list.map((r) => (
            <Pressable key={r.id}>
              <GlassCard>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <IconTile icon={r.fileType === "pdf" ? "document-text" : "image"} tone="verified" size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text variant="caption" tone="secondary" numberOfLines={1}>
                      {r.date} · {r.clinic}
                    </Text>
                  </View>
                  <Badge label={r.category} tone="neutral" />
                </View>

                {r.note ? (
                  <Text variant="caption" tone="secondary" style={{ marginTop: spacing.md }} numberOfLines={2}>
                    {r.note}
                  </Text>
                ) : null}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.lg,
                    marginTop: spacing.md,
                    paddingTop: spacing.md,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: tk.separator,
                  }}
                >
                  {r.sharedWith.length ? (
                    <Badge label={`Shared with ${r.sharedWith.length}`} tone="verified" icon="people" />
                  ) : (
                    <Badge label="Private" tone="neutral" icon="lock-closed" />
                  )}
                  <View style={{ flex: 1 }} />
                  <Pressable hitSlop={8}>
                    <Ionicons name="eye-outline" size={18} color={tk.textMuted} />
                  </Pressable>
                  <Pressable hitSlop={8}>
                    <Ionicons name="download-outline" size={18} color={tk.textMuted} />
                  </Pressable>
                  <Pressable hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={tk.danger} />
                  </Pressable>
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="lock-closed" size={16} color={tk.verified} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Records are encrypted and never appear on {pet.name}&apos;s public profile. You choose which
            categories or individual files a clinic can open, and every access is logged.
          </Text>
        </GlassCard>
      </ScreenScroll>
    </Screen>
  );
}
