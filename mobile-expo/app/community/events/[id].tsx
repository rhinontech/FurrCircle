import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, CalendarDays, Clock3, MapPin, Users, Mail, ShieldCheck } from "lucide-react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { api } from "../../../services/api";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const fetchEvent = async () => {
    if (!id) return;
    try {
      const data = await api.get(`/community/events/${id}`);
      setEvent(data);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not load event details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleBook = async () => {
    if (!event) return;
    setBooking(true);
    try {
      const res = await api.post(`/community/events/${event.id}/book`, {
        note: `Booking request for ${event.title}`,
      });
      setEvent(res.event);
      Alert.alert(
        "Booking confirmed",
        `You're booked for ${event.title}. In the current mock setup this is stored locally in the app.`
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not complete booking.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <View style={{ position: "relative" }}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={{ width: "100%", height: 260 }} resizeMode="cover" />
          ) : (
            <View style={{ width: "100%", height: 260, backgroundColor: colors.infoBg }} />
          )}

          <Pressable
            onPress={() => router.back()}
            style={{ position: "absolute", top: 18, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={20} color={colors.textPrimary} />
          </Pressable>

          <View style={{ position: "absolute", right: 20, top: 20, backgroundColor: "rgba(15,23,42,0.78)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff", textTransform: "uppercase" }}>
              {event.category || "Event"}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -24 }}>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.textPrimary, lineHeight: 30 }}>{event.title}</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 10, lineHeight: 22 }}>
              {event.description}
            </Text>

            <View style={{ marginTop: 20, gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <CalendarDays size={18} color={colors.brand} />
                <Text style={{ fontSize: 14, color: colors.textPrimary }}>{formatDate(event.date)}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Clock3 size={18} color={colors.brand} />
                <Text style={{ fontSize: 14, color: colors.textPrimary }}>{formatTime(event.date)}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <MapPin size={18} color={colors.brand} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>{event.venue || event.location}</Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{event.address || event.location}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Users size={18} color={colors.brand} />
                <Text style={{ fontSize: 14, color: colors.textPrimary }}>
                  {event.attendeeCount || 0} booked{event.capacity ? ` of ${event.capacity} spots` : ""}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 18, marginTop: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 }}>Hosted By</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {event.host?.avatar_url ? (
                <Image source={{ uri: event.host.avatar_url }} style={{ width: 50, height: 50, borderRadius: 16 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={20} color={colors.brand} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>
                  {event.host?.clinic_name || event.host?.name || "PawsHub Host"}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  {event.host?.role || "Organizer"}
                </Text>
              </View>
            </View>
            {event.contactEmail ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
                <Mail size={16} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{event.contactEmail}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={handleBook}
            disabled={booking || event.isBooked}
            style={{
              marginTop: 20,
              backgroundColor: event.isBooked ? colors.successBg : colors.brand,
              borderRadius: 18,
              paddingVertical: 18,
              alignItems: "center",
              opacity: booking ? 0.7 : 1,
            }}
          >
            {booking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: event.isBooked ? "#059669" : "#fff", fontSize: 16, fontWeight: "800" }}>
                {event.isBooked ? "Already Booked" : "Book This Event"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
