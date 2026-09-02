import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PetSwitcher } from "../../src/components/cards/PetSwitcher";
import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  glassShadow,
  glassSurface,
  IconButton,
  IconTile,
  ProgressRing,
  Screen,
  ScreenScroll,
  SectionHeader,
  Text,
  VerifiedMark,
} from "../../src/components/ui";
import {
  ageLabel,
  appointments,
  clinicById,
  owner,
  petById,
  questions,
  timeline,
  vaccines,
  vetById,
} from "../../src/data/mock";
import type { CareTask } from "../../src/data/types";
import { useSession } from "../../src/store/session";
import { palette, radius, spacing, useTheme } from "../../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const taskIcon = {
  medication: "medkit",
  meal: "restaurant",
  activity: "walk",
  grooming: "water",
  appointment: "calendar",
  record: "document-text",
} as const;

const consultIcon = { "in-clinic": "business", voice: "call", video: "videocam" } as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Today() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activePetId, tasks, toggleTask } = useSession();

  const pet = petById(activePetId)!;
  const petTasks = useMemo(() => tasks.filter((t) => t.petId === activePetId), [tasks, activePetId]);
  const done = petTasks.filter((t) => t.done).length;
  const progress = petTasks.length ? done / petTasks.length : 1;

  const overdue = vaccines.find((v) => v.petId === activePetId && v.status === "overdue");
  const dueSoon = vaccines.find((v) => v.petId === activePetId && v.status === "due-soon");

  const next = appointments.find(
    (a) => a.petId === activePetId && ["ready", "scheduled", "accepted"].includes(a.status),
  );
  const nextVet = next ? vetById(next.vetId) : undefined;
  const nextClinic = next ? clinicById(next.clinicId) : undefined;

  const status = overdue
    ? { tone: "warning" as const, label: "Vaccination due", detail: `${overdue.name} was due ${overdue.dueOn}` }
    : petTasks.some((t) => !t.done)
      ? { tone: "primary" as const, label: "Care in progress", detail: `${petTasks.length - done} tasks left today` }
      : { tone: "success" as const, label: "All caught up", detail: "Nothing due for the rest of today" };

  const updates = timeline.filter((t) => t.petId === activePetId).slice(0, 3);
  const featured = questions.find((q) => q.vetAnswered)!;

  return (
    <Screen>
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + spacing.sm }}>
        {/* Greeting ------------------------------------------------------ */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="secondary">
              {greeting()}, {owner.name.split(" ")[0]}
            </Text>
            <Text variant="title" style={{ marginTop: 2 }}>
              Today
            </Text>
          </View>
          <IconButton icon="notifications-outline" onPress={() => router.push("/notifications")} />
          <Pressable onPress={() => router.push("/(owner)/profile")}>
            <Avatar uri={owner.photo} name={owner.name} size={40} />
          </Pressable>
        </View>

        {/* Pet switcher -------------------------------------------------- */}
        <View style={{ marginTop: spacing.lg }}>
          <PetSwitcher />
        </View>

        {/* Health status ------------------------------------------------- */}
        <GlassCard shadow="lg" style={{ marginTop: spacing.lg, padding: spacing.xl }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
            <ProgressRing progress={progress} size={68} stroke={7} tone={status.tone}>
              <Text variant="subheading">{Math.round(progress * 100)}%</Text>
            </ProgressRing>
            <View style={{ flex: 1 }}>
              <Badge label={status.label} tone={status.tone} />
              <Text variant="subheading" style={{ marginTop: spacing.sm }}>
                {pet.name}&apos;s day
              </Text>
              <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
                {status.detail}
              </Text>
            </View>
          </View>

          {(overdue || dueSoon) && (
            <Pressable
              onPress={() => router.push("/care/vaccines")}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  marginTop: spacing.lg,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: overdue ? tk.warningSoft : tk.primarySoft,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons
                name="shield-half"
                size={16}
                color={overdue ? tk.warning : tk.primary}
              />
              <Text variant="caption" style={{ flex: 1 }} color={overdue ? tk.warning : tk.primary}>
                {overdue
                  ? `${overdue.name} is past its due date — book a slot when it suits you.`
                  : `${dueSoon!.name} is due on ${dueSoon!.dueOn}.`}
              </Text>
              <Ionicons name="chevron-forward" size={15} color={overdue ? tk.warning : tk.primary} />
            </Pressable>
          )}
        </GlassCard>

        {/* Next appointment ---------------------------------------------- */}
        {next && nextVet ? (
          <>
            <SectionHeader title="Next appointment" action="History" onAction={() => router.push("/appointments")} />
            <View style={[{ borderRadius: radius.xl, overflow: "hidden" }, glassShadow(tk, "lg")]}>
              <LinearGradient
                colors={
                  tk.scheme === "dark"
                    ? [palette.brand[800], palette.brand[950]]
                    : [palette.brand[600], palette.brand[900]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: spacing.xl }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <Avatar uri={nextVet.photo} name={nextVet.name} size={46} ring="verified" />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Text variant="bodyStrong" color="#FFFFFF" numberOfLines={1}>
                        {nextVet.name}
                      </Text>
                      {nextVet.verified ? <VerifiedMark size={14} /> : null}
                    </View>
                    <Text variant="caption" color="rgba(255,255,255,0.75)" numberOfLines={1}>
                      {nextClinic?.name}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: radius.pill,
                      backgroundColor: "rgba(255,255,255,0.16)",
                    }}
                  >
                    <Ionicons name={consultIcon[next.type]} size={12} color="#FFFFFF" />
                    <Text variant="micro" color="#FFFFFF">
                      {next.type === "in-clinic" ? "IN-CLINIC" : next.type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.18)", marginVertical: spacing.lg }} />

                <Text variant="caption" color="rgba(255,255,255,0.72)">
                  {next.reason} · {pet.name}
                </Text>
                <Text variant="heading" color="#FFFFFF" style={{ marginTop: 3 }}>
                  {next.startsAt}
                </Text>

                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
                  {next.status === "ready" ? (
                    <Button
                      label={next.type === "video" ? "Join video call" : "Join call"}
                      icon={consultIcon[next.type]}
                      variant="inverse"
                      style={{ flex: 1 }}
                      onPress={() => router.push(`/consult/${next.id}`)}
                    />
                  ) : (
                    <Button
                      label="View details"
                      variant="inverse"
                      style={{ flex: 1 }}
                      onPress={() => router.push(`/appointment/${next.id}`)}
                    />
                  )}
                  <IconButton
                    icon="chatbubble-ellipses-outline"
                    size={48}
                    tone="#FFFFFF"
                    style={{ backgroundColor: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.22)" }}
                    onPress={() => router.push("/messages")}
                  />
                </View>
              </LinearGradient>
            </View>
          </>
        ) : null}

        {/* Checklist ------------------------------------------------------ */}
        <SectionHeader title="Today's checklist" action={`${done}/${petTasks.length}`} />
        <View style={{ gap: spacing.sm }}>
          {petTasks.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} />
          ))}
        </View>

        {/* Quick actions -------------------------------------------------- */}
        <SectionHeader title="Quick actions" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {(
            [
              { icon: "search", label: "Book a vet", tone: "primary", href: "/(owner)/vet" },
              { icon: "medkit", label: "Log medicine", tone: "success", href: "/care/medications" },
              { icon: "cloud-upload", label: "Upload record", tone: "verified", href: "/care/records" },
              { icon: "help-buoy", label: "Ask community", tone: "community", href: "/(owner)/community" },
            ] as const
          ).map((a) => (
            <Pressable
              key={a.label}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                router.push(a.href as never);
              }}
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

        {/* Recent care ---------------------------------------------------- */}
        <SectionHeader title="Recent care" action="Timeline" onAction={() => router.push("/(owner)/care")} />
        <GlassCard padded={false} style={{ paddingVertical: spacing.xs }}>
          {updates.map((u, i) => (
            <View key={u.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md }}>
                <IconTile icon={u.icon} tone={u.tone} size={38} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                    {u.title}
                  </Text>
                  <Text variant="caption" tone="secondary" numberOfLines={1}>
                    {u.detail}
                  </Text>
                </View>
                <Text variant="micro" tone="muted">
                  {u.at.split(",")[0].toUpperCase()}
                </Text>
              </View>
              {i < updates.length - 1 ? (
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: 66 }} />
              ) : null}
            </View>
          ))}
        </GlassCard>

        {/* One community surface — deliberately small, not an endless feed */}
        <SectionHeader title="From your circles" action="Open" onAction={() => router.push("/(owner)/community")} />
        <Pressable onPress={() => router.push(`/question/${featured.id}`)}>
          <GlassCard>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Avatar uri={featured.authorPhoto} name={featured.author} size={28} />
              <Text variant="caption" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
                {featured.author} · {featured.petLine}
              </Text>
              <Text variant="micro" tone="muted">
                {featured.ago.toUpperCase()}
              </Text>
            </View>
            <Text variant="bodyStrong" style={{ marginTop: spacing.md }}>
              {featured.title}
            </Text>
            {featured.topAnswer ? (
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
                    VERIFIED VET · {featured.topAnswer.by.toUpperCase()}
                  </Text>
                </View>
                <Text variant="caption" tone="secondary" numberOfLines={3}>
                  {featured.topAnswer.text}
                </Text>
              </View>
            ) : null}
          </GlassCard>
        </Pressable>

        <Text variant="micro" tone="muted" center style={{ marginTop: spacing["2xl"] }}>
          {pet.name} · {ageLabel(pet.dob)} · {pet.breed.toUpperCase()}
        </Text>
      </ScreenScroll>
    </Screen>
  );
}

function TaskRow({ task, onToggle }: { task: CareTask; onToggle: () => void }) {
  const { tk } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onToggle();
      }}
      style={({ pressed }) => [
        glassSurface(tk),
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          padding: spacing.md,
          borderRadius: radius.lg,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 2,
          borderColor: task.done ? tk.success : tk.border,
          backgroundColor: task.done ? tk.success : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {task.done ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          variant="bodyStrong"
          style={{ fontSize: 14, textDecorationLine: task.done ? "line-through" : "none" }}
          tone={task.done ? "muted" : "default"}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {task.detail}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text variant="micro" tone={task.done ? "muted" : "primary"}>
          {task.dueAt.toUpperCase()}
        </Text>
        <Ionicons name={taskIcon[task.kind]} size={14} color={tk.textMuted} />
      </View>
    </Pressable>
  );
}
