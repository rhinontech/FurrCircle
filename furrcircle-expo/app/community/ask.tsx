import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import {
  Avatar,
  Button,
  GlassCard,
  glassSurface,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../../src/components/ui";
import { circles, pets } from "../../src/data/mock";
import { radius, spacing, useTheme } from "../../src/theme";

const TOPICS = [
  { value: "health", label: "Health" },
  { value: "local", label: "Local" },
  { value: "adoption", label: "Adoption" },
  { value: "general", label: "General" },
] as const;

export default function Ask() {
  const { tk } = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState<string>("health");
  const [petId, setPetId] = useState<string | null>(pets[0].id);
  const [circleId, setCircleId] = useState(circles[0].id);

  return (
    <Screen>
      <ScreenHeader title="Ask the community" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <View style={[glassSurface(tk), { borderRadius: radius.lg, padding: spacing.md }]}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ask a clear question"
            placeholderTextColor={tk.textMuted}
            style={{ color: tk.text, fontSize: 17, fontWeight: "700" }}
          />
        </View>

        <View style={[glassSurface(tk), { borderRadius: radius.lg, padding: spacing.md, minHeight: 130, marginTop: spacing.md }]}>
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            placeholder="Add context: age, breed, when it started, what you've tried."
            placeholderTextColor={tk.textMuted}
            style={{ color: tk.text, fontSize: 15, fontWeight: "500", flex: 1, textAlignVertical: "top" }}
          />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
          <Button label="Add photo" variant="glass" size="sm" icon="camera" onPress={() => {}} />
          <Button label="Add video" variant="glass" size="sm" icon="videocam" onPress={() => {}} />
        </View>

        <SectionHeader title="Topic" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {TOPICS.map((t) => (
            <Pressable key={t.value} onPress={() => setTopic(t.value)}>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: radius.pill,
                  backgroundColor: topic === t.value ? tk.community : tk.glassChip,
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderColor: topic === t.value ? tk.community : tk.glassBorder,
                }}
              >
                <Text variant="caption" color={topic === t.value ? "#FFFFFF" : tk.textSecondary} style={{ fontWeight: "700" }}>
                  {t.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Post to" />
        <View style={{ gap: spacing.sm }}>
          {circles
            .filter((c) => c.joined)
            .map((c) => {
              const on = c.id === circleId;
              return (
                <Pressable key={c.id} onPress={() => setCircleId(c.id)}>
                  <GlassCard
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      borderColor: on ? tk.community : tk.glassBorder,
                      borderWidth: on ? 1.5 : StyleSheet.hairlineWidth * 2,
                    }}
                    shadow="sm"
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                        {c.name}
                      </Text>
                      <Text variant="caption" tone="secondary">
                        {c.members.toLocaleString()} members
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: on ? tk.community : tk.border,
                        backgroundColor: on ? tk.community : "transparent",
                      }}
                    />
                  </GlassCard>
                </Pressable>
              );
            })}
        </View>

        <SectionHeader title="Mention a pet (optional)" />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {pets.map((p) => {
            const on = p.id === petId;
            return (
              <Pressable key={p.id} onPress={() => setPetId(on ? null : p.id)} style={{ flex: 1 }}>
                <GlassCard
                  style={{
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: spacing.md,
                    borderColor: on ? tk.primary : tk.glassBorder,
                    borderWidth: on ? 1.5 : StyleSheet.hairlineWidth * 2,
                  }}
                  shadow="sm"
                >
                  <Avatar uri={p.photo} name={p.name} species={p.species} size={38} />
                  <Text variant="caption" style={{ fontWeight: "700" }}>
                    {p.name}
                  </Text>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
          <Ionicons name="lock-closed" size={16} color={tk.verified} style={{ marginTop: 1 }} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Mentioning a pet shares only their public profile — name, breed and age. Records, medications and
            location are never attached to a community post.
          </Text>
        </GlassCard>

        <Button
          label="Post question"
          full
          size="lg"
          style={{ marginTop: spacing.lg }}
          disabled={!title.trim()}
          onPress={() => router.back()}
        />
      </ScreenScroll>
    </Screen>
  );
}
