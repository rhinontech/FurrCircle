import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { useTokens } from "../../theme";

type Blob = { cx: number; cy: number; r: number; index: number };

/**
 * The layer everything else floats on: a vertical gradient with a handful of
 * soft colour blobs. Static by design — an animated backdrop under blurred
 * chrome is the fastest way to make an Android device drop frames.
 */
export function AmbientBackground({ blobs }: { blobs?: Blob[] }) {
  const tk = useTokens();
  const { width, height } = useWindowDimensions();

  const layout: Blob[] = blobs ?? [
    { cx: 0.14, cy: 0.06, r: 0.62, index: 0 },
    { cx: 0.95, cy: 0.2, r: 0.55, index: 1 },
    { cx: 0.82, cy: 0.72, r: 0.6, index: 2 },
    { cx: 0.06, cy: 0.92, r: 0.5, index: 3 },
  ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={tk.ambient}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          {tk.blobs.map((b, i) => (
            <RadialGradient key={i} id={`blob${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={b.color} stopOpacity={b.opacity} />
              <Stop offset="60%" stopColor={b.color} stopOpacity={b.opacity * 0.35} />
              <Stop offset="100%" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {layout.map((b, i) => (
          <Circle
            key={i}
            cx={b.cx * width}
            cy={b.cy * height}
            r={b.r * width}
            fill={`url(#blob${b.index % tk.blobs.length})`}
          />
        ))}
      </Svg>
    </View>
  );
}
