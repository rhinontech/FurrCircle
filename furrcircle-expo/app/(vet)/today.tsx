import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
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
  Text,
} from "../../src/components/ui";
import { consultQueue, petById, threads, vetAgenda, vetRequests, vetSelf } from "../../src/data/mock";
import type { ConsultType } from "../../src/data/types";
import { palette, radius, spacing, useTheme } from "../../src/theme";

const consultIcon: Record<ConsultType, React.ComponentProps<typeof Ionicons>["name"]> = {
  "in-clinic": "business",
  voice: "call",
  video: "videocam",
};

export default function VetToday() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [available, setAvailable] = useState(true);

  const unread = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <Screen>
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="secondary">
              {vetSelf.speciality}
            </Text>
            <Text variant="title" style={{ marginTop: 2 }}>
              {vetSelf.name}
            </Text>
          </View>
          <IconButton icon="notifications-outline" onPress={() => router.push("/notifications")} />
          <Pressable onPress={() => router.push("/(vet)/profile")}>
            <Avatar uri={vetSelf.photo} name={vetSelf.name} size={40} ring="verified" />
          </Pressable>
        </View>

        {/* Availability --------------------------------------------------- */}
        <View style={[{ borderRadius: radius.xl, overflow: "hidden", marginTop: spacing.lg }, glassShadow(tk, "lg")]}>
          <LinearGradient
            colors={
              available
                ? [palette.mint[400], palette.teal[600]]
                : tk.scheme === "dark"
                  ? [palette.brand[800], palette.brand[950]]
                  : [palette.brand[600], palette.brand[900]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: spacing.xl }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 15,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={available ? "flash" : "moon"} size={21} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" color="#FFFFFF">
                  {available ? "Available for instant consults" : "Unavailable"}
                </Text>
                <Text variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }}>
                  {available
                    ? `${consultQueue.length} owners waiting in the queue`
                    : "Scheduled appointments are unaffected"}
                </Text>
              </View>
              <Switch
                value={available}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  setAvailable(v);
                }}
                trackColor={{ true: "rgba(255,255,255,0.45)", false: "rgba(255,255,255,0.2)" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                marginTop: spacing.lg,
                paddingTop: spacing.lg,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: "rgba(255,255,255,0.22)",
              }}
            >
              {[
                { label: "Today", value: String(vetAgenda.length) },
                { label: "Requests", value: String(vetRequests.length) },
                { label: "Queue", value: String(consultQueue.length) },
                { label: "Unread", value: String(unread) },
              ].map((s, i) => (
                <View key={s.label} style={{ flex: 1, alignItems: i === 0 ? "flex-start" : "center" }}>
                  <Text variant="heading" color="#FFFFFF">
                    {s.value}
                  </Text>
                  <Text variant="micro" color="rgba(255,255,255,0.72)">
                    {s.label.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Consultation queue --------------------------------------------- */}
        {available && consultQueue.length > 0 ? (
          <>
            <SectionHeader title="Consultation queue" action="Settings" onAction={() => {}} />
            <View style={{ gap: spacing.md }}>
              {consultQueue.map((r) => (
                <GlassCard key={r.id} shadow="md" style={{ borderColor: r.urgency === "urgent" ? tk.danger + "44" : tk.glassBorder }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                    <Avatar uri={r.photo} name={r.petName} species={r.species} size={46} ring="live" />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                        {r.petName} · {r.category}
                      </Text>
                      <Text variant="caption" tone="secondary" numberOfLines={1}>
                        {r.ownerName} · waiting {r.waitingMin} min
                      </Text>
                    </View>
                    <Badge
                      label={r.urgency}
                      tone={r.urgency === "urgent" ? "danger" : r.urgency === "soon" ? "warning" : "neutral"}
                    />
                  </View>
                  <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                    <Button label="Accept" icon="videocam" style={{ flex: 1 }} onPress={() => router.push(`/consult/${r.id}`)} />
                    <Button label="Pass" variant="glass" onPress={() => {}} />
                  </View>
                </GlassCard>
              ))}
            </View>
          </>
        ) : null}

        {/* Agenda ---------------------------------------------------------- */}
        <SectionHeader title="Today's agenda" action="Calendar" onAction={() => router.push("/(vet)/schedule")} />
        <GlassCard padded={false} style={{ paddingVertical: spacing.sm }}>
          {vetAgenda.map((a, i) => {
            const pet = petById(a.petId)!;
            return (
              <View key={a.id}>
                <Pressable
                  onPress={() => router.push(`/appointment/${a.id}`)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ width: 58 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                      {a.startsAt.split(" ")[0]}
                    </Text>
                    <Text variant="micro" tone="muted">
                      {a.startsAt.split(" ")[1]} · {a.durationMin}M
                    </Text>
                  </View>
                  <View style={{ width: 3, height: 38, borderRadius: 2, backgroundColor: a.status === "ready" ? tk.success : tk.primary }} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                      {pet.name} · {a.ownerName}
                    </Text>
                    <Text variant="caption" tone="secondary" numberOfLines={1}>
                      {a.reason}
                    </Text>
                  </View>
                  {a.status === "ready" ? (
                    <Button label="Start" size="sm" onPress={() => router.push(`/consult/${a.id}`)} />
                  ) : (
                    <Ionicons name={consultIcon[a.type]} size={17} color={tk.textMuted} />
                  )}
                </Pressable>
                {i < vetAgenda.length - 1 ? (
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: 82 }} />
                ) : null}
              </View>
            );
          })}
        </GlassCard>

        {/* Booking requests ------------------------------------------------ */}
        <SectionHeader title="Booking requests" action={`${vetRequests.length} waiting`} />
        <View style={{ gap: spacing.md }}>
          {vetRequests.map((r) => {
            const pet = petById(r.petId)!;
            return (
              <GlassCard key={r.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <Avatar uri={pet.photo} name={pet.name} species={pet.species} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                      {pet.name} · {r.ownerName}
                    </Text>
                    <Text variant="caption" tone="secondary" numberOfLines={1}>
                      {r.reason}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Ionicons name={consultIcon[r.type]} size={16} color={tk.textMuted} />
                    <Text variant="micro" tone="muted" style={{ marginTop: 3 }}>
                      ₹{r.fee}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    marginTop: spacing.md,
                    paddingTop: spacing.md,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: tk.separator,
                  }}
                >
                  <Ionicons name="time-outline" size={14} color={tk.textMuted} />
                  <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
                    {r.startsAt}
                  </Text>
                  {r.sharedRecordIds.length ? (
                    <Badge label={`${r.sharedRecordIds.length} shared`} tone="verified" icon="document-text" />
                  ) : null}
                </View>

                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                  <Button label="Accept" style={{ flex: 1 }} onPress={() => {}} />
                  <Button label="Propose time" variant="glass" size="md" onPress={() => {}} />
                  <IconButton icon="close" size={48} onPress={() => {}} accessibilityLabel="Decline request" />
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Follow-ups + messages ------------------------------------------- */}
        <SectionHeader title="Needs your attention" />
        <View style={{ gap: spacing.sm }}>
          <ListRow
            icon="repeat"
            tone="warning"
            title="2 follow-ups due today"
            subtitle="Post-op day 5 · dermatology 4-week review"
            onPress={() => {}}
          />
          <ListRow
            icon="chatbubbles"
            tone="primary"
            title={`${unread} unread patient message`}
            subtitle="Within the 7-day follow-up window"
            onPress={() => router.push("/messages")}
          />
          <ListRow
            icon="document-text"
            tone="verified"
            title="1 consultation note unpublished"
            subtitle="Draft from yesterday — owner cannot see it yet"
            onPress={() => {}}
          />
        </View>

        {/* Quick actions ---------------------------------------------------- */}
        <SectionHeader title="Quick actions" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {(
            [
              { icon: "calendar", label: "Open calendar", tone: "primary", href: "/(vet)/schedule" },
              { icon: "add-circle", label: "Create slot", tone: "success", href: "/(vet)/schedule" },
              { icon: "clipboard", label: "Write care plan", tone: "verified", href: "/(vet)/patients" },
              { icon: "shield-checkmark", label: "Post verified answer", tone: "community", href: "/(vet)/community" },
            ] as const
          ).map((a) => (
            <Pressable
              key={a.label}
              onPress={() => router.push(a.href as never)}
              style={({ pressed }) => [
                glassSurface(tk),
                glassShadow(tk, "sm"),
                {
                  width: "47.5%",
                  flexGrow: 1,
                  padding: spacing.lg,
                  borderRadius: radius.lg,
                  gap: spacing.sm,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <IconTile icon={a.icon} tone={a.tone} size={38} />
              <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScreenScroll>
    </Screen>
  );
}
