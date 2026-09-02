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
  VerifiedMark,
} from "../../src/components/ui";
import { clinics, vetSelf } from "../../src/data/mock";
import { useSession } from "../../src/store/session";
import { radius, spacing, useTheme } from "../../src/theme";

export default function VetProfile() {
  const { tk, preference, setPreference } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { roles, workspace, setWorkspace, signOut } = useSession();

  const clinic = clinics.find((c) => c.id === vetSelf.clinicId)!;
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

        <GlassCard shadow="lg" style={{ marginTop: spacing.lg, padding: spacing.xl, alignItems: "center" }}>
          <Avatar uri={vetSelf.photo} name={vetSelf.name} size={88} ring="verified" />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md }}>
            <Text variant="heading">{vetSelf.name}</Text>
            <VerifiedMark size={17} />
          </View>
          <Text variant="caption" tone="secondary">
            {vetSelf.speciality} · {clinic.name}
          </Text>
          <Badge label="FurrCircle verified" tone="verified" icon="shield-checkmark" style={{ marginTop: spacing.sm }} />

          <View style={{ marginTop: spacing.lg }}>
            <StatRow
              stats={[
                { label: "Rating", value: String(vetSelf.rating) },
                { label: "Reviews", value: String(vetSelf.reviews) },
                { label: "Answers", value: "148" },
              ]}
            />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label="Edit profile" variant="glass" size="sm" icon="create-outline" onPress={() => {}} />
            <Button label="Preview" variant="ghost" size="sm" icon="eye-outline" onPress={() => router.push("/clinician/v_1")} />
          </View>
        </GlassCard>

        {/* Verification --------------------------------------------------- */}
        <SectionHeader title="Verification" />
        <GlassCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <IconTile icon="shield-checkmark" tone="verified" size={42} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                Verified
              </Text>
              <Text variant="caption" tone="secondary">
                Licence {vetSelf.license} · re-verification due Mar 2027
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: tk.separator,
            }}
          >
            <Ionicons name="checkmark-circle" size={14} color={tk.success} />
            <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
              Paid consultations, patient records and the verified badge are enabled.
            </Text>
          </View>
        </GlassCard>

        {/* Clinic --------------------------------------------------------- */}
        <SectionHeader title="Clinic" action="Manage" onAction={() => {}} />
        <View style={{ gap: spacing.sm }}>
          <ListRow icon="business" tone="primary" title={clinic.name} subtitle={`${clinic.address} · ${clinic.hours}`} onPress={() => {}} />
          <ListRow icon="people" tone="verified" title="Team and permissions" subtitle="3 vets · 2 front desk · role-based record access" onPress={() => {}} />
          <ListRow icon="cash" tone="success" title="Consultation types and fees" subtitle="In-clinic ₹800 · video ₹600 · voice ₹400" onPress={() => {}} />
          <ListRow icon="pulse" tone="danger" title="Emergency availability" subtitle="On · listed in Emergency care nearby" onPress={() => {}} />
        </View>

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
            icon="paw"
            tone="primary"
            title="Add your own pets"
            subtitle="Keep your personal pet care separate from the practice."
            onPress={() => router.push("/pet/new")}
          />
        )}

        {/* Appearance ------------------------------------------------------ */}
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

        <Pressable
          onPress={() =>
            Alert.alert("Sign out", "You'll be signed out of this clinic workspace.", [
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
      </ScreenScroll>
    </Screen>
  );
}
