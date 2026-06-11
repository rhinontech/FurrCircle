import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { CalendarDays, Stethoscope, TrendingUp, MapPin } from "lucide-react-native";
import { colors } from "../lib/theme";
import { useTokens } from "../lib/theme-store";
import { useAuthStore } from "../lib/auth-store";
import { useEffect, useState } from "react";
import { PrivateAxios } from "../../helpers/PrivateAxios";

export function RightRail() {
  const router = useRouter();
  const tk = useTokens();
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    PrivateAxios.get("/events?limit=3")
      .then((r) => setEvents(r.data?.events || r.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <ScrollView
      style={[styles.rail, { borderLeftColor: tk.border }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* User city chip */}
      {user?.city && (
        <View style={[styles.cityChip, { backgroundColor: tk.card }]}>
          <MapPin size={13} color={colors.primary} />
          <Text style={[styles.cityText, { color: tk.textMuted }]}>{user.city}</Text>
        </View>
      )}

      {/* Upcoming events */}
      <View style={[styles.card, { backgroundColor: tk.card }]}>
        <View style={styles.cardHeader}>
          <CalendarDays size={16} color={colors.pinky} />
          <Text style={[styles.cardTitle, { color: tk.text }]}>Upcoming events</Text>
        </View>

        {loadingEvents ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
        ) : events.length === 0 ? (
          <Text style={[styles.emptyText, { color: tk.textMuted }]}>No upcoming events</Text>
        ) : (
          events.slice(0, 3).map((e) => (
            <TouchableOpacity
              key={e.id}
              onPress={() => router.push("/events")}
              style={[styles.eventRow, { backgroundColor: tk.bg }]}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.eventTitle, { color: tk.text }]} numberOfLines={1}>{e.title}</Text>
                <Text style={[styles.eventDate, { color: tk.textMuted }]}>{formatEventDate(e.date || e.start_date || e.createdAt)}</Text>
              </View>
              <View style={styles.rsvpBtn}>
                <Text style={styles.rsvpText}>View</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity onPress={() => router.push("/events")} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See all events →</Text>
        </TouchableOpacity>
      </View>

      {/* Care reminder */}
      <TouchableOpacity
        onPress={() => router.push("/care" as any)}
        style={styles.careRow}
        activeOpacity={0.85}
      >
        <Stethoscope size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.careTitle}>Care reminders</Text>
          <Text style={styles.careSub}>Tap to view</Text>
        </View>
        <TrendingUp size={16} color={colors.primary} />
      </TouchableOpacity>

      {/* App info */}
      <Text style={[styles.footer, { color: tk.textMuted }]}>FurrCircle · Pet community</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: { flex: 1 },
  content: { padding: 20, gap: 16 },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  cityText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 10,
  },
  eventTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  eventDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  rsvpBtn: {
    backgroundColor: colors.coral,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rsvpText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: "#fff" },
  seeAllBtn: { alignItems: "center", paddingTop: 4 },
  seeAllText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  careRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(37,99,235,0.1)",
    borderRadius: 20,
    padding: 16,
  },
  careTitle: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.primary },
  careSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.primary + "bb" },
  footer: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular" },
});
