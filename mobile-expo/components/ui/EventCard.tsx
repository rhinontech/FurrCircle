import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { MapPin, Clock, Users } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface EventCardProps {
  title: string;
  day: string;
  month: string;
  time: string;
  location: string;
  category: string;
  attendees?: string;
  imageUrl?: string;
  onPress?: () => void;
}

export default function EventCard({
  title,
  day,
  month,
  time,
  location,
  category,
  attendees,
  imageUrl,
  onPress,
}: EventCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 224,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.94 : 1,
      })}
    >
      <View style={{ position: "relative" }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 144 }} resizeMode="cover" />
        ) : (
          <View style={{ width: "100%", height: 144, backgroundColor: colors.infoBg }} />
        )}
        <View style={{ position: "absolute", top: 14, left: 14, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, minWidth: 58, alignItems: "center" }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: colors.brand, textTransform: "uppercase" }}>{month}</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>{day}</Text>
        </View>
        <View style={{ position: "absolute", right: 14, top: 14, backgroundColor: "rgba(15,23,42,0.72)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#fff", textTransform: "uppercase" }}>{category}</Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Text numberOfLines={2} style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, lineHeight: 22, minHeight: 44 }}>
          {title}
        </Text>

        <View style={{ marginTop: 12, gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Clock size={14} color={colors.textMuted} />
            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "500" }}>{time}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MapPin size={14} color={colors.textMuted} />
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: colors.textMuted, fontWeight: "500" }}>{location}</Text>
          </View>
          {!!attendees && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Users size={14} color={colors.textMuted} />
              <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "500" }}>{attendees}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
