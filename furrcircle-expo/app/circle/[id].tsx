import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  IconTile,
  ListRow,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  StatRow,
  Text,
  VerifiedMark,
} from "../../src/components/ui";
import { circles, questions } from "../../src/data/mock";
import { spacing, useTheme } from "../../src/theme";

export default function CircleDetail() {
  const { tk } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const circle = circles.find((c) => c.id === id) ?? circles[0];
  const [joined, setJoined] = useState(circle.joined);

  return (
    <Screen>
      <ScreenHeader title="" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <GlassCard shadow="lg" style={{ alignItems: "center", padding: spacing.xl }}>
          <IconTile
            icon={circle.kind === "city" ? "location" : circle.kind === "breed" ? "paw" : "medkit"}
            tone="community"
            size={64}
          />
          <Text variant="heading" center style={{ marginTop: spacing.md }}>
            {circle.name}
          </Text>
          <Text variant="caption" tone="secondary" center style={{ marginTop: 4, maxWidth: 280 }}>
            {circle.blurb}
          </Text>

          <View style={{ marginTop: spacing.lg }}>
            <StatRow
              stats={[
                { label: "Members", value: circle.members.toLocaleString() },
                { label: "Posts today", value: "24" },
                { label: "Vets", value: "6" },
              ]}
            />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, alignSelf: "stretch" }}>
            <Button
              label={joined ? "Joined" : "Join circle"}
              icon={joined ? "checkmark" : "add"}
              variant={joined ? "glass" : "primary"}
              style={{ flex: 1 }}
              onPress={() => setJoined((j) => !j)}
            />
            <Button label="Ask" variant="glass" icon="create-outline" onPress={() => router.push("/community/ask")} />
          </View>
        </GlassCard>

        <SectionHeader title="Recent in this circle" />
        <View style={{ gap: spacing.md }}>
          {questions.map((q) => (
            <Pressable key={q.id} onPress={() => router.push(`/question/${q.id}`)}>
              <GlassCard>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Avatar uri={q.authorPhoto} name={q.author} size={28} />
                  <Text variant="caption" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
                    {q.author} · {q.ago}
                  </Text>
                  {q.vetAnswered ? <Badge label="Vet answered" tone="verified" icon="shield-checkmark" /> : null}
                </View>
                <Text variant="bodyStrong" style={{ marginTop: spacing.md }} numberOfLines={2}>
                  {q.title}
                </Text>
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
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Circle rules" />
        <GlassCard>
          {[
            "Be kind. This is a support space, not a debate club.",
            "No diagnosis requests aimed at individual members — book a vet for that.",
            "Verified vets answer as education, never as a personal consultation.",
            "Report anything harmful; moderators review within 24 hours.",
          ].map((r) => (
            <View key={r} style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}>
              <Ionicons name="ellipse" size={6} color={tk.community} style={{ marginTop: 7 }} />
              <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
                {r}
              </Text>
            </View>
          ))}
        </GlassCard>

        <SectionHeader title="Vets in this circle" />
        <ListRow icon="shield-checkmark" tone="verified" title="Dr. Sneha Rao" subtitle="Small animal medicine · 42 answers here" onPress={() => router.push("/clinician/v_1")} />
      </ScreenScroll>
    </Screen>
  );
}
