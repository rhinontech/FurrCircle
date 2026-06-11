/**
 * Soft ambient gradient + colour blobs that sit behind every screen so the
 * glass surfaces above have something to shine through. Static (no animation),
 * pointerEvents none — effectively free at runtime.
 */
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { useThemeStore } from "../../lib/theme-store";

export function AmbientBackground() {
  const dark = useThemeStore((s) => s.dark);
  const { width, height } = useWindowDimensions();
  const blobOpacity = dark ? 0.22 : 0.18;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={
          dark
            ? (["#15152E", "#0F0F1A", "#171026"] as const)
            : (["#E7F1FF", "#EFF6FF", "#FBEFF5"] as const)
        }
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="ambientCoral" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF6B6B" stopOpacity={blobOpacity} />
            <Stop offset="100%" stopColor="#FF6B6B" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="ambientBlue" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#2563EB" stopOpacity={blobOpacity} />
            <Stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="ambientSun" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFD93D" stopOpacity={blobOpacity * 0.9} />
            <Stop offset="100%" stopColor="#FFD93D" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="ambientPink" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF6FCF" stopOpacity={blobOpacity * 0.8} />
            <Stop offset="100%" stopColor="#FF6FCF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={width * 0.88} cy={height * 0.06} r={width * 0.55} fill="url(#ambientCoral)" />
        <Circle cx={width * 0.02} cy={height * 0.3} r={width * 0.6} fill="url(#ambientBlue)" />
        <Circle cx={width * 0.85} cy={height * 0.55} r={width * 0.5} fill="url(#ambientPink)" />
        <Circle cx={width * 0.15} cy={height * 0.92} r={width * 0.6} fill="url(#ambientSun)" />
      </Svg>
    </View>
  );
}
