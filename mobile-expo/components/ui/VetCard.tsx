import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Stethoscope, MapPin, Star } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import StatusChip from "./StatusChip";

interface VetCardProps {
  name: string;
  distance: string;
  rating: number;
  avatarUrl?: string;
  badgeLabel?: string;
  onPress?: () => void;
}

export default function VetCard({ name, distance, rating, avatarUrl, badgeLabel = "VET", onPress }: VetCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        opacity: pressed ? 0.92 : 1,
        display:"flex",
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44, borderRadius: 12 }} />
        ) : (
          <Stethoscope size={20} color="#0ea5e9" />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }} numberOfLines={1}>
          {name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <MapPin size={12} color={colors.textMuted} />
          <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4, marginRight: 12 }} numberOfLines={1}>
            {distance}
          </Text>
          <Star size={12} color="#f59e0b" fill="#f59e0b" />
          <Text style={{ fontSize: 12, color: "#f59e0b", fontWeight: "700", marginLeft: 4 }}>
            {rating}
          </Text>
        </View>
      </View>
      <StatusChip label={badgeLabel} variant="info" />
    </Pressable>
  );
}
