import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { events } from "../src/lib/demo-data";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { MapPin, Users } from "lucide-react-native";

export default function EventsScreen() {
  const tk = useTokens();
  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Events" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        {events.map((e) => (
          <View key={e.id} style={[styles.card, { backgroundColor: tk.card, borderLeftColor: e.tintColor.replace("rgba(", "").split(",")[0] === "255" ? colors.coral : colors.primary }]}>
            <View style={[styles.dateBox, { backgroundColor: e.tintColor }]}>
              <Text style={styles.dateDay}>{e.day}</Text>
              <Text style={styles.dateMonth}>{e.month}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eventTitle, { color: tk.text }]}>{e.title}</Text>
              <Text style={styles.eventDate}>{e.date}</Text>
              <View style={styles.metaRow}>
                <MapPin size={12} color={colors.foreground + "88"} />
                <Text style={styles.metaText}>{e.location}</Text>
              </View>
              <View style={styles.metaRow}>
                <Users size={12} color={colors.foreground + "88"} />
                <Text style={styles.metaText}>{e.attendees} going</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.rsvpBtn}>
              <Text style={styles.rsvpText}>RSVP</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 20, padding: 16, marginBottom: 12, borderLeftWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  dateBox: { width: 52, height: 60, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dateDay: { fontFamily: "Poppins_700Bold", fontSize: 20, color: colors.foreground },
  dateMonth: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: colors.foreground + "88" },
  eventTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, lineHeight: 22 },
  eventDate: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  metaText: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  rsvpBtn: { backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  rsvpText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: colors.white },
});
