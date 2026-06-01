import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Modal, Alert } from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { MapPin, Users, Calendar, Clock, User, X, ChevronRight } from "lucide-react-native";
import { eventApi } from "../services/community/eventApi";
import { useFocusEffect } from "expo-router";

const filters = ["All", "Adoption", "Playdate", "Training", "Meetup"] as const;

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

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  const handleBookEvent = async (id: string) => {
    try {
      setBookingInProgress(true);
      const res = await eventApi.bookEvent(id);
      Alert.alert("Success", "You have successfully booked a spot for this event!");
      
      // Update local state
      setEvents((prev: any[]) => prev.map((e: any) => e.id === id ? { ...e, isBooked: true, attendeeCount: (e.attendeeCount || 0) + 1 } : e));
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent((prev: any) => ({ ...prev, isBooked: true, attendeeCount: (prev.attendeeCount || 0) + 1 }));
      }
    } catch (err: any) {
      Alert.alert("Booking Failed", err?.response?.data?.message || "Something went wrong.");
    } finally {
      setBookingInProgress(false);
    }
  };

  const parseEventDate = (dateStr?: string) => {
    if (!dateStr) return { day: "??", month: "???" };
    try {
      // Split YYYY-MM-DD to avoid timezone shifting
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const day = d.getDate().toString();
        const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
        return { day, month };
      }
      const d = new Date(dateStr);
      const day = d.getDate().toString();
      const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
      return { day, month };
    } catch {
      return { day: "??", month: "???" };
    }
  };

  const getCategoryColor = (category?: string) => {
    const cat = (category || "").toLowerCase();
    if (cat === "adoption") return colors.coral;
    if (cat === "playdate") return colors.success;
    if (cat === "training") return "#FFD93D";
    return colors.primary;
  };

  const filtered = active === "All"
    ? events
    : events.filter((e) => (e.category || "").toLowerCase() === active.toLowerCase());

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
              style={[
                styles.chip,
                active === f ? { backgroundColor: tk.text } : { backgroundColor: tk.card, borderColor: tk.border, borderWidth: 1 }
              ]}
            >
              <Text style={[styles.chipText, active === f ? { color: tk.bg } : { color: tk.textMuted }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: tk.card, borderColor: tk.border }]}>
              <Text style={[styles.emptyText, { color: tk.text }]}>No events found</Text>
              <Text style={[styles.emptySubText, { color: tk.textMuted }]}>Check back later for new events in your area.</Text>
            </View>
          ) : (
            filtered.map((e) => {
              const { day, month } = parseEventDate(e.date);
              const accentColor = getCategoryColor(e.category);
              return (
                <TouchableOpacity
                  key={e.id}
                  onPress={() => setSelectedEvent(e)}
                  activeOpacity={0.9}
                  style={[
                    styles.card,
                    {
                      backgroundColor: tk.card,
                      borderColor: tk.border,
                      borderWidth: 1,
                      borderLeftWidth: 5,
                      borderLeftColor: accentColor,
                    }
                  ]}
                >
                  {/* Date box */}
                  <View style={[styles.dateBox, { backgroundColor: tk.inputBg }]}>
                    <Text style={[styles.dateDay, { color: tk.text }]}>{day}</Text>
                    <Text style={[styles.dateMonth, { color: accentColor }]}>{month}</Text>
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: accentColor + "22" }]}>
                        <Text style={[styles.typeBadgeText, { color: accentColor }]}>{(e.category || "General").toUpperCase()}</Text>
                      </View>
                      {e.isBooked && (
                        <View style={[styles.typeBadge, { backgroundColor: colors.success + "22" }]}>
                          <Text style={[styles.typeBadgeText, { color: colors.success }]}>BOOKED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.eventTitle, { color: tk.text }]} numberOfLines={2}>{e.title}</Text>
                    <Text style={[styles.eventDate, { color: tk.textMuted }]}>{e.date} · {e.time || "TBA"}</Text>
                    <View style={styles.metaRow}>
                      <MapPin size={12} color={tk.textMuted} />
                      <Text style={[styles.metaText, { color: tk.textMuted }]} numberOfLines={1}>{e.location || e.venue || "TBA"}</Text>
                    </View>
                    <View style={styles.bottomRow}>
                      <View style={styles.metaRow}>
                        <Users size={13} color={tk.textMuted} />
                        <Text style={[styles.metaText, { color: tk.textMuted }]}>{e.attendeeCount || 0} going</Text>
                      </View>
                      <TouchableOpacity
                        onPress={(ev) => {
                          ev.stopPropagation();
                          if (e.isBooked) {
                            Alert.alert("Already Booked", "You are already booked for this event!");
                          } else {
                            handleBookEvent(e.id);
                          }
                        }}
                        style={[
                          styles.rsvpBtn,
                          e.isBooked ? { backgroundColor: tk.inputBg } : { backgroundColor: colors.primary }
                        ]}
                      >
                        <Text style={[styles.rsvpText, e.isBooked ? { color: tk.textMuted } : { color: colors.white }]}>
                          {e.isBooked ? "Booked" : "RSVP"}
                        </Text>
                      </TouchableOpacity>
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
          transparent={true}
          onRequestClose={() => setSelectedEvent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: tk.card, maxHeight: '85%' }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: tk.text }]}>Event Details</Text>
                <TouchableOpacity onPress={() => setSelectedEvent(null)} style={styles.closeModalBtn}>
                  <X size={20} color={tk.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {selectedEvent?.imageUrl ? (
                  <Image source={{ uri: selectedEvent.imageUrl }} style={styles.detailEventImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.detailEventImgPlaceholder, { backgroundColor: tk.inputBg }]} />
                )}

                <View style={[styles.detailBadgeRow]}>
                  <View style={[styles.detailCategoryBadge, { backgroundColor: getCategoryColor(selectedEvent?.category) + "22" }]}>
                    <Text style={[styles.detailCategoryText, { color: getCategoryColor(selectedEvent?.category) }]}>
                      {(selectedEvent?.category || "General").toUpperCase()}
                    </Text>
                  </View>
                  {selectedEvent?.isBooked && (
                    <View style={[styles.detailCategoryBadge, { backgroundColor: colors.success + "22" }]}>
                      <Text style={[styles.detailCategoryText, { color: colors.success }]}>BOOKED</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.detailEventTitle, { color: tk.text }]}>
                  {selectedEvent?.title}
                </Text>

                <View style={[styles.detailInfoSection, { borderBottomColor: tk.border, borderTopColor: tk.border }]}>
                  <View style={styles.detailInfoRow}>
                    <Calendar size={16} color={tk.textMuted} />
                    <Text style={[styles.detailInfoText, { color: tk.text }]}>{selectedEvent?.date}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Clock size={16} color={tk.textMuted} />
                    <Text style={[styles.detailInfoText, { color: tk.text }]}>{selectedEvent?.time || "TBA"}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <MapPin size={16} color={tk.textMuted} />
                    <Text style={[styles.detailInfoText, { color: tk.text }]}>{selectedEvent?.location || selectedEvent?.venue || "TBA"}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Users size={16} color={tk.textMuted} />
                    <Text style={[styles.detailInfoText, { color: tk.text }]}>{selectedEvent?.attendeeCount || 0} attending</Text>
                  </View>
                </View>

                {selectedEvent?.description ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.detailLabel, { color: tk.textMuted }]}>About Event</Text>
                    <Text style={[styles.detailDescText, { color: tk.text }]}>{selectedEvent.description}</Text>
                  </View>
                ) : null}

                {/* Organizer/Host Info */}
                {selectedEvent?.host && (
                  <View style={[styles.detailHostSection, { borderColor: tk.border, backgroundColor: tk.inputBg }]}>
                    <Text style={[styles.detailLabel, { color: tk.textMuted }]}>Hosted By</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      {selectedEvent.host.avatar_url ? (
                        <Image source={{ uri: selectedEvent.host.avatar_url }} style={styles.detailAvatar} />
                      ) : (
                        <View style={[styles.detailAvatar, { backgroundColor: colors.primary + "33", alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.primary }}>
                            {(selectedEvent.host.name || "?")[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text style={[styles.detailHostName, { color: tk.text }]}>{selectedEvent.host.name}</Text>
                        <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: tk.textMuted }}>
                          {selectedEvent.host.role || "Organizer"}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* RSVP Booking button */}
                <TouchableOpacity
                  disabled={selectedEvent?.isBooked || bookingInProgress}
                  onPress={() => handleBookEvent(selectedEvent.id)}
                  style={[
                    styles.detailRsvpBtn,
                    selectedEvent?.isBooked ? { backgroundColor: tk.inputBg } : { backgroundColor: colors.primary },
                    bookingInProgress && { opacity: 0.7 }
                  ]}
                  activeOpacity={0.85}
                >
                  {bookingInProgress ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={[styles.detailRsvpBtnText, selectedEvent?.isBooked ? { color: tk.textMuted } : { color: colors.white }]}>
                      {selectedEvent?.isBooked ? "You're Going!" : "Book Event Ticket / RSVP"}
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
  filterScroll: { flexGrow: 0, marginBottom: 8 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  chipText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  card: { flexDirection: "row", gap: 16, borderRadius: 24, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  dateBox: { width: 64, height: 80, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dateDay: { fontFamily: "Poppins_700Bold", fontSize: 24, lineHeight: 28 },
  dateMonth: { fontFamily: "Poppins_700Bold", fontSize: 11, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  typeBadge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  eventTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, lineHeight: 22 },
  eventDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  rsvpBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  rsvpText: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  emptyState: { borderRadius: 24, borderStyle: 'dashed', borderWidth: 1.5, padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  emptyText: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  emptySubText: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4, textAlign: 'center' },

  // Detail Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  closeModalBtn: { padding: 4 },
  detailEventImg: { width: "100%", height: 260, borderRadius: 20, marginBottom: 16 },
  detailEventImgPlaceholder: { width: "100%", height: 260, borderRadius: 20, marginBottom: 16 },
  detailBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  detailCategoryBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  detailCategoryText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  detailEventTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, lineHeight: 28, marginBottom: 16 },
  detailInfoSection: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 16, gap: 10 },
  detailInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailInfoText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  detailLabel: { fontFamily: "Poppins_700Bold", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  detailDescText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginTop: 6 },
  detailHostSection: { borderRadius: 20, borderWidth: 1, padding: 16, marginTop: 24 },
  detailAvatar: { width: 44, height: 44, borderRadius: 22 },
  detailHostName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  detailRsvpBtn: { marginTop: 28, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  detailRsvpBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15 },
});
