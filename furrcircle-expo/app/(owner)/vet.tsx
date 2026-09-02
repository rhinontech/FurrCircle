import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  GlassChip,
  glassShadow,
  glassSurface,
  IconTile,
  Screen,
  ScreenScroll,
  SectionHeader,
  Segmented,
  Text,
  VerifiedMark,
} from "../../src/components/ui";
import { appointments, clinicById, clinics, petById, threads, vetById, vets } from "../../src/data/mock";
import type { AppointmentStatus, ConsultType } from "../../src/data/types";
import { palette, radius, spacing, useTheme } from "../../src/theme";

type Tab = "find" | "appointments" | "messages";

const consultIcon: Record<ConsultType, React.ComponentProps<typeof Ionicons>["name"]> = {
  "in-clinic": "business",
  voice: "call",
  video: "videocam",
};

const statusTone: Record<AppointmentStatus, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  requested: "warning",
  accepted: "primary",
  scheduled: "primary",
  ready: "success",
  "in-consultation": "success",
  completed: "neutral",
  declined: "danger",
  "reschedule-proposed": "warning",
  cancelled: "danger",
  "no-show": "danger",
};

const FILTERS = ["Open now", "Video", "Verified", "Dogs", "Cats", "< 5 km"];

export default function VetTab() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("find");

  const upcoming = appointments.filter((a) => a.status !== "completed");
  const unread = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <Screen>
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + spacing.sm }}>
        <Text variant="title">Vet</Text>

        {/* Emergency access stays visible on every vet surface (§7.2). */}
        <Pressable onPress={() => router.push("/emergency")} style={{ marginTop: spacing.lg }}>
          <View style={[{ borderRadius: radius.lg, overflow: "hidden" }, glassShadow(tk, "md")]}>
            <LinearGradient
              colors={[palette.coral[400], palette.coral[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="pulse" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" color="#FFFFFF" style={{ fontSize: 14 }}>
                  Emergency care nearby
                </Text>
                <Text variant="caption" color="rgba(255,255,255,0.85)">
                  3 clinics open now · closest 1.4 km
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </Pressable>

        <Segmented
          style={{ marginTop: spacing.lg }}
          value={tab}
          onChange={setTab}
          options={[
            { value: "find", label: "Find" },
            { value: "appointments", label: "Appointments", count: upcoming.length },
            { value: "messages", label: "Messages", count: unread || undefined },
          ]}
        />

        {tab === "find" ? <FindTab /> : null}
        {tab === "appointments" ? <AppointmentsTab /> : null}
        {tab === "messages" ? <MessagesTab /> : null}
      </ScreenScroll>
    </Screen>
  );
}

/* --------------------------------------------------------------------- find */

function FindTab() {
  const { tk } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string[]>(["Verified"]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vets.filter((v) => {
      if (active.includes("Open now") && !v.availableNow) return false;
      if (active.includes("Video") && !v.consultTypes.includes("video")) return false;
      if (active.includes("Verified") && !v.verified) return false;
      if (active.includes("Dogs") && !v.species.includes("dog")) return false;
      if (active.includes("Cats") && !v.species.includes("cat")) return false;
      if (active.includes("< 5 km") && v.distanceKm >= 5) return false;
      if (!q) return true;
      const clinic = clinicById(v.clinicId);
      return (
        v.name.toLowerCase().includes(q) ||
        v.speciality.toLowerCase().includes(q) ||
        (clinic?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query, active]);

  const toggle = (f: string) =>
    setActive((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  return (
    <>
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
          placeholder="Vet, clinic, speciality or area"
          placeholderTextColor={tk.textMuted}
          style={{ flex: 1, color: tk.text, fontSize: 15, fontWeight: "500" }}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={tk.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}
      >
        {FILTERS.map((f) => (
          <Pressable key={f} onPress={() => toggle(f)}>
            <GlassChip active={active.includes(f)}>
              <Text
                variant="caption"
                color={active.includes(f) ? tk.onPrimary : tk.textSecondary}
                style={{ fontWeight: "700" }}
              >
                {f}
              </Text>
            </GlassChip>
          </Pressable>
        ))}
      </ScrollView>

      {/* Instant consult is a controlled queue, not a call to every vet (§4.5) */}
      <Pressable onPress={() => router.push("/instant")}>
        <GlassCard shadow="md" style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <IconTile icon="flash" tone="warning" size={44} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ fontSize: 14 }}>
              Talk to an available vet
            </Text>
            <Text variant="caption" tone="secondary">
              2 vets available now · typically answered in under 5 min
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={tk.textMuted} />
        </GlassCard>
      </Pressable>

      <SectionHeader title={`${results.length} vets near you`} action="Map" onAction={() => {}} />
      <View style={{ gap: spacing.md }}>
        {results.map((v) => {
          const clinic = clinicById(v.clinicId)!;
          return (
            <Pressable key={v.id} onPress={() => router.push(`/clinician/${v.id}`)}>
              <GlassCard>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <Avatar uri={v.photo} name={v.name} size={54} ring={v.verified ? "verified" : "none"} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Text variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {v.name}
                      </Text>
                      {v.verified ? <VerifiedMark size={14} /> : null}
                    </View>
                    <Text variant="caption" tone="secondary" numberOfLines={1}>
                      {v.speciality} · {v.yearsExperience} yrs
                    </Text>
                    <Text variant="micro" tone="muted" numberOfLines={1} style={{ marginTop: 3 }}>
                      {clinic.name.toUpperCase()} · {v.distanceKm} KM
                    </Text>
                  </View>
                  {v.availableNow ? <Badge label="Available" tone="success" icon="ellipse" /> : null}
                </View>

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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="star" size={13} color={tk.warning} />
                    <Text variant="caption" style={{ fontWeight: "700" }}>
                      {v.rating}
                    </Text>
                    <Text variant="caption" tone="muted">
                      ({v.reviews})
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {v.consultTypes.map((t) => (
                      <Ionicons key={t} name={consultIcon[t]} size={14} color={tk.textMuted} />
                    ))}
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text variant="caption" tone="secondary">
                    from ₹{v.feeFrom}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="micro" tone="muted">
                      NEXT SLOT
                    </Text>
                    <Text variant="caption" tone="primary" style={{ fontWeight: "700" }}>
                      {v.nextSlot}
                    </Text>
                  </View>
                  <Button label="Book" size="sm" onPress={() => router.push(`/book/${v.id}`)} />
                </View>
              </GlassCard>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Clinics nearby" />
      <View style={{ gap: spacing.sm }}>
        {clinics.map((c) => (
          <Pressable key={c.id}>
            <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }} shadow="sm">
              <IconTile icon={c.emergency ? "pulse" : "business"} tone={c.emergency ? "danger" : "primary"} size={40} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  {c.address} · {c.distanceKm} km
                </Text>
                <Text variant="micro" tone="muted" style={{ marginTop: 2 }}>
                  {c.hours.toUpperCase()}
                </Text>
              </View>
              <Ionicons name="navigate-circle-outline" size={22} color={tk.primary} />
            </GlassCard>
          </Pressable>
        ))}
      </View>
    </>
  );
}

/* ------------------------------------------------------------- appointments */

function AppointmentsTab() {
  const { tk } = useTheme();
  const router = useRouter();
  const upcoming = appointments.filter((a) => a.status !== "completed");
  const past = appointments.filter((a) => a.status === "completed");

  const card = (id: string) => {
    const a = appointments.find((x) => x.id === id)!;
    const v = vetById(a.vetId)!;
    const pet = petById(a.petId)!;
    return (
      <Pressable key={a.id} onPress={() => router.push(`/appointment/${a.id}`)}>
        <GlassCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Avatar uri={v.photo} name={v.name} size={44} ring={v.verified ? "verified" : "none"} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
                {v.name}
              </Text>
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {a.reason} · {pet.name}
              </Text>
            </View>
            <Badge
              label={a.status === "ready" ? "Ready to join" : a.status.replace("-", " ")}
              tone={statusTone[a.status]}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: tk.separator,
            }}
          >
            <Ionicons name={consultIcon[a.type]} size={15} color={tk.textMuted} />
            <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
              {a.startsAt} · {a.durationMin} min
            </Text>
            <Text variant="caption" style={{ fontWeight: "700" }}>
              ₹{a.fee}
            </Text>
          </View>

          {a.status === "ready" ? (
            <Button
              label="Join consultation"
              icon={consultIcon[a.type]}
              full
              style={{ marginTop: spacing.md }}
              onPress={() => router.push(`/consult/${a.id}`)}
            />
          ) : null}
        </GlassCard>
      </Pressable>
    );
  };

  return (
    <>
      <SectionHeader title="Upcoming" />
      <View style={{ gap: spacing.md }}>{upcoming.map((a) => card(a.id))}</View>
      <SectionHeader title="Past" />
      <View style={{ gap: spacing.md }}>{past.map((a) => card(a.id))}</View>
    </>
  );
}

/* ----------------------------------------------------------------- messages */

function MessagesTab() {
  const { tk } = useTheme();
  const router = useRouter();

  return (
    <>
      <SectionHeader title="Clinic threads" />
      <View style={{ gap: spacing.md }}>
        {threads.map((t) => {
          const v = vetById(t.vetId)!;
          const pet = petById(t.petId)!;
          const clinic = clinicById(t.clinicId)!;
          return (
            <Pressable key={t.id} onPress={() => router.push(`/thread/${t.id}`)}>
              <GlassCard>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <Avatar uri={v.photo} name={v.name} size={44} ring={v.verified ? "verified" : "none"} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14, flex: 1 }} numberOfLines={1}>
                        {v.name}
                      </Text>
                      <Text variant="micro" tone="muted">
                        {t.ago.toUpperCase()}
                      </Text>
                    </View>
                    <Text variant="micro" tone="muted" style={{ marginTop: 2 }}>
                      {clinic.name.toUpperCase()} · {pet.name.toUpperCase()}
                    </Text>
                    <Text variant="caption" tone="secondary" style={{ marginTop: 6 }} numberOfLines={2}>
                      {t.lastMessage}
                    </Text>
                  </View>
                  {t.unread ? (
                    <View
                      style={{
                        minWidth: 20,
                        height: 20,
                        borderRadius: 10,
                        paddingHorizontal: 6,
                        backgroundColor: tk.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text variant="micro" color={tk.onPrimary}>
                        {t.unread}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.md }}>
                  {t.resolved ? (
                    <Badge label="Resolved" tone="neutral" icon="checkmark-done" />
                  ) : t.windowClosesIn ? (
                    <Badge label={`Follow-up window · ${t.windowClosesIn} left`} tone="primary" icon="time" />
                  ) : null}
                </View>
              </GlassCard>
            </Pressable>
          );
        })}
      </View>

      <GlassCard style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm }} shadow="sm">
        <Ionicons name="alert-circle" size={16} color={tk.warning} style={{ marginTop: 1 }} />
        <Text variant="caption" tone="muted" style={{ flex: 1 }}>
          Messages are tied to an appointment and are not monitored around the clock. For anything urgent, use
          Emergency care nearby instead of waiting for a reply.
        </Text>
      </GlassCard>
    </>
  );
}
