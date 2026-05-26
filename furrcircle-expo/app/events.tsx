import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { events } from "../src/lib/demo-data";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { MapPin, Users, CalendarPlus } from "lucide-react-native";

const filters = ["All", "Adoption", "Playdate", "Training", "Meetup"] as const;

export default function EventsScreen() {
  const tk = useTokens();
  const [active, setActive] = useState("All");

  const filtered = active === "All"
    ? events
    : events.filter((e) => e.type.toLowerCase() === active.toLowerCase());

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Local events" />

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActive(f)}
              style={[styles.chip, active === f ? styles.chipActive : { backgroundColor: colors.white }]}
            >
              <Text style={[styles.chipText, active === f ? { color: colors.white } : { color: colors.foreground + "AA" }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 4 }}>
          {filtered.map((e) => (
            <View key={e.id} style={[styles.card, { backgroundColor: e.tintColor }]}>
              {/* Date box */}
              <View style={styles.dateBox}>
                <Text style={[styles.dateDay, { color: tk.text }]}>{e.day}</Text>
                <Text style={[styles.dateMonth, { color: tk.textMuted }]}>{e.month.toUpperCase()}</Text>
              </View>
              {/* Content */}
              <View style={{ flex: 1 }}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{e.type.toUpperCase()}</Text>
                </View>
                <Text style={[styles.eventTitle, { color: tk.text }]}>{e.title}</Text>
                <Text style={[styles.eventDate, { color: tk.textMuted }]}>{e.date}</Text>
                <View style={styles.metaRow}>
                  <MapPin size={12} color={tk.textMuted} />
                  <Text style={[styles.metaText, { color: tk.textMuted }]}>{e.location}</Text>
                </View>
                <View style={styles.bottomRow}>
                  <View style={styles.metaRow}>
                    <Users size={13} color={tk.textMuted} />
                    <Text style={[styles.metaText, { color: tk.textMuted }]}>{e.attendees} going</Text>
                  </View>
                  <TouchableOpacity style={styles.rsvpBtn}>
                    <Text style={styles.rsvpText}>RSVP</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Host an event FAB */}
        <TouchableOpacity style={styles.fab}>
          <CalendarPlus size={16} color={colors.white} />
          <Text style={styles.fabText}>Host an event</Text>
        </TouchableOpacity>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterScroll: { flexGrow: 0, marginBottom: 8 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.foreground },
  chipText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  card: { flexDirection: "row", gap: 16, borderRadius: 24, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  dateBox: { width: 64, height: 80, borderRadius: 16, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  dateDay: { fontFamily: "Poppins_700Bold", fontSize: 24, lineHeight: 28 },
  dateMonth: { fontFamily: "Poppins_700Bold", fontSize: 11, marginTop: 2 },
  typeBadge: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4 },
  typeBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  eventTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, lineHeight: 22 },
  eventDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  rsvpBtn: { backgroundColor: colors.foreground, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  rsvpText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: colors.white },
  fab: { position: "absolute", bottom: 24, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, borderRadius: 30, paddingHorizontal: 20, paddingVertical: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  fabText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
});
