import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { Stethoscope, MapPin, Star, Clock, Phone, Globe } from "lucide-react-native";
import { useEffect, useState } from "react";
import { placesApi } from "../../services/places/placesApi";
import { ActivityIndicator, Linking, Alert } from "react-native";

export default function VetProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tk = useTokens();

  const [vet, setVet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    placesApi.getPlaceDetails(id)
      .then((data) => setVet(data))
      .catch((err) => console.error("Failed to load vet details", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCall = async () => {
    if (!vet?.nationalPhoneNumber && !vet?.internationalPhoneNumber) {
      Alert.alert("Phone unavailable", "This clinic does not have a phone number listed.");
      return;
    }
    const phone = vet.nationalPhoneNumber || vet.internationalPhoneNumber;
    const phoneNumber = phone.replace(/[^\d+]/g, "");
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch {
      Alert.alert("Call Clinic", `Call ${vet.name} at ${phone}.`);
    }
  };

  const handleOpenMaps = async () => {
    if (!vet?.googleMapsUri) return;
    try {
      await Linking.openURL(vet.googleMapsUri);
    } catch {
      Alert.alert("Could not open maps");
    }
  };

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Vet Details" />
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={[styles.headerBg, { backgroundColor: "rgba(37,99,235,0.1)" }]} />
          
          {loading ? (
            <View style={{ paddingTop: 100, alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : !vet ? (
            <View style={{ paddingTop: 100, alignItems: "center" }}>
              <Text style={[styles.name, { color: tk.text }]}>Clinic not found</Text>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={[styles.avatarBox, { backgroundColor: tk.card, borderColor: tk.border }]}>
                <Stethoscope size={40} color={colors.primary} />
              </View>

              <Text style={[styles.name, { color: tk.text }]}>{vet.name || "Veterinary Clinic"}</Text>
              <Text style={[styles.spec, { color: tk.textMuted }]}>{vet.primaryType || "General Veterinary Care"}</Text>

              <View style={styles.metaRow}>
                {vet.rating ? (
                  <View style={[styles.metaItem, { backgroundColor: tk.card }]}>
                    <Star size={16} color={colors.sunshine} fill={colors.sunshine} />
                    <Text style={[styles.metaText, { color: tk.text }]}>{vet.rating} Rating</Text>
                  </View>
                ) : null}
                {vet.businessStatus === "OPERATIONAL" ? (
                  <View style={[styles.metaItem, { backgroundColor: tk.card }]}>
                    <Clock size={16} color={colors.success} />
                    <Text style={[styles.metaText, { color: tk.text }]}>Open</Text>
                  </View>
                ) : null}
              </View>

              {(vet.address || vet.googleMapsUri) && (
                <TouchableOpacity onPress={handleOpenMaps} activeOpacity={0.8} style={[styles.section, { backgroundColor: tk.card }]}>
                  <Text style={[styles.sectionTitle, { color: tk.text }]}>Location</Text>
                  <View style={styles.locationRow}>
                    <MapPin size={20} color={tk.textMuted} />
                    <Text style={[styles.locationText, { color: tk.text }]} numberOfLines={2}>{vet.address}</Text>
                  </View>
                  {vet.googleMapsUri && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
                      <Globe size={14} color={colors.primary} />
                      <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.primary }}>Open in Maps</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {(vet.nationalPhoneNumber || vet.internationalPhoneNumber) && (
                <TouchableOpacity onPress={handleCall} activeOpacity={0.8} style={[styles.section, { backgroundColor: tk.card }]}>
                  <Text style={[styles.sectionTitle, { color: tk.text }]}>Contact</Text>
                  <View style={styles.locationRow}>
                    <Phone size={20} color={tk.textMuted} />
                    <Text style={[styles.locationText, { color: tk.text }]}>{vet.nationalPhoneNumber || vet.internationalPhoneNumber}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {vet.regularOpeningHours?.weekdayDescriptions && (
                <View style={[styles.section, { backgroundColor: tk.card }]}>
                  <Text style={[styles.sectionTitle, { color: tk.text }]}>Hours</Text>
                  {vet.regularOpeningHours.weekdayDescriptions.map((desc: string, i: number) => {
                    const parts = desc.split(":");
                    const day = parts[0];
                    const time = parts.slice(1).join(":").trim();
                    const isClosed = desc.toLowerCase().includes("closed");
                    return (
                      <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: tk.textMuted }}>{day}</Text>
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: isClosed ? colors.coral : tk.text }}>{time}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: tk.card, paddingBottom: insets.bottom || 24, borderTopColor: tk.border }]}>
          <TouchableOpacity 
            style={styles.bookBtn} 
            activeOpacity={0.8}
            onPress={() => router.push(`/vets/reminder?vetId=${id}`)}
          >
            <Text style={styles.bookBtnText}>Set Reminder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBg: { height: 120, width: "100%", position: "absolute", top: 0 },
  content: { paddingHorizontal: 24, paddingTop: 60 },
  avatarBox: { width: 90, height: 90, borderRadius: 24, borderWidth: 4, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  name: { fontFamily: "Poppins_700Bold", fontSize: 24, marginBottom: 4 },
  spec: { fontFamily: "Inter_400Regular", fontSize: 15, marginBottom: 20 },
  metaRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  metaText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  section: { padding: 20, borderRadius: 24, marginBottom: 16 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, marginBottom: 12 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  locationText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
  aboutText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1 },
  bookBtn: { backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  bookBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
