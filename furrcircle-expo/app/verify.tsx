import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  Badge,
  Button,
  GlassCard,
  IconTile,
  ListRow,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Segmented,
  Text,
} from "../src/components/ui";
import { useSession } from "../src/store/session";
import { spacing, useTheme } from "../src/theme";

const STATES = ["Draft", "Documents submitted", "Under review", "Verified"] as const;

const DOCS = [
  { icon: "id-card", label: "Government photo ID", done: true },
  { icon: "ribbon", label: "Veterinary degree certificate", done: true },
  { icon: "document-lock", label: "Council registration / licence", done: false },
  { icon: "business", label: "Clinic registration (if applicable)", done: false },
];

export default function Verify() {
  const { tk } = useTheme();
  const router = useRouter();
  const { roles, signIn, setWorkspace } = useSession();
  const [kind, setKind] = useState<"individual" | "clinic" | "both">("individual");
  const stage = 1;

  return (
    <Screen>
      <ScreenHeader title="Professional verification" subtitle="Required before you can consult" back size="compact" />
      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }} underTabBar={false}>
        <GlassCard shadow="md">
          <Text variant="micro" tone="muted">
            STATUS
          </Text>
          <View style={{ marginTop: spacing.md }}>
            {STATES.map((s, i) => {
              const reached = i <= stage;
              return (
                <View key={s} style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ alignItems: "center", width: 20 }}>
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: reached ? tk.verified : tk.border,
                        backgroundColor: reached ? tk.verified : "transparent",
                      }}
                    />
                    {i < STATES.length - 1 ? (
                      <View style={{ flex: 1, width: 2, backgroundColor: i < stage ? tk.verified : tk.separator, marginVertical: 2 }} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: i < STATES.length - 1 ? spacing.md : 0 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14 }} tone={reached ? "default" : "muted"}>
                      {s}
                    </Text>
                    {i === stage ? (
                      <Text variant="caption" tone="verified" style={{ marginTop: 2 }}>
                        Current · reviews usually complete within 2 working days
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>

        <SectionHeader title="This account represents" />
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: "individual", label: "A vet" },
            { value: "clinic", label: "A clinic" },
            { value: "both", label: "Both" },
          ]}
        />

        <SectionHeader title="Documents" />
        <View style={{ gap: spacing.sm }}>
          {DOCS.map((d) => (
            <ListRow
              key={d.label}
              icon={d.icon as never}
              tone={d.done ? "success" : "neutral"}
              title={d.label}
              subtitle={d.done ? "Uploaded" : "Tap to upload a photo or PDF"}
              right={d.done ? <Ionicons name="checkmark-circle" size={20} color={tk.success} /> : undefined}
              onPress={() => {}}
            />
          ))}
        </View>

        <SectionHeader title="While you're unverified" />
        <GlassCard>
          {[
            { ok: true, text: "Complete your professional and clinic profile" },
            { ok: true, text: "Set availability and explore the app" },
            { ok: false, text: "Offer paid consultations" },
            { ok: false, text: "Present yourself as FurrCircle verified" },
            { ok: false, text: "Access patient records" },
          ].map((r) => (
            <View key={r.text} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
              <Ionicons name={r.ok ? "checkmark-circle" : "close-circle"} size={16} color={r.ok ? tk.success : tk.textMuted} />
              <Text variant="caption" tone={r.ok ? "secondary" : "muted"} style={{ flex: 1 }}>
                {r.text}
              </Text>
            </View>
          ))}
        </GlassCard>

        <Button
          label="Open the vet workspace (demo)"
          full
          size="lg"
          style={{ marginTop: spacing.xl }}
          onPress={() => {
            signIn([...roles, "vet"]);
            setWorkspace("vet");
            router.replace("/(vet)/today");
          }}
        />
      </ScreenScroll>
    </Screen>
  );
}
