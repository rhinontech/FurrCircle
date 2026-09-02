import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  glassSurface,
  IconTile,
  ListRow,
  Screen,
  ScreenScroll,
  SectionHeader,
  Segmented,
  StatRow,
  Text,
} from "../../src/components/ui";
import { ageLabel, owner, pets, records } from "../../src/data/mock";
import { useSession } from "../../src/store/session";
import { radius, spacing, useTheme } from "../../src/theme";

export default function Profile() {
  const { tk, preference, setPreference } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { roles, workspace, setWorkspace, signOut } = useSession();

  const canSwitch = roles.length > 1;

  return (
    <Screen>
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text variant="title" style={{ flex: 1 }}>
            Profile
          </Text>
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={8}
            style={[
              glassSurface(tk, "chip"),
              { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Ionicons name="settings-outline" size={19} color={tk.text} />
          </Pressable>
        </View>

        {/* Identity ------------------------------------------------------- */}
        <GlassCard shadow="lg" style={{ marginTop: spacing.lg, padding: spacing.xl, alignItems: "center" }}>
          <Avatar uri={owner.photo} name={owner.name} size={88} ring="brand" />
          <Text variant="heading" style={{ marginTop: spacing.md }}>
            {owner.name}
          </Text>
          <Text variant="caption" tone="secondary">
            {owner.handle} · {owner.city}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.sm, flexWrap: "wrap", justifyContent: "center" }}>
            {owner.interests.map((i) => (
              <Badge key={i} label={i} tone="primary" />
            ))}
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <StatRow
              stats={[
                { label: "Pets", value: String(pets.length) },
                { label: "Records", value: String(records.length) },
                { label: "Member", value: owner.memberSince.split(" ")[0] },
              ]}
            />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label="Edit profile" variant="glass" size="sm" icon="create-outline" onPress={() => router.push("/settings")} />
            <Button label="Share" variant="ghost" size="sm" icon="share-outline" onPress={() => {}} />
          </View>
        </GlassCard>

        {/* Workspace ------------------------------------------------------ */}
        <SectionHeader title="Workspace" />
        {canSwitch ? (
          <Segmented
            value={workspace}
            onChange={(w) => {
              setWorkspace(w);
              router.replace(w === "owner" ? "/(owner)/today" : "/(vet)/today");
            }}
            options={[
              { value: "owner", label: "Pet owner" },
              { value: "vet", label: "Vet / clinic" },
            ]}
          />
        ) : (
          <ListRow
            icon="briefcase"
            tone="verified"
            title="Add a professional workspace"
            subtitle="Already a vet or run a clinic? Verify once and switch without a second login."
            onPress={() => router.push("/verify")}
          />
        )}

        {/* Pets ----------------------------------------------------------- */}
        <SectionHeader title="My pets" action="Add pet" onAction={() => router.push("/pet/new")} />
        <View style={{ gap: spacing.sm }}>
          {pets.map((p) => (
            <Pressable key={p.id} onPress={() => router.push(`/pet/${p.id}`)}>
              <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }} shadow="sm">
                <Avatar uri={p.photo} name={p.name} species={p.species} size={52} ring="brand" />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 15 }}>
                    {p.name}
                  </Text>
                  <Text variant="caption" tone="secondary">
                    {p.breed} · {ageLabel(p.dob)} · {p.weightKg} kg
                  </Text>
                  <View style={{ flexDirection: "row", gap: 5, marginTop: 6 }}>
                    <Badge label="Private records" tone="verified" icon="lock-closed" />
                    <Badge label="Public profile on" tone="neutral" icon="globe-outline" />
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={17} color={tk.textMuted} />
              </GlassCard>
            </Pressable>
          ))}
        </View>

        {/* Appearance ----------------------------------------------------- */}
        <SectionHeader title="Appearance" />
        <GlassCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md }}>
            <IconTile icon="color-palette" tone="community" size={38} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                Theme
              </Text>
              <Text variant="caption" tone="secondary">
                Glass surfaces adapt to light and dark.
              </Text>
            </View>
          </View>
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

        {/* Privacy & settings --------------------------------------------- */}
        <SectionHeader title="Privacy and data" />
        <View style={{ gap: spacing.sm }}>
          <ListRow
            icon="shield-checkmark"
            tone="verified"
            title="Record sharing"
            subtitle="2 clinics have access to selected records"
            onPress={() => router.push("/settings/sharing")}
          />
          <ListRow
            icon="notifications"
            tone="primary"
            title="Notifications"
            subtitle="Care and appointments on · social muted"
            onPress={() => router.push("/settings/notifications")}
          />
          <ListRow
            icon="download"
            tone="neutral"
            title="Download my data"
            subtitle="Export records, timeline and account information"
            onPress={() => {}}
          />
          <ListRow icon="help-circle" tone="neutral" title="Help and safety" subtitle="Report, block, community rules" onPress={() => {}} />
        </View>

        <Pressable
          onPress={() =>
            Alert.alert("Sign out", "You'll need to sign in again to reach your pet's records.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign out",
                style: "destructive",
                onPress: () => {
                  signOut();
                  router.replace("/(auth)/welcome");
                },
              },
            ])
          }
          style={({ pressed }) => [
            glassSurface(tk),
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              marginTop: spacing.xl,
              padding: spacing.lg,
              borderRadius: radius.lg,
              borderColor: tk.danger + "33",
              borderWidth: StyleSheet.hairlineWidth * 2,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={17} color={tk.danger} />
          <Text variant="bodyStrong" tone="danger">
            Sign out
          </Text>
        </Pressable>

        <Text variant="micro" tone="muted" center style={{ marginTop: spacing.lg }}>
          FURRCIRCLE 1.0.0 · {owner.city.toUpperCase()}
        </Text>
      </ScreenScroll>
    </Screen>
  );
}
