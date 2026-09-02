import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { pets } from "../../data/mock";
import { useSession } from "../../store/session";
import { spacing, useTheme } from "../../theme";
import { Avatar } from "../ui/Avatar";
import { glassSurface } from "../ui/Glass";
import { Text } from "../ui/Text";

/** Horizontal pet selector for multi-pet households. */
export function PetSwitcher() {
  const { tk } = useTheme();
  const router = useRouter();
  const { activePetId, setActivePet } = useSession();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.xs }}
    >
      {pets.map((p) => {
        const active = p.id === activePetId;
        return (
          <Pressable
            key={p.id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setActivePet(p.id);
            }}
            style={({ pressed }) => [
              glassSurface(tk, active ? "card" : "chip"),
              {
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                paddingLeft: 6,
                paddingRight: spacing.lg,
                paddingVertical: 6,
                borderRadius: 999,
                borderColor: active ? tk.primary : tk.glassBorder,
                borderWidth: active ? 1.5 : StyleSheet.hairlineWidth * 2,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Avatar uri={p.photo} name={p.name} species={p.species} size={36} ring={active ? "brand" : "none"} />
            <View>
              <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                {p.name}
              </Text>
              <Text variant="micro" tone="muted">
                {p.breed.toUpperCase()}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <Pressable
        onPress={() => router.push("/pet/new")}
        style={({ pressed }) => [
          glassSurface(tk, "chip"),
          {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            borderStyle: "dashed",
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={22} color={tk.primary} />
      </Pressable>
    </ScrollView>
  );
}
