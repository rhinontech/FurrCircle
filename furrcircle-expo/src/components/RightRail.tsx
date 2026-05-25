import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Sparkles, CalendarDays, Stethoscope, TrendingUp } from "lucide-react-native";
import { colors } from "../lib/theme";
import { useTokens } from "../lib/theme-store";

const trending = [
  { tag: "#MoonaMondays",   posts: "1.2k posts" },
  { tag: "#AdoptDontShop",  posts: "843 posts" },
  { tag: "#PuppyPlaydate",  posts: "612 posts" },
];

const weekEvents = [
  { title: "Bandra Beach Walk", date: "Sat · 7 AM" },
  { title: "Vet Q&A live",      date: "Sun · 6 PM" },
];

export function RightRail() {
  const router = useRouter();
  const tk = useTokens();

  return (
    <ScrollView
      style={[styles.rail, { borderLeftColor: tk.border }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Trending */}
      <View style={[styles.card, { backgroundColor: tk.card }]}>
        <View style={styles.cardHeader}>
          <Sparkles size={16} color={colors.coral} />
          <Text style={[styles.cardTitle, { color: tk.text }]}>Trending in Mumbai</Text>
        </View>
        {trending.map((t) => (
          <View key={t.tag} style={styles.trendRow}>
            <Text style={[styles.trendTag, { color: tk.text }]}>{t.tag}</Text>
            <Text style={[styles.trendCount, { color: tk.textMuted }]}>{t.posts}</Text>
          </View>
        ))}
      </View>

      {/* This week */}
      <View style={[styles.card, { backgroundColor: tk.card }]}>
        <View style={styles.cardHeader}>
          <CalendarDays size={16} color={colors.pinky} />
          <Text style={[styles.cardTitle, { color: tk.text }]}>This week</Text>
        </View>
        {weekEvents.map((e) => (
          <View key={e.title} style={[styles.eventRow, { backgroundColor: tk.bg }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eventTitle, { color: tk.text }]}>{e.title}</Text>
              <Text style={[styles.eventDate, { color: tk.textMuted }]}>{e.date}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/events")} style={styles.rsvpBtn}>
              <Text style={styles.rsvpText}>RSVP</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Care reminder */}
      <TouchableOpacity
        onPress={() => router.push("/care")}
        style={styles.careRow}
        activeOpacity={0.85}
      >
        <Stethoscope size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.careTitle}>Care reminders</Text>
          <Text style={styles.careSub}>2 due this week</Text>
        </View>
        <TrendingUp size={16} color={colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 280,
    borderLeftWidth: 1,
    flexShrink: 0,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendTag: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  trendCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 10,
  },
  eventTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  eventDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  rsvpBtn: {
    backgroundColor: colors.coral,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rsvpText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: "#fff",
  },
  careRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(37,99,235,0.1)",
    borderRadius: 20,
    padding: 16,
  },
  careTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: colors.primary,
  },
  careSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.primary + "bb",
  },
});
