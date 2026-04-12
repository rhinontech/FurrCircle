import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, Clock, PawPrint, Stethoscope, XCircle, Plus } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { userAppointmentsApi } from "../../services/users/appointmentsApi";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  confirmed: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  completed: { bg: "#E0E7FF", text: "#3730A3" },
};

const statusStyle = (status: string) => STATUS_COLORS[status?.toLowerCase()] ?? { bg: "#F3F4F6", text: "#6B7280" };

const isUpcomingAppointment = (appointment: any) => {
  const status = String(appointment.status || "").toLowerCase();
  if (!["pending", "confirmed"].includes(status)) return false;

  const dateValue = appointment.appointment_date ?? appointment.date;
  if (!dateValue) return true;

  const appointmentDate = new Date(dateValue);
  if (Number.isNaN(appointmentDate.getTime())) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  appointmentDate.setHours(0, 0, 0, 0);
  return appointmentDate >= today;
};

export default function OwnerAppointmentsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Past">("Upcoming");

  const fetchAppointments = async () => {
    try {
      const data = await userAppointmentsApi.listOwnerAppointments();
      setAppointments(data || []);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not load appointments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchAppointments();
  }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleCancel = (appointment: any) => {
    Alert.alert(
      "Cancel Appointment",
      `Cancel your appointment with ${appointment.veterinarian?.name ?? "the vet"} on ${appointment.appointment_date ?? appointment.date}?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Appointment", style: "destructive",
          onPress: async () => {
            setCancellingId(appointment.id);
            try {
              await userAppointmentsApi.cancelAppointment(appointment.id);
              setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, status: "cancelled" } : a));
            } catch (e: any) {
              Alert.alert("Error", e.message || "Could not cancel appointment.");
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const canCancel = (status: string) => ["pending", "confirmed"].includes(status?.toLowerCase());

  const upcoming = appointments.filter(isUpcomingAppointment);
  const past = appointments.filter(a => !isUpcomingAppointment(a));
  const visibleAppointments = activeTab === "Upcoming" ? upcoming : past;

  const renderAppointment = (appointment: any) => {
    const sty = statusStyle(appointment.status);
    const isCancelling = cancellingId === appointment.id;
    return (
      <Pressable
        key={appointment.id}
        onPress={() => router.push(`/appointments/${appointment.id}` as any)}
        style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}
      >
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.heroBg + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={18} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                {appointment.veterinarian?.name ?? "Veterinarian"}
              </Text>
              {appointment.veterinarian?.clinic_name && (
                <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
                  {appointment.veterinarian.clinic_name}
                </Text>
              )}
            </View>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: sty.bg }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: sty.text, textTransform: 'capitalize' }}>
              {appointment.status ?? "pending"}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 6 }}>
          {appointment.pet?.name && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PawPrint size={14} color={colors.textMuted} />
              <Text style={{ fontSize: 13, color: colors.textMuted }}>{appointment.pet.name}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color={colors.textMuted} />
            <Text style={{ fontSize: 13, color: colors.textMuted }}>{appointment.appointment_date ?? appointment.date ?? "—"}</Text>
          </View>
          {(appointment.appointment_time ?? appointment.time) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={{ fontSize: 13, color: colors.textMuted }}>{appointment.appointment_time ?? appointment.time}</Text>
            </View>
          )}
          {appointment.reason && (
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
              {appointment.reason}
            </Text>
          )}
        </View>

        {/* Cancel */}
        {canCancel(appointment.status) && (
          <Pressable
            onPress={() => handleCancel(appointment)}
            disabled={isCancelling}
            style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FFF1F1', opacity: isCancelling ? 0.6 : 1 }}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <XCircle size={15} color="#EF4444" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Cancel Appointment</Text>
              </>
            )}
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>My Appointments</Text>
        <Pressable
          onPress={() => router.push("/appointments/book")}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brand, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
        >
          <Plus size={15} color="#fff" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Book</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : appointments.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 }}>
          <Calendar size={52} color={colors.textMuted} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>No appointments yet</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>Book your first appointment with a vet to get started.</Text>
          <Pressable
            onPress={() => router.push("/appointments/book")}
            style={{ marginTop: 8, backgroundColor: colors.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Book Appointment</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        >
          <View style={{ flexDirection: "row", backgroundColor: colors.bgSubtle, borderRadius: 14, padding: 4, marginBottom: 16 }}>
            {(["Upcoming", "Past"] as const).map((tab) => {
              const selected = activeTab === tab;
              const count = tab === "Upcoming" ? upcoming.length : past.length;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{ flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: selected ? colors.bgCard : "transparent", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: selected ? colors.textPrimary : colors.textMuted }}>
                    {tab} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {visibleAppointments.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 56, gap: 12 }}>
              <Calendar size={44} color={colors.textMuted} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                {activeTab === "Upcoming" ? "No upcoming appointments" : "No past appointments"}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
                {activeTab === "Upcoming" ? "Pending and confirmed visits will appear here." : "Completed and cancelled visits will appear here."}
              </Text>
            </View>
          ) : (
            visibleAppointments.map(renderAppointment)
          )}
        </ScrollView>
      )}
    </View>
  );
}
