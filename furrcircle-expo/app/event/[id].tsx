import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, StyleSheet
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { MapPin, Users, Calendar, Clock, CalendarDays } from "../../src/components/ui/icons";
import { eventApi } from "../../services/community/eventApi";

const TINTS: Record<string, { bg: string; badge: string; text: string }> = {
  adoption: { bg: "#22c55e18", badge: "#22c55e", text: "#15803d" },
  playdate:  { bg: "#fde04730", badge: "#F59E0B", text: "#92400e" },
  training:  { bg: "#2563eb14", badge: "#2563EB", text: "#1d4ed8" },
  meetup:    { bg: "#ec489918", badge: "#ec4899", text: "#9d174d" },
  social:    { bg: "#2563eb14", badge: "#2563EB", text: "#1d4ed8" },
};
const DEFAULT_TINT = { bg: "#6366f114", badge: "#6366f1", text: "#4338ca" };

const getTint = (category?: string) =>
  TINTS[(category || "").toLowerCase()] ?? DEFAULT_TINT;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tk = useTokens();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getEventById(id);
      setEvent(data);
    } catch (err) {
      console.error("Failed to load event details", err);
      Alert.alert("Error", "Could not load event details.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookEvent = async () => {
    if (!event) return;
    try {
      setBookingInProgress(true);
      await eventApi.bookEvent(event.id);
      Alert.alert("You're in! 🎉", "Your spot has been reserved for this event.");
      setEvent((prev: any) => prev ? { ...prev, isBooked: true, attendeeCount: (prev.attendeeCount || 0) + 1 } : null);
    } catch (err: any) {
      Alert.alert("Booking Failed", err?.response?.data?.message || "Something went wrong.");
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <ScreenHeader title="Event Details" />
        <View style={[styles.centered, { backgroundColor: tk.bg }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </PageContainer>
    );
  }

  if (!event) {
    return (
      <PageContainer>
        <ScreenHeader title="Event Details" />
        <View style={[styles.centered, { backgroundColor: tk.bg }]}>
          <Text style={{ color: tk.textMuted }}>Event not found</Text>
        </View>
      </PageContainer>
    );
  }

  const tint = getTint(event.category);

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Event Details" />
        
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 32 }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Cover Image */}
          <View style={styles.imageContainer}>
            {event.imageUrl ? (
              <Image source={{ uri: event.imageUrl }} style={styles.eventImage} resizeMode="cover" />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: tint.bg }]}>
                <CalendarDays size={72} color={tint.badge} style={{ opacity: 0.5 }} />
              </View>
            )}
          </View>

          {/* Content Body */}
          <View style={styles.contentBody}>
            {/* Category Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, { backgroundColor: tint.badge + "20" }]}>
                <Text style={[styles.typeBadgeText, { color: tint.text }]}>
                  {(event.category || "General").toUpperCase()}
                </Text>
              </View>
              {event.isBooked && (
                <View style={[styles.typeBadge, { backgroundColor: colors.success + "20" }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.success }]}>✓ GOING</Text>
                </View>
              )}
            </View>

            {/* Event Title */}
            <Text style={[styles.eventTitle, { color: tk.text }]}>{event.title}</Text>

            {/* Info Grid */}
            <View style={[styles.infoGrid, { borderColor: tk.border }]}>
              {[
                { icon: <Calendar size={16} color={colors.primary} />, label: "Date", value: event.date },
                { icon: <Clock size={16} color={colors.primary} />, label: "Time", value: event.time || "TBA" },
                { icon: <MapPin size={16} color={colors.primary} />, label: "Location", value: event.location || event.venue || "TBA" },
                { icon: <Users size={16} color={colors.primary} />, label: "Attending", value: `${event.attendeeCount || 0} people going` },
              ].map(({ icon, label, value }, i) => (
                <View
                  key={i}
                  style={[styles.infoRow, { borderBottomColor: tk.border, borderBottomWidth: i < 3 ? 1 : 0 }]}
                >
                  <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + "12" }]}>{icon}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoLabel, { color: tk.textMuted }]}>{label}</Text>
                    <Text style={[styles.infoValue, { color: tk.text }]}>{value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Description */}
            {event.description ? (
              <View style={styles.descSection}>
                <Text style={[styles.sectionLabel, { color: tk.textMuted }]}>About</Text>
                <Text style={[styles.descText, { color: tk.text }]}>{event.description}</Text>
              </View>
            ) : null}

            {/* RSVP / Book Button */}
            <TouchableOpacity
              disabled={event.isBooked || bookingInProgress}
              onPress={handleBookEvent}
              style={[
                styles.rsvpBtn,
                { backgroundColor: event.isBooked ? tk.inputBg : tk.text },
                bookingInProgress && { opacity: 0.7 },
              ]}
              activeOpacity={0.85}
            >
              {bookingInProgress ? (
                <ActivityIndicator size="small" color={tk.bg} />
              ) : (
                <Text style={[styles.rsvpBtnText, { color: event.isBooked ? tk.textMuted : tk.bg }]}>
                  {event.isBooked ? "You're Going! 🎉" : "Book / RSVP"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  imageContainer: {
    width: "100%",
    height: 280,
    overflow: "hidden",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  contentBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
  },
  eventTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 20,
  },
  infoGrid: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  descSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  descText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
  },
  rsvpBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  rsvpBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
});
