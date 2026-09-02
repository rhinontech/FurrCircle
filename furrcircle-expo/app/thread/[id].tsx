import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Badge,
  GlassBlur,
  glassSurface,
  Screen,
  ScreenHeader,
  Text,
  VerifiedMark,
} from "../../src/components/ui";
import { clinicById, petById, threads, vetById } from "../../src/data/mock";
import { radius, spacing, useTheme } from "../../src/theme";

type Msg = { id: string; from: "me" | "them"; text: string; at: string; attachment?: string };

const SEED: Msg[] = [
  { id: "1", from: "me", text: "Hi doctor, sending the photos from this morning as promised.", at: "9:12 AM" },
  { id: "2", from: "me", text: "", at: "9:12 AM", attachment: "2 photos · left flank" },
  { id: "3", from: "them", text: "Thank you. The redness looks much better than at the consult.", at: "11:40 AM" },
  { id: "4", from: "them", text: "Continue the current dose and keep the weekly bath. Send an update on Friday.", at: "11:41 AM" },
];

export default function Thread() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scroller = useRef<ScrollView>(null);

  const thread = threads.find((t) => t.id === id) ?? threads[0];
  const vet = vetById(thread.vetId)!;
  const pet = petById(thread.petId)!;
  const clinic = clinicById(thread.clinicId)!;

  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [draft, setDraft] = useState("");

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: String(Date.now()), from: "me", text, at: "Now" }]);
    setDraft("");
    requestAnimationFrame(() => scroller.current?.scrollToEnd({ animated: true }));
  };

  return (
    <Screen>
      <ScreenHeader
        title={vet.name}
        subtitle={`${clinic.name} · about ${pet.name}`}
        back
        size="compact"
        right={<Avatar uri={vet.photo} name={vet.name} size={38} ring={vet.verified ? "verified" : "none"} />}
      />

      {/* On Android the list and the composer must share one KeyboardAvoidingView,
          otherwise the messages stay put while the input rises. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scroller}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
        >
          <View style={{ alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
            <Badge
              label={thread.resolved ? "Thread resolved" : `Follow-up window · ${thread.windowClosesIn} left`}
              tone={thread.resolved ? "neutral" : "primary"}
              icon={thread.resolved ? "checkmark-done" : "time"}
            />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <VerifiedMark size={12} />
              <Text variant="micro" tone="muted">
                MESSAGES ARE TIED TO YOUR APPOINTMENT · NO PHONE NUMBERS SHARED
              </Text>
            </View>
          </View>

          {messages.map((m) => {
            const me = m.from === "me";
            return (
              <View key={m.id} style={{ alignItems: me ? "flex-end" : "flex-start" }}>
                <View
                  style={[
                    !me && glassSurface(tk),
                    {
                      maxWidth: "84%",
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm + 2,
                      borderRadius: radius.lg,
                      borderBottomRightRadius: me ? 6 : radius.lg,
                      borderBottomLeftRadius: me ? radius.lg : 6,
                      backgroundColor: me ? tk.primary : undefined,
                    },
                  ]}
                >
                  {m.attachment ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <Ionicons name="images" size={16} color={me ? "#FFFFFF" : tk.verified} />
                      <Text variant="caption" color={me ? "#FFFFFF" : tk.text}>
                        {m.attachment}
                      </Text>
                    </View>
                  ) : (
                    <Text variant="body" color={me ? "#FFFFFF" : tk.text}>
                      {m.text}
                    </Text>
                  )}
                </View>
                <Text variant="micro" tone="muted" style={{ marginTop: 4, marginHorizontal: 6 }}>
                  {m.at.toUpperCase()}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Composer -------------------------------------------------------- */}
        <GlassBlur
          intensity={40}
          style={{
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: tk.glassBorder,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            // edgeToEdgeEnabled on Android means the gesture bar overlaps
            // anything not padded by the bottom inset explicitly.
            paddingBottom: Math.max(insets.bottom, spacing.md),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm }}>
            <Pressable hitSlop={8} style={{ padding: 10 }}>
              <Ionicons name="add-circle-outline" size={24} color={tk.primary} />
            </Pressable>
            <View
              style={[
                glassSurface(tk, "chip"),
                {
                  flex: 1,
                  borderRadius: radius.xl,
                  paddingHorizontal: spacing.md,
                  paddingVertical: Platform.OS === "ios" ? 10 : 4,
                  maxHeight: 110,
                },
              ]}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                multiline
                placeholder="Send an update or a question…"
                placeholderTextColor={tk.textMuted}
                style={{ color: tk.text, fontSize: 15, fontWeight: "500" }}
              />
            </View>
            <Pressable
              onPress={send}
              disabled={!draft.trim()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: draft.trim() ? tk.primary : tk.glassChip,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-up" size={19} color={draft.trim() ? tk.onPrimary : tk.textMuted} />
            </Pressable>
          </View>
        </GlassBlur>
      </KeyboardAvoidingView>
    </Screen>
  );
}
