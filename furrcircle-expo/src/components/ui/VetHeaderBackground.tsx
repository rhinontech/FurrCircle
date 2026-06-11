import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Path, G, Circle } from "react-native-svg";
import { useThemeStore } from "../../lib/theme-store";

// Sub-component: Medical Cross with rounded corners
const MedicalCross = ({ x, y, size = 24, opacity = 0.1, color = "#2563EB" }: { x: number; y: number; size?: number; opacity?: number; color?: string }) => {
  const scale = size / 24;
  return (
    <Path
      d="M 9,2 C 9,1 10,0 11,0 H 13 C 14,0 15,1 15,2 V 9 H 22 C 23,9 24,10 24,11 V 13 C 24,14 23,15 22,15 H 15 V 22 C 15,23 14,24 13,24 H 11 C 10,24 9,23 9,22 V 15 H 2 C 1,15 0,14 0,13 V 11 C 0,10 1,9 2,9 H 9 Z"
      fill={color}
      transform={`translate(${x}, ${y}) scale(${scale})`}
      opacity={opacity}
    />
  );
};

// Sub-component: Heartbeat EKG Pulse Line
const Heartbeat = ({ x, y, width = 80, height = 30, opacity = 0.15, color = "#2563EB" }: { x: number; y: number; width?: number; height?: number; opacity?: number; color?: string }) => {
  return (
    <Path
      d={`M ${x},${y + height/2} L ${x + width * 0.25},${y + height/2} L ${x + width * 0.35},${y} L ${x + width * 0.45},${y + height} L ${x + width * 0.52},${y + height * 0.3} L ${x + width * 0.58},${y + height * 0.6} L ${x + width * 0.65},${y + height/2} L ${x + width},${y + height/2}`}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={opacity}
    />
  );
};

// Sub-component: Paw Print (large pad + 4 toes)
const PawPrint = ({ x, y, size = 40, opacity = 0.1, color = "#2563EB" }: { x: number; y: number; size?: number; opacity?: number; color?: string }) => {
  const scale = size / 60;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
      <Path
        d="M 20,42 C 15,36 12,38 12,46 C 12,54 22,58 30,58 C 38,58 48,54 48,46 C 48,38 45,36 40,42 C 37,45 33,46 30,46 C 27,46 23,45 20,42 Z"
        fill={color}
      />
      <Circle cx="12" cy="24" r="6" fill={color} />
      <Circle cx="23" cy="13" r="6.5" fill={color} />
      <Circle cx="37" cy="13" r="6.5" fill={color} />
      <Circle cx="48" cy="24" r="6" fill={color} />
    </G>
  );
};

export function VetHeaderBackground() {
  const { width } = useWindowDimensions();
  const dark = useThemeStore((s) => s.dark);
  
  const gradientStart = dark ? "rgba(37, 99, 235, 0.22)" : "rgba(191, 219, 254, 0.55)";
  const gradientEnd = dark ? "rgba(15, 23, 42, 0)" : "rgba(239, 246, 255, 0)";
  const iconColor = dark ? "#3B82F6" : "#2563EB";

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width} height={140} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="vetBannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={gradientStart} />
            <Stop offset="100%" stopColor={gradientEnd} />
          </LinearGradient>
        </Defs>

        {/* Wavy background banner contour */}
        <Path
          d={`M 0 0 H ${width} V 90 Q ${width * 0.75} 125 ${width * 0.5} 100 T 0 115 Z`}
          fill="url(#vetBannerGrad)"
        />

        {/* Watermark illustrations */}
        {/* Left Side: Medical Cross & Paw print */}
        <MedicalCross x={25} y={15} size={18} opacity={dark ? 0.08 : 0.11} color={iconColor} />
        <PawPrint x={55} y={30} size={30} opacity={dark ? 0.07 : 0.09} color={iconColor} />

        {/* Right Side: Heartbeat line & Paw prints & Cross */}
        <Heartbeat x={width - 150} y={25} width={65} height={20} opacity={dark ? 0.1 : 0.15} color={iconColor} />
        <PawPrint x={width - 70} y={15} size={36} opacity={dark ? 0.08 : 0.11} color={iconColor} />
        <MedicalCross x={width - 120} y={55} size={14} opacity={dark ? 0.06 : 0.08} color={iconColor} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    overflow: "hidden",
  },
});
