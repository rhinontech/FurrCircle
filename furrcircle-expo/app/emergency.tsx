import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import {
  Badge,
  Button,
  GlassCard,
  glassShadow,
  IconTile,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Text,
} from "../src/components/ui";
import { clinics } from "../src/data/mock";
import { palette, radius, spacing, useTheme } from "../src/theme";

const FIRST_AID = [
  { icon: "car", title: "Getting there safely", body: "Support the spine, keep the head slightly lower than the body, and drive — don't run." },
  { icon: "thermometer", title: "Heatstroke", body: "Move to shade, wet the paws and belly with cool (not ice) water, and travel with the AC on." },
  { icon: "bandage", title: "Bleeding", body: "Press firmly with a clean cloth. Do not remove an embedded object." },
  { icon: "warning", title: "Suspected poisoning", body: "Bring the packaging or a photo of it. Never induce vomiting unless a vet tells you to." },
] as const;

export default function Emergency() {
  const { tk } = useTheme();
  const emergency = clinics.filter((c) => c.emergency).sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <Screen>
      <ScreenHeader title="Emergency care" subtitle="Open clinics near Indiranagar" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <View style={[{ borderRadius: radius.xl, overflow: "hidden" }, glassShadow(tk, "lg")]}>
          <LinearGradient
            colors={[palette.coral[400], palette.coral[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: spacing.xl, gap: spacing.sm }}
          >
            <Ionicons name="pulse" size={26} color="#FFFFFF" />
            <Text variant="heading" color="#FFFFFF">
              FurrCircle does not replace emergency treatment
            </Text>
            <Text variant="caption" color="rgba(255,255,255,0.85)">
              If your pet is collapsed, struggling to breathe, bleeding heavily, seizing or bloated, go straight
              to a clinic. Call ahead so the team is ready for you.
            </Text>
          </LinearGradient>
        </View>

        <SectionHeader title={`${emergency.length} clinics open now`} />
        <View style={{ gap: spacing.md }}>
          {emergency.map((c) => (
            <GlassCard key={c.id} shadow="md">
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <IconTile icon="business" tone="danger" size={46} />
                <View style={{ flex: 1 }}>
                  <Text variant="subheading" numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text variant="caption" tone="secondary" numberOfLines={1}>
                    {c.address} · {c.distanceKm} km
                  </Text>
                  <Text variant="micro" tone="muted" style={{ marginTop: 3 }}>
                    {c.hours.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 5, marginTop: spacing.md, flexWrap: "wrap" }}>
                {c.facilities.map((f) => (
                  <Badge key={f} label={f} tone="neutral" />
                ))}
              </View>

              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
                <Button label="Call clinic" variant="danger" icon="call" style={{ flex: 1 }} onPress={() => Linking.openURL("tel:+918000000000")} />
                <Button label="Directions" variant="glass" icon="navigate" onPress={() => {}} />
              </View>
            </GlassCard>
          ))}
        </View>

        <SectionHeader title="While you travel" />
        <GlassCard padded={false} style={{ paddingVertical: spacing.xs }}>
          {FIRST_AID.map((f, i) => (
            <View key={f.title}>
              <View style={{ flexDirection: "row", gap: spacing.md, padding: spacing.md }}>
                <IconTile icon={f.icon} tone="warning" size={38} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                    {f.title}
                  </Text>
                  <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
                    {f.body}
                  </Text>
                </View>
              </View>
              {i < FIRST_AID.length - 1 ? (
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: 66 }} />
              ) : null}
            </View>
          ))}
        </GlassCard>

        <Text variant="caption" tone="muted" center style={{ marginTop: spacing.xl }}>
          General guidance only. It is not a diagnosis and does not replace examination by a veterinarian.
        </Text>
      </ScreenScroll>
    </Screen>
  );
}
