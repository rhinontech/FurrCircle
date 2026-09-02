import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  glassShadow,
  glassSurface,
  IconButton,
  IconTile,
  ListRow,
  Screen,
  ScreenScroll,
  SectionHeader,
  Segmented,
  Text,
  VerifiedMark,
} from "../../src/components/ui";
import { adoptables, circles, localItems, questions } from "../../src/data/mock";
import { radius, spacing, useTheme } from "../../src/theme";

type Tab = "circles" | "questions" | "local" | "rescue";

const localMeta = {
  event: { icon: "calendar", tone: "community" },
  playdate: { icon: "tennisball", tone: "primary" },
  lost: { icon: "alert-circle", tone: "danger" },
  found: { icon: "checkmark-circle", tone: "success" },
  rescue: { icon: "heart", tone: "warning" },
  help: { icon: "hand-left", tone: "verified" },
} as const;

export default function Community() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("questions");

  return (
    <Screen>
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text variant="title" style={{ flex: 1 }}>
            Community
          </Text>
          <IconButton icon="search-outline" onPress={() => {}} accessibilityLabel="Search community" />
          <IconButton icon="create-outline" onPress={() => router.push("/community/ask")} accessibilityLabel="Ask a question" />
        </View>

        <Segmented
          style={{ marginTop: spacing.lg }}
          value={tab}
          onChange={setTab}
          options={[
            { value: "circles", label: "Circles" },
            { value: "questions", label: "Questions" },
            { value: "local", label: "Local" },
            { value: "rescue", label: "Rescue" },
          ]}
        />

        {tab === "circles" ? <CirclesTab /> : null}
        {tab === "questions" ? <QuestionsTab /> : null}
        {tab === "local" ? <LocalTab /> : null}
        {tab === "rescue" ? <RescueTab /> : null}
      </ScreenScroll>
    </Screen>
  );
}

/* ------------------------------------------------------------------ circles */

function CirclesTab() {
  const router = useRouter();
  const joined = circles.filter((c) => c.joined);
  const suggested = circles.filter((c) => !c.joined);

  return (
    <>
      <SectionHeader title="My circles" />
      <View style={{ gap: spacing.sm }}>
        {joined.map((c) => (
          <ListRow
            key={c.id}
            icon={c.kind === "city" ? "location" : c.kind === "breed" ? "paw" : "medkit"}
            tone={c.kind === "health" ? "verified" : "community"}
            title={c.name}
            subtitle={`${c.members.toLocaleString()} members · ${c.blurb}`}
            onPress={() => router.push(`/circle/${c.id}`)}
          />
        ))}
      </View>

      <SectionHeader title="Suggested for you" />
      <View style={{ gap: spacing.sm }}>
        {suggested.map((c) => (
          <ListRow
            key={c.id}
            icon={c.kind === "rescue" ? "heart" : "people"}
            tone="primary"
            title={c.name}
            subtitle={`${c.members.toLocaleString()} members · ${c.blurb}`}
            right={<Button label="Join" size="sm" variant="glass" onPress={() => {}} />}
          />
        ))}
      </View>
    </>
  );
}

/* ---------------------------------------------------------------- questions */

function QuestionsTab() {
  const { tk } = useTheme();
  const router = useRouter();

  return (
    <>
      <Pressable
        onPress={() => router.push("/community/ask")}
        style={({ pressed }) => [
          glassSurface(tk),
          glassShadow(tk, "sm"),
          {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            marginTop: spacing.lg,
            padding: spacing.md,
            borderRadius: radius.lg,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <IconTile icon="help-buoy" tone="community" size={38} />
        <Text variant="body" tone="muted" style={{ flex: 1 }}>
          Ask about your pet&apos;s health, behaviour or your area…
        </Text>
        <Ionicons name="arrow-forward-circle" size={22} color={tk.community} />
      </Pressable>

      <SectionHeader title="Recent questions" action="Filter" onAction={() => {}} />
      <View style={{ gap: spacing.md }}>
        {questions.map((q) => (
          <Pressable key={q.id} onPress={() => router.push(`/question/${q.id}`)}>
            <GlassCard>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Avatar uri={q.authorPhoto} name={q.author} size={30} />
                <View style={{ flex: 1 }}>
                  <Text variant="caption" style={{ fontWeight: "700" }} numberOfLines={1}>
                    {q.author}
                  </Text>
                  <Text variant="micro" tone="muted">
                    {q.petLine.toUpperCase()} · {q.ago.toUpperCase()}
                  </Text>
                </View>
                {q.vetAnswered ? <Badge label="Vet answered" tone="verified" icon="shield-checkmark" /> : null}
              </View>

              <Text variant="subheading" style={{ marginTop: spacing.md }}>
                {q.title}
              </Text>
              <Text variant="caption" tone="secondary" style={{ marginTop: 4 }} numberOfLines={2}>
                {q.body}
              </Text>

              {q.topAnswer ? (
                <View
                  style={{
                    marginTop: spacing.md,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: tk.verifiedSoft,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <VerifiedMark size={13} />
                    <Text variant="micro" tone="verified">
                      {q.topAnswer.by.toUpperCase()}
                    </Text>
                  </View>
                  <Text variant="caption" tone="secondary" numberOfLines={3}>
                    {q.topAnswer.text}
                  </Text>
                </View>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xl,
                  marginTop: spacing.md,
                  paddingTop: spacing.md,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: tk.separator,
                }}
              >
                <Meta icon="chatbubble-outline" label={`${q.answers} answers`} />
                <Meta icon="bookmark-outline" label="Save" />
                <View style={{ flex: 1 }} />
                <Meta icon="share-outline" label="" />
              </View>
            </GlassCard>
          </Pressable>
        ))}
      </View>

      <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
        <Ionicons name="information-circle" size={16} color={tk.textMuted} style={{ marginTop: 1 }} />
        <Text variant="caption" tone="muted" style={{ flex: 1 }}>
          Community answers — including verified vet answers — are general education, not a diagnosis for your
          pet. Book a consultation for anything specific to your animal.
        </Text>
      </GlassCard>
    </>
  );
}

function Meta({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }) {
  const { tk } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Ionicons name={icon} size={15} color={tk.textMuted} />
      {label ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------- local */

function LocalTab() {
  const { tk } = useTheme();

  return (
    <>
      <SectionHeader title="Near Indiranagar" action="Change" onAction={() => {}} />
      <View style={{ gap: spacing.md }}>
        {localItems.map((item) => {
          const meta = localMeta[item.kind];
          return (
            <GlassCard key={item.id} padded={false}>
              {item.photo ? (
                <Image source={{ uri: item.photo }} style={{ height: 130, width: "100%" }} contentFit="cover" transition={200} />
              ) : null}
              <View style={{ padding: spacing.lg }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <IconTile icon={meta.icon} tone={meta.tone} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text variant="micro" tone="muted" style={{ marginTop: 2 }}>
                      {item.when.toUpperCase()} · {item.distanceKm} KM AWAY
                    </Text>
                  </View>
                  {item.urgent ? <Badge label="Urgent" tone="danger" /> : null}
                </View>
                <Text variant="caption" tone="secondary" style={{ marginTop: spacing.md }}>
                  {item.detail}
                </Text>
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
                  <Button
                    label={item.kind === "lost" ? "I've seen this pet" : item.kind === "event" || item.kind === "playdate" ? "I'm going" : "Help out"}
                    size="sm"
                    variant={item.urgent ? "primary" : "glass"}
                    onPress={() => {}}
                  />
                  <Button label="Share" size="sm" variant="ghost" icon="share-outline" onPress={() => {}} />
                </View>
              </View>
            </GlassCard>
          );
        })}
      </View>

      <Pressable style={{ marginTop: spacing.xl }}>
        <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, borderColor: tk.danger + "44" }}>
          <IconTile icon="megaphone" tone="danger" size={42} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ fontSize: 14 }}>
              Report a lost or found pet
            </Text>
            <Text variant="caption" tone="secondary">
              Alerts everyone within 5 km immediately.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={tk.textMuted} />
        </GlassCard>
      </Pressable>
    </>
  );
}

/* ------------------------------------------------------------------- rescue */

function RescueTab() {
  const { tk } = useTheme();

  return (
    <>
      <SectionHeader title="Adoptable near you" action="Filters" onAction={() => {}} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        {adoptables.map((a) => (
          <Pressable key={a.id} style={{ width: "47.5%", flexGrow: 1 }}>
            <GlassCard padded={false}>
              <Image source={{ uri: a.photo }} style={{ height: 130, width: "100%" }} contentFit="cover" transition={200} />
              <View style={{ padding: spacing.md, gap: 3 }}>
                <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                  {a.name}
                </Text>
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  {a.breed} · {a.ageLabel}
                </Text>
                <Text variant="micro" tone="muted" numberOfLines={1}>
                  {a.shelter.toUpperCase()} · {a.distanceKm} KM
                </Text>
                <View style={{ flexDirection: "row", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                  {a.vaccinated ? <Badge label="Vaccinated" tone="success" /> : null}
                  {a.sterilized ? <Badge label="Sterilised" tone="verified" /> : null}
                </View>
              </View>
            </GlassCard>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Foster needs" />
      <ListRow
        icon="home"
        tone="warning"
        title="3 puppies need a 4-week foster"
        subtitle="Indie Rescue Network · food and medical costs covered"
        onPress={() => {}}
      />
      <View style={{ height: spacing.sm }} />
      <ListRow
        icon="car"
        tone="primary"
        title="Transport volunteer — Sunday"
        subtitle="Koramangala to Whitefield · 2 cats to their new home"
        onPress={() => {}}
      />
    </>
  );
}
