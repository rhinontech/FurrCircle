import React from "react";
import { View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  initialLatitude: number;
  initialLongitude: number;
  markerLatitude?: number;
  markerLongitude?: number;
  onPick: (lat: number, lng: number) => void;
};

export default function LocationPickerMap({ initialLatitude, initialLongitude, markerLatitude, markerLongitude }: Props) {
  const { colors } = useTheme();
  const lat = typeof markerLatitude === "number" ? markerLatitude : initialLatitude;
  const lng = typeof markerLongitude === "number" ? markerLongitude : initialLongitude;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
      <View style={{ width: "100%", maxWidth: 520, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary, marginBottom: 6 }}>Map not available on web</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 10 }}>
          Pinning a map location uses native maps and isn’t supported in the web build. Open this screen on iOS/Android to drop a pin.
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted }}>Current selection: {lat.toFixed(6)}, {lng.toFixed(6)}</Text>
      </View>
    </View>
  );
}

