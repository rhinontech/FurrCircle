import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl, Modal, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, Clock, PawPrint, Stethoscope, XCircle, Plus } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { userAppointmentsApi } from "../../services/users/appointmentsApi";
import AppointmentDateTimePicker from "@/components/AppointmentDateTimePicker";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  confirmed: { bg: "#D1FAE5", text: "#065F46" },
  reschedule_requested: { bg: "#DBEAFE", text: "#1D4ED8" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  completed: { bg: "#E0E7FF", text: "#3730A3" },
};

const statusStyle = (status: string) => STATUS_COLORS[status?.toLowerCase()] ?? { bg: "#F3F4F6", text: "#6B7280" };
const statusLabel = (status?: string) => {
  if (status === "reschedule_requested") return "Reschedule Requested";
  return status ?? "pending";
};

const isUpcomingAppointment = (appointment: any) => {
  const status = String(appointment.status || "").toLowerCase();
  if (!["pending", "confirmed", "reschedule_requested"].includes(status)) return false;

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
  const [rescheduleTarget, setRescheduleTarget] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
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

  const handleAcceptReschedule = async (appointment: any) => {
    setCancellingId(appointment.id);
    try {
      const updated = await userAppointmentsApi.respondReschedule(appointment.id, { action: "accept" });
      setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, ...updated } : a));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not accept reschedule.");
    } finally {
      setCancellingId(null);
    }
  };

  const openRescheduleModal = (appointment: any) => {
    setRescheduleTarget(appointment);
    setRescheduleDate(appointment.proposedDate || appointment.appointment_date || appointment.date || "");
    setRescheduleTime(appointment.proposedTime || appointment.appointment_time || appointment.time || "");
    setRescheduleReason("");
  };

  const submitOwnerReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate.trim() || !rescheduleTime.trim()) {
      Alert.alert("Date and time required", "Please enter the appointment date and time.");
      return;
    }

    const targetId = rescheduleTarget.id;
    setRescheduleTarget(null);
    setCancellingId(targetId);
    try {
      const updated = await userAppointmentsApi.respondReschedule(targetId, {
        action: "counter",
        date: rescheduleDate.trim(),
        time: rescheduleTime.trim(),
        reason: rescheduleReason.trim(),
      });
      setAppointments(prev => prev.map(a => a.id === targetId ? { ...a, ...updated } : a));
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not suggest another time.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelReschedule = (appointment: any) => {
    Alert.alert(
      "Cancel Appointment",
      "Cancel this appointment instead of accepting the new time?",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Appointment",
          style: "destructive",
          onPress: async () => {
            setCancellingId(appointment.id);
            try {
              const updated = await userAppointmentsApi.respondReschedule(appointment.id, { action: "cancel", reason: "Owner cancelled during reschedule" });
              setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, ...updated } : a));
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
              {statusLabel(appointment.status)}
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
          {appointment.status === "reschedule_requested" && (
            <View style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE", borderRadius: 10, padding: 10, marginTop: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#1D4ED8" }}>New time requested</Text>
              <Text style={{ fontSize: 13, color: "#1E40AF", marginTop: 3 }}>
                {appointment.proposedDate || "New date"} · {appointment.proposedTime || "New time"}
              </Text>
              {!!appointment.rescheduleReason && (
                <Text style={{ fontSize: 12, color: "#1E3A8A", marginTop: 4 }}>{appointment.rescheduleReason}</Text>
              )}
            </View>
          )}
        </View>

        {appointment.status === "reschedule_requested" && appointment.rescheduleRequestedBy === "vet" && (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
            <Pressable
              onPress={() => handleAcceptReschedule(appointment)}
              disabled={isCancelling}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, backgroundColor: "#ECFDF5", opacity: isCancelling ? 0.6 : 1 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#059669" }}>Accept</Text>
            </Pressable>
            <Pressable
              onPress={() => openRescheduleModal(appointment)}
              disabled={isCancelling}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, backgroundColor: "#EFF6FF", opacity: isCancelling ? 0.6 : 1 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#2563EB" }}>Reschedule</Text>
            </Pressable>
            <Pressable
              onPress={() => handleCancelReschedule(appointment)}
              disabled={isCancelling}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, backgroundColor: "#FFF1F1", opacity: isCancelling ? 0.6 : 1 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#EF4444" }}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {appointment.status === "reschedule_requested" && appointment.rescheduleRequestedBy === "owner" && (
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 12 }}>
            Waiting for the vet to accept your suggested time.
          </Text>
        )}

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
      <Modal visible={!!rescheduleTarget} transparent animationType="slide" onRequestClose={() => setRescheduleTarget(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary }}>Suggest another time</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20, marginTop: 6, marginBottom: 16 }}>
              The vet will get your suggested date and time.
            </Text>
            <AppointmentDateTimePicker
              date={rescheduleDate}
              time={rescheduleTime}
              onDateChange={setRescheduleDate}
              onTimeChange={setRescheduleTime}
            />
            <TextInput
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              placeholder="Optional note..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={{ minHeight: 82, textAlignVertical: "top", backgroundColor: colors.bgSubtle, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, color: colors.textPrimary, fontSize: 14, marginBottom: 16 }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => setRescheduleTarget(null)} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSecondary }}>Close</Text>
              </Pressable>
              <Pressable onPress={submitOwnerReschedule} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
