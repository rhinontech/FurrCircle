import React from "react";
import { Text as RNText, TextProps as RNTextProps } from "react-native";

import { type as typeScale, useTheme } from "../../theme";

type Variant = keyof typeof typeScale;
type Tone = "default" | "secondary" | "muted" | "inverse" | "primary" | "success" | "warning" | "danger" | "verified" | "community";

export type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
  /** Convenience override without reaching for a style object. */
  color?: string;
  center?: boolean;
};

export function Text({ variant = "body", tone = "default", color, center, style, ...rest }: TextProps) {
  const { tk } = useTheme();
  const toneColor = {
    default: tk.text,
    secondary: tk.textSecondary,
    muted: tk.textMuted,
    inverse: tk.textInverse,
    primary: tk.primary,
    success: tk.success,
    warning: tk.warning,
    danger: tk.danger,
    verified: tk.verified,
    community: tk.community,
  }[tone];

  return (
    <RNText
      {...rest}
      style={[typeScale[variant], { color: color ?? toneColor }, center && { textAlign: "center" }, style]}
    />
  );
}
