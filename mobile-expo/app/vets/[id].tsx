import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator, Alert, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Clock3, MapPin, Phone, Star, Stethoscope } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

type Vet = {
  id: string;
  name?: string;
  clinic_name?: string;
  bio?: string;
  city?: string;
  phone?: string;
  rating?: number | string;
  specialty?: string;
  avatar_url?: string;
  hours?: string;
};

export default function VetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [vet, setVet] = useState<Vet | null>(null);
  const [loading, setLoading] = useState(true);

  const handleCall = useCallback(async () => {
    if (!vet?.phone) {
      Alert.alert("Phone unavailable", "This clinic does not have a phone number yet.");
      return;
    }

    const phoneUrl = `tel:${vet.phone.replace(/[^\d+]/g, "")}`;

    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (!supported) {
        Alert.alert("Unable to place call", "Calling is not available on this device.");
        return;
      }

      await Linking.openURL(phoneUrl);
    } catch {
      Alert.alert("Unable to place call", "Please try again in a moment.");
    }
  }, [vet?.phone]);

  const fetchVet = useCallback(async () => {
    try {
      const vets = await api.get("/appointments/vets");
      const match = Array.isArray(vets) ? vets.find((item) => String(item.id) === String(id)) : null;
      setVet(match || null);
    } catch (error) {
      console.error("Error fetching vet details", error);
      setVet(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVet();
  }, [fetchVet]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!vet) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <ChevronLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>Vet not found</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}>This clinic profile could not be loaded.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
            <ChevronLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.textPrimary }}>Vet Details</Text>
        </View>

        <View style={{ backgroundColor: colors.bgCard, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {vet.avatar_url ? (
              <Image source={{ uri: vet.avatar_url }} style={{ width: 72, height: 72, borderRadius: 20 }} resizeMode="cover" />
            ) : (
              <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" }}>
                <Stethoscope size={28} color="#0ea5e9" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>{vet.clinic_name || vet.name}</Text>
              <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>{vet.specialty || "General Veterinary Care"}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                <Star size={14} color="#f59e0b" fill="#f59e0b" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#f59e0b", marginLeft: 6 }}>{vet.rating || 4.8}</Text>
              </View>
            </View>
          </View>

          <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary, marginTop: 18 }}>
            {vet.bio || "A trusted local clinic focused on preventive care, checkups, and compassionate support for pets and families."}
          </Text>

          <View style={{ gap: 12, marginTop: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MapPin size={16} color={colors.textMuted} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 10 }}>{vet.city || "Nearby clinic"}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Clock3 size={16} color={colors.textMuted} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 10 }}>{vet.hours || "8:00 AM - 6:00 PM"}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Phone size={16} color={colors.textMuted} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 10 }}>{vet.phone || "Phone unavailable"}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
            <Pressable
              onPress={() => router.push(`/appointments/book?vetId=${vet.id}&vetName=${encodeURIComponent(vet.clinic_name || vet.name || "Vet Clinic")}`)}
              style={{ flex: 1, backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>Book Visit</Text>
            </Pressable>
            <Pressable
              onPress={handleCall}
              style={{ flex: 1, backgroundColor: colors.bgSubtle, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>Call Clinic</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
