import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import {
  Avatar,
  Badge,
  GlassCard,
  ListRow,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Segmented,
  Text,
} from "../../src/components/ui";
import { owner } from "../../src/data/mock";
import { spacing, useTheme } from "../../src/theme";

export default function Settings() {
  const { tk, preference, setPreference } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader title="Settings" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }} shadow="md">
          <Avatar uri={owner.photo} name={owner.name} size={54} ring="brand" />
          <View style={{ flex: 1 }}>
            <Text variant="subheading">{owner.name}</Text>
            <Text variant="caption" tone="secondary">
              {owner.handle} · {owner.city}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={tk.textMuted} />
        </GlassCard>

        <SectionHeader title="Account" />
        <View style={{ gap: spacing.sm }}>
          <ListRow icon="person" tone="primary" title="Personal details" subtitle="Name, photo, city, phone" onPress={() => {}} />
          <ListRow icon="call" tone="danger" title="Emergency contact" subtitle={owner.emergencyContact} onPress={() => {}} />
          <ListRow icon="key" tone="neutral" title="Password and sign-in" subtitle="Change password, connected accounts" onPress={() => {}} />
          <ListRow icon="location" tone="verified" title="Location" subtitle="Used for nearby vets and lost-pet alerts" onPress={() => {}} />
        </View>

        <SectionHeader title="Privacy" />
        <View style={{ gap: spacing.sm }}>
          <ListRow icon="shield-checkmark" tone="verified" title="Record sharing and consent" subtitle="Who can open your pets' records" onPress={() => router.push("/settings/sharing")} />
          <ListRow icon="notifications" tone="primary" title="Notifications" subtitle="Care, appointments and community, separately" onPress={() => router.push("/settings/notifications")} />
          <ListRow icon="eye-off" tone="community" title="Public profile visibility" subtitle="What other pet parents can see" onPress={() => {}} />
          <ListRow icon="ban" tone="neutral" title="Blocked accounts" subtitle="2 blocked" onPress={() => {}} />
        </View>

        <SectionHeader title="Appearance" />
        <GlassCard>
          <Segmented
            value={preference}
            onChange={setPreference}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </GlassCard>

        <SectionHeader title="Data" />
        <View style={{ gap: spacing.sm }}>
          <ListRow icon="download" tone="neutral" title="Download my data" subtitle="Records, timeline and account information" onPress={() => {}} />
          <ListRow icon="trash" tone="danger" title="Delete account" subtitle="Some medical records may be retained by law" onPress={() => {}} />
        </View>

        <SectionHeader title="About" />
        <View style={{ gap: spacing.sm }}>
          <ListRow icon="document-text" tone="neutral" title="Terms of service" onPress={() => {}} />
          <ListRow icon="lock-closed" tone="neutral" title="Privacy policy" onPress={() => {}} />
          <ListRow icon="people" tone="neutral" title="Community rules" onPress={() => {}} />
          <ListRow icon="help-circle" tone="neutral" title="Help and support" onPress={() => {}} />
        </View>

        <Text variant="micro" tone="muted" center style={{ marginTop: spacing.xl }}>
          FURRCIRCLE 1.0.0 (BUILD 1)
        </Text>
      </ScreenScroll>
    </Screen>
  );
}
