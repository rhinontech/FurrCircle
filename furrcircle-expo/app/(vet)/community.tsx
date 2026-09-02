import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  IconTile,
  ListRow,
  Screen,
  ScreenScroll,
  SectionHeader,
  Segmented,
  StatRow,
  Text,
  VerifiedMark,
} from "../../src/components/ui";
import { questions, vetSelf } from "../../src/data/mock";
import { radius, spacing, useTheme } from "../../src/theme";

export default function VetCommunity() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<"answer" | "mine" | "posts">("answer");

  const unanswered = questions.filter((q) => !q.vetAnswered);
  const answered = questions.filter((q) => q.vetAnswered);

  return (
    <Screen>
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="title">Community</Text>
            <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
              Build trust with education — not diagnoses.
            </Text>
          </View>
          <Avatar uri={vetSelf.photo} name={vetSelf.name} size={40} ring="verified" />
        </View>

        <GlassCard shadow="md" style={{ marginTop: spacing.lg, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <VerifiedMark size={15} />
            <Text variant="micro" tone="verified">
              VERIFIED VET · {vetSelf.license}
            </Text>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <StatRow
              stats={[
                { label: "Answers", value: "148" },
                { label: "Helpful", value: "96%" },
                { label: "Followers", value: "2.1k" },
              ]}
            />
          </View>
        </GlassCard>

        <Segmented
          style={{ marginTop: spacing.lg }}
          value={tab}
          onChange={setTab}
          options={[
            { value: "answer", label: "To answer", count: unanswered.length },
            { value: "mine", label: "My answers" },
            { value: "posts", label: "Education" },
          ]}
        />

        {tab === "answer" ? (
          <>
            <SectionHeader title="Questions near you" />
            <View style={{ gap: spacing.md }}>
              {unanswered.map((q) => (
                <GlassCard key={q.id}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Avatar uri={q.authorPhoto} name={q.author} size={28} />
                    <Text variant="caption" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
                      {q.author} · {q.petLine}
                    </Text>
                    <Badge label={q.topic} tone="community" />
                  </View>
                  <Text variant="subheading" style={{ marginTop: spacing.md }}>
                    {q.title}
                  </Text>
                  <Text variant="caption" tone="secondary" style={{ marginTop: 4 }} numberOfLines={3}>
                    {q.body}
                  </Text>
                  <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
                    <Button label="Answer" icon="create-outline" style={{ flex: 1 }} onPress={() => router.push(`/question/${q.id}`)} />
                    <Button label="Skip" variant="ghost" onPress={() => {}} />
                  </View>
                </GlassCard>
              ))}
            </View>

            <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
              <Ionicons name="warning" size={16} color={tk.warning} style={{ marginTop: 1 }} />
              <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                Public answers are general education. Do not diagnose, prescribe, or discuss an individual
                animal&apos;s records here — route those to a booking or an existing patient thread.
              </Text>
            </GlassCard>
          </>
        ) : null}

        {tab === "mine" ? (
          <>
            <SectionHeader title="Your verified answers" />
            <View style={{ gap: spacing.md }}>
              {answered.map((q) => (
                <Pressable key={q.id} onPress={() => router.push(`/question/${q.id}`)}>
                  <GlassCard>
                    <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={2}>
                      {q.title}
                    </Text>
                    {q.topAnswer ? (
                      <View
                        style={{
                          marginTop: spacing.md,
                          padding: spacing.md,
                          borderRadius: radius.md,
                          backgroundColor: tk.verifiedSoft,
                        }}
                      >
                        <Text variant="caption" tone="secondary" numberOfLines={3}>
                          {q.topAnswer.text}
                        </Text>
                      </View>
                    ) : null}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: spacing.lg,
                        marginTop: spacing.md,
                        paddingTop: spacing.md,
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: tk.separator,
                      }}
                    >
                      <Text variant="caption" tone="muted">
                        {q.answers} answers
                      </Text>
                      <Text variant="caption" tone="muted">
                        {q.ago} ago
                      </Text>
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {tab === "posts" ? (
          <>
            <SectionHeader title="Publish education" />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              {(
                [
                  { icon: "document-text", label: "Post", tone: "primary" },
                  { icon: "camera", label: "Story", tone: "community" },
                  { icon: "videocam", label: "Reel", tone: "verified" },
                ] as const
              ).map((a) => (
                <Pressable key={a.label} style={{ flex: 1 }}>
                  <GlassCard style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg }} shadow="sm">
                    <IconTile icon={a.icon} tone={a.tone} size={38} />
                    <Text variant="caption" style={{ fontWeight: "700" }}>
                      {a.label}
                    </Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>

            <SectionHeader title="Your recent content" />
            <View style={{ gap: spacing.sm }}>
              <ListRow icon="rainy" tone="primary" title="Monsoon skin care for dogs" subtitle="Post · 1.2k views · 84 saves" onPress={() => {}} />
              <ListRow icon="nutrition" tone="success" title="Reading a pet food label" subtitle="Reel · 4.8k views · 210 saves" onPress={() => {}} />
              <ListRow icon="calendar" tone="community" title="Free vaccination camp, 10 Sep" subtitle="Story · expires in 14 hours" onPress={() => {}} />
            </View>
          </>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}
