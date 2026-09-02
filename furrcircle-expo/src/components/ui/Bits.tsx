import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, View, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { radius, spacing, useTheme } from "../../theme";
import { GlassCard, glassSurface } from "./Glass";
import { Text } from "./Text";
import type { Tone } from "./Badge";

function toneColors(tk: ReturnType<typeof useTheme>["tk"], tone: Tone) {
  return {
    primary: [tk.primary, tk.primarySoft],
    success: [tk.success, tk.successSoft],
    warning: [tk.warning, tk.warningSoft],
    danger: [tk.danger, tk.dangerSoft],
    verified: [tk.verified, tk.verifiedSoft],
    community: [tk.community, tk.communitySoft],
    neutral: [tk.textSecondary, tk.glassChip],
  }[tone] as [string, string];
}

/** Rounded-square icon chip used in quick actions, list rows and timelines. */
export function IconTile({
  icon,
  tone = "primary",
  size = 42,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  size?: number;
  style?: ViewStyle;
}) {
  const { tk } = useTheme();
  const [fg, bg] = toneColors(tk, tone);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.48} color={fg} />
    </View>
  );
}

/** Circular progress used for the day's care completion. */
export function ProgressRing({
  progress,
  size = 60,
  stroke = 6,
  tone = "primary",
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  children?: React.ReactNode;
}) {
  const { tk } = useTheme();
  const [fg] = toneColors(tk, tone);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={tk.separator} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fg}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * clamped} ${c}`}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}

/** Tappable glass row: icon, title, optional subtitle, trailing slot. */
export function ListRow({
  icon,
  tone = "primary",
  title,
  subtitle,
  right,
  onPress,
  chevron = true,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  style?: ViewStyle;
}) {
  const { tk } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={
        onPress
          ? () => {
              Haptics.selectionAsync().catch(() => {});
              onPress();
            }
          : undefined
      }
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
        style,
      ]}
    >
      {icon ? <IconTile icon={icon} tone={tone} /> : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="secondary" numberOfLines={2} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron && onPress && !right ? (
        <Ionicons name="chevron-forward" size={17} color={tk.textMuted} />
      ) : null}
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  tone = "primary",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action?: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <GlassCard style={{ alignItems: "center", paddingVertical: spacing["3xl"], gap: spacing.sm }}>
      <IconTile icon={icon} tone={tone} size={56} />
      <Text variant="subheading" center style={{ marginTop: spacing.xs }}>
        {title}
      </Text>
      <Text variant="caption" tone="secondary" center style={{ maxWidth: 260 }}>
        {body}
      </Text>
      {action ? <View style={{ marginTop: spacing.md }}>{action}</View> : null}
    </GlassCard>
  );
}

/** Row of small labelled numbers, used on profiles and clinic cards. */
export function StatRow({ stats }: { stats: { label: string; value: string }[] }) {
  const { tk } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 ? (
            <View style={{ width: 1, height: 26, backgroundColor: tk.separator, marginHorizontal: spacing.lg }} />
          ) : null}
          <View style={{ alignItems: "center" }}>
            <Text variant="subheading">{s.value}</Text>
            <Text variant="micro" tone="muted" style={{ marginTop: 2 }}>
              {s.label.toUpperCase()}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}
