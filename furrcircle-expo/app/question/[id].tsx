import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  glassSurface,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
  VerifiedMark,
} from "../../src/components/ui";
import { questions } from "../../src/data/mock";
import { radius, spacing, useTheme } from "../../src/theme";

const OTHER_ANSWERS = [
  { by: "Karthik R.", verified: false, ago: "2h", votes: 12, text: "Same with my Lab every year after the rains. A deshedding brush twice a week made a big difference." },
  { by: "Meghna T.", verified: false, ago: "1h", votes: 4, text: "Ours shed heavily until we switched to a fish-based food. Worth asking your vet before changing anything." },
];

export default function QuestionDetail() {
  const { tk } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = questions.find((x) => x.id === id) ?? questions[0];
  const [draft, setDraft] = useState("");

  return (
    <Screen>
      <ScreenHeader title="Question" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <GlassCard shadow="md">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Avatar uri={q.authorPhoto} name={q.author} size={36} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                {q.author}
              </Text>
              <Text variant="micro" tone="muted">
                {q.petLine.toUpperCase()} · {q.ago.toUpperCase()}
              </Text>
            </View>
            <Badge label={q.topic} tone="community" />
          </View>

          <Text variant="heading" style={{ marginTop: spacing.lg }}>
            {q.title}
          </Text>
          <Text variant="body" tone="secondary" style={{ marginTop: spacing.sm }}>
            {q.body}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xl,
              marginTop: spacing.lg,
              paddingTop: spacing.md,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: tk.separator,
            }}
          >
            <Action icon="chatbubble-outline" label={`${q.answers}`} />
            <Action icon="bookmark-outline" label="Save" />
            <Action icon="share-outline" label="Share" />
            <View style={{ flex: 1 }} />
            <Action icon="flag-outline" label="" />
          </View>
        </GlassCard>

        {q.topAnswer ? (
          <>
            <SectionHeader title="Verified vet answer" />
            <GlassCard style={{ borderColor: tk.verified + "44" }} shadow="md">
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Avatar name={q.topAnswer.by} size={36} ring="verified" />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                      {q.topAnswer.by}
                    </Text>
                    <VerifiedMark size={13} />
                  </View>
                  <Text variant="micro" tone="verified">
                    FURRCIRCLE VERIFIED VET
                  </Text>
                </View>
              </View>
              <Text variant="body" style={{ marginTop: spacing.md }}>
                {q.topAnswer.text}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  marginTop: spacing.lg,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: tk.verifiedSoft,
                }}
              >
                <Ionicons name="information-circle" size={15} color={tk.verified} />
                <Text variant="caption" tone="verified" style={{ flex: 1 }}>
                  General education, not a diagnosis for your pet.
                </Text>
              </View>

              <Button
                label={`Book with ${q.topAnswer.by}`}
                variant="glass"
                full
                icon="calendar"
                style={{ marginTop: spacing.md }}
                onPress={() => router.push("/book/v_1")}
              />
            </GlassCard>
          </>
        ) : null}

        <SectionHeader title={`${OTHER_ANSWERS.length} community answers`} />
        <View style={{ gap: spacing.md }}>
          {OTHER_ANSWERS.map((a) => (
            <GlassCard key={a.by}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Avatar name={a.by} size={30} />
                <Text variant="caption" style={{ fontWeight: "700", flex: 1 }}>
                  {a.by}
                </Text>
                <Text variant="micro" tone="muted">
                  {a.ago.toUpperCase()}
                </Text>
              </View>
              <Text variant="body" tone="secondary" style={{ marginTop: spacing.sm }}>
                {a.text}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.md }}>
                <Action icon="arrow-up-circle-outline" label={`${a.votes}`} />
                <Action icon="chatbubble-outline" label="Reply" />
              </View>
            </GlassCard>
          ))}
        </View>

        <SectionHeader title="Your answer" />
        <View style={[glassSurface(tk), { borderRadius: radius.lg, padding: spacing.md, minHeight: 90 }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder="Share what worked for you — not medical advice."
            placeholderTextColor={tk.textMuted}
            style={{ color: tk.text, fontSize: 15, fontWeight: "500", flex: 1, textAlignVertical: "top" }}
          />
        </View>
        <Button label="Post answer" full style={{ marginTop: spacing.md }} disabled={!draft.trim()} onPress={() => setDraft("")} />
      </ScreenScroll>
    </Screen>
  );
}

function Action({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }) {
  const { tk } = useTheme();
  return (
    <Pressable hitSlop={6} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Ionicons name={icon} size={16} color={tk.textMuted} />
      {label ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
