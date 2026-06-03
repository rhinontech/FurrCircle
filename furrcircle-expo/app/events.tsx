import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Modal, Alert,
} from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { MapPin, Users, Calendar, Clock, X, CalendarDays } from "lucide-react-native";
import { eventApi } from "../services/community/eventApi";
import { useFocusEffect } from "expo-router";

const filters = ["All", "Adoption", "Playdate", "Training", "Meetup"] as const;

// Tint palette per category — mirrors the lovable demo
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

const parseEventDate = (dateStr?: string) => {
  if (!dateStr) return { day: "??", month: "???" };
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return {
        day: d.getDate().toString(),
        month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
      };
    }
    const d = new Date(dateStr);
    return {
      day: d.getDate().toString(),
      month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
    };
  } catch {
    return { day: "??", month: "???" };
  }
};

export default function EventsScreen() {
  const tk = useTokens();
  const [active, setActive] = useState<string>("All");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getEvents();
      setEvents(data || []);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchEvents(); }, []));

  const handleBookEvent = async (id: string) => {
    try {
      setBookingInProgress(true);
      await eventApi.bookEvent(id);
      Alert.alert("You're in! 🎉", "Your spot has been reserved for this event.");
      setEvents((prev) => prev.map((e) =>
        e.id === id ? { ...e, isBooked: true, attendeeCount: (e.attendeeCount || 0) + 1 } : e
      ));
      if (selectedEvent?.id === id) {
        setSelectedEvent((prev: any) => ({ ...prev, isBooked: true, attendeeCount: (prev.attendeeCount || 0) + 1 }));
      }
    } catch (err: any) {
      Alert.alert("Booking Failed", err?.response?.data?.message || "Something went wrong.");
    } finally {
      setBookingInProgress(false);
    }
  };

  const filtered = active === "All"
    ? events
    : events.filter((e) => (e.category || "").toLowerCase() === active.toLowerCase());

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Local events" />

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActive(f)}
              style={[
                styles.chip,
                active === f
                  ? { backgroundColor: tk.text }
                  : { backgroundColor: tk.card, borderColor: tk.border, borderWidth: 1 },
              ]}
            >
              <Text style={[styles.chipText, { color: active === f ? tk.bg : tk.textMuted }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
          ) : filtered.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: tk.card, borderColor: tk.border }]}>
              <CalendarDays size={40} color={tk.textMuted} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: tk.text }]}>No events found</Text>
              <Text style={[styles.emptySubText, { color: tk.textMuted }]}>
                Check back later for new events in your area.
              </Text>
            </View>
          ) : (
            filtered.map((e) => {
              const { day, month } = parseEventDate(e.date);
              const tint = getTint(e.category);

              return (
                <TouchableOpacity
                  key={e.id}
                  onPress={() => setSelectedEvent(e)}
                  activeOpacity={0.88}
                  style={[styles.card, { backgroundColor: tint.bg, shadowColor: tk.text }]}
                >
                  {/* Content row */}
                  <View style={styles.cardRow}>
                    {/* Date box */}
                    <View style={styles.dateBox}>
                      <Text style={[styles.dateDay, { color: tk.text }]}>{day}</Text>
                      <Text style={[styles.dateMonth, { color: tint.badge }]}>{month}</Text>
                    </View>

                    {/* Info */}
                    <View style={styles.cardInfo}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.typeBadge, { backgroundColor: "rgba(255,255,255,0.7)" }]}>
                          <Text style={[styles.typeBadgeText, { color: tint.text }]}>
                            {(e.category || "General").toUpperCase()}
                          </Text>
                        </View>
                        {e.isBooked && (
                          <View style={[styles.typeBadge, { backgroundColor: colors.success + "22" }]}>
                            <Text style={[styles.typeBadgeText, { color: colors.success }]}>✓ GOING</Text>
                          </View>
                        )}
                      </View>

                      <Text style={[styles.cardTitle, { color: tk.text }]} numberOfLines={2}>
                        {e.title}
                      </Text>

                      <Text style={[styles.cardDate, { color: tk.textMuted }]}>
                        {e.date}{e.time ? ` · ${e.time}` : ""}
                      </Text>

                      <View style={styles.metaRow}>
                        <MapPin size={11} color={tk.textMuted} />
                        <Text style={[styles.metaText, { color: tk.textMuted }]} numberOfLines={1}>
                          {e.location || e.venue || "TBA"}
                        </Text>
                      </View>

                      <View style={styles.bottomRow}>
                        <View style={styles.metaRow}>
                          <Users size={13} color={tk.textMuted} />
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: tk.textMuted }}>
                            {e.attendeeCount || 0} going
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={(ev) => {
                            ev.stopPropagation();
                            if (e.isBooked) {
                              Alert.alert("Already Booked", "You're already going to this event!");
                            } else {
                              handleBookEvent(e.id);
                            }
                          }}
                          style={[
                            styles.rsvpBtn,
                            { backgroundColor: e.isBooked ? "rgba(0,0,0,0.08)" : tk.text },
                          ]}
                        >
                          <Text style={[styles.rsvpText, { color: e.isBooked ? tk.textMuted : tk.bg }]}>
                            {e.isBooked ? "Booked" : "RSVP"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Event Detail Modal */}
        <Modal
          visible={!!selectedEvent}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedEvent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: tk.card }]}>
              {/* Image header */}
              {selectedEvent?.imageUrl ? (
                <Image source={{ uri: selectedEvent.imageUrl }} style={styles.modalImage} resizeMode="cover" />
              ) : (
                <View style={[styles.modalImagePlaceholder, { backgroundColor: getTint(selectedEvent?.category).bg }]}>
                  <CalendarDays size={56} color={getTint(selectedEvent?.category).badge} style={{ opacity: 0.5 }} />
                </View>
              )}

              <TouchableOpacity
                onPress={() => setSelectedEvent(null)}
                style={[styles.modalCloseBtn, { backgroundColor: "rgba(0,0,0,0.4)" }]}
              >
                <X size={18} color="#fff" />
              </TouchableOpacity>

              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Category + booked */}
                <View style={styles.modalBadgeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: getTint(selectedEvent?.category).badge + "20" }]}>
                    <Text style={[styles.typeBadgeText, { color: getTint(selectedEvent?.category).text }]}>
                      {(selectedEvent?.category || "General").toUpperCase()}
                    </Text>
                  </View>
                  {selectedEvent?.isBooked && (
                    <View style={[styles.typeBadge, { backgroundColor: colors.success + "20" }]}>
                      <Text style={[styles.typeBadgeText, { color: colors.success }]}>✓ GOING</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.modalTitle, { color: tk.text }]}>{selectedEvent?.title}</Text>

                {/* Info grid */}
                <View style={[styles.infoGrid, { borderColor: tk.border }]}>
                  {[
                    { icon: <Calendar size={15} color={colors.primary} />, label: "Date", value: selectedEvent?.date },
                    { icon: <Clock size={15} color={colors.primary} />, label: "Time", value: selectedEvent?.time || "TBA" },
                    { icon: <MapPin size={15} color={colors.primary} />, label: "Location", value: selectedEvent?.location || selectedEvent?.venue || "TBA" },
                    { icon: <Users size={15} color={colors.primary} />, label: "Attending", value: `${selectedEvent?.attendeeCount || 0} people going` },
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

                {selectedEvent?.description ? (
                  <View style={styles.descSection}>
                    <Text style={[styles.sectionLabel, { color: tk.textMuted }]}>About</Text>
                    <Text style={[styles.descText, { color: tk.text }]}>{selectedEvent.description}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  disabled={selectedEvent?.isBooked || bookingInProgress}
                  onPress={() => handleBookEvent(selectedEvent.id)}
                  style={[
                    styles.detailRsvpBtn,
                    { backgroundColor: selectedEvent?.isBooked ? tk.inputBg : tk.text },
                    bookingInProgress && { opacity: 0.7 },
                  ]}
                  activeOpacity={0.85}
                >
                  {bookingInProgress ? (
                    <ActivityIndicator size="small" color={tk.bg} />
                  ) : (
                    <Text style={[styles.detailRsvpBtnText, { color: selectedEvent?.isBooked ? tk.textMuted : tk.bg }]}>
                      {selectedEvent?.isBooked ? "You're Going! 🎉" : "Book / RSVP"}
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 10 },
  chip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  chipText: { fontFamily: "Poppins_700Bold", fontSize: 12 },

  listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 4 },

  // Card — matches lovable tinted card style
  card: {
    borderRadius: 24,
    marginBottom: 12,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardRow: { flexDirection: "row", gap: 12, padding: 16 },

  // Date box — white bg, day large, month coloured
  dateBox: {
    width: 64,
    height: 80,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dateDay: { fontFamily: "Poppins_700Bold", fontSize: 24, lineHeight: 28 },
  dateMonth: { fontFamily: "Poppins_700Bold", fontSize: 11, marginTop: 2 },

  // Content
  cardInfo: { flex: 1, minWidth: 0 },
  badgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 5 },
  typeBadge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  cardTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, lineHeight: 21 },
  cardDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, flexShrink: 1, flexGrow: 0 },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 8 },
  rsvpBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, flexShrink: 0 },
  rsvpText: { fontFamily: "Poppins_700Bold", fontSize: 11 },

  // Empty
  emptyState: {
    borderRadius: 24, borderStyle: "dashed", borderWidth: 1.5,
    padding: 48, alignItems: "center", marginTop: 24,
  },
  emptyText: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  emptySubText: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 6, textAlign: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: "88%", overflow: "hidden" },
  modalImage: { width: "100%", height: 240 },
  modalImagePlaceholder: { width: "100%", height: 200, alignItems: "center", justifyContent: "center" },
  modalCloseBtn: {
    position: "absolute", top: 16, right: 16,
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  modalBody: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },
  modalBadgeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, lineHeight: 30, marginBottom: 20 },

  infoGrid: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  infoIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 1 },
  infoValue: { fontFamily: "Poppins_700Bold", fontSize: 13 },

  descSection: { marginBottom: 24 },
  sectionLabel: { fontFamily: "Poppins_700Bold", fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 },
  descText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },

  detailRsvpBtn: { height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  detailRsvpBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15 },
});
