import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, RefreshControl, Alert, Modal, TextInput } from "react-native";
import { Clock, CheckCircle, XCircle, AlertCircle, PawPrint, CalendarDays } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useRouter } from "expo-router";
import StatusChip from "../../components/ui/StatusChip";
import { vetAppointmentsApi } from "@/services/vets/appointmentsApi";
import AppointmentDateTimePicker from "@/components/AppointmentDateTimePicker";

const tabs = ["Upcoming", "Past"];
const declineReasons = ["Unavailable time slot", "On leave", "Personal reason", "Emergency schedule change"];

const statusIcon = (s: string) => {
  if (s === 'confirmed') return <CheckCircle size={18} color="#10b981" />;
  if (s === 'reschedule_requested') return <Clock size={18} color="#0ea5e9" />;
  if (s === 'pending') return <AlertCircle size={18} color="#f59e0b" />;
  if (s === 'done' || s === 'completed') return <CheckCircle size={18} color="#64748b" />;
  return <XCircle size={18} color="#f43f5e" />;
};

const statusVariant = (s: string): "success" | "warning" | "info" | "danger" => {
  if (s === 'confirmed') return 'success';
  if (s === 'reschedule_requested') return 'info';
  if (s === 'pending') return 'warning';
  if (s === 'done' || s === 'completed') return 'info';
  return 'danger';
};

const statusLabel = (s: string) => {
  if (s === "reschedule_requested") return "Reschedule Requested";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function AppointmentsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [active, setActive] = useState("Upcoming");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<any | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [rescheduleTarget, setRescheduleTarget] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await vetAppointmentsApi.listAppointments();
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    setUpdating(id);
    try {
      await vetAppointmentsApi.updateStatus(id, status, notes);
      // Update local state
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status, notes: notes ?? a.notes } : a));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update appointment");
    } finally {
      setUpdating(null);
    }
  };

  const openDeclineModal = (appointment: any) => {
    setDeclineTarget(appointment);
    setDeclineReason("");
  };

  const submitDecline = async () => {
    const reason = declineReason.trim();
    if (!declineTarget || !reason) {
      Alert.alert("Reason required", "Please choose or type a reason so the owner knows why.");
      return;
    }

    const targetId = declineTarget.id;
    setDeclineTarget(null);
    setDeclineReason("");
    await handleUpdateStatus(targetId, "cancelled", reason);
  };

  const openRescheduleModal = (appointment: any) => {
    setRescheduleTarget(appointment);
    setRescheduleDate(appointment.proposedDate || appointment.date || "");
    setRescheduleTime(appointment.proposedTime || appointment.time || "");
    setRescheduleReason(appointment.rescheduleReason || "");
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate.trim() || !rescheduleTime.trim()) {
      Alert.alert("Date and time required", "Please enter the new appointment date and time.");
      return;
    }

    const targetId = rescheduleTarget.id;
    const payload = {
      date: rescheduleDate.trim(),
      time: rescheduleTime.trim(),
      reason: rescheduleReason.trim(),
    };
    setRescheduleTarget(null);
    setUpdating(targetId);
    try {
      const updated = await vetAppointmentsApi.requestReschedule(targetId, payload);
      setAppointments(prev => prev.map(a => a.id === targetId ? { ...a, ...updated } : a));
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to request reschedule");
    } finally {
      setUpdating(null);
    }
  };

  const acceptOwnerReschedule = async (appointment: any) => {
    setUpdating(appointment.id);
    try {
      const updated = await vetAppointmentsApi.respondReschedule(appointment.id, { action: "accept" });
      setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, ...updated } : a));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to accept reschedule");
    } finally {
      setUpdating(null);
    }
  };

  const upcoming = appointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled' && a.status !== 'done');
  const past = appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled' || a.status === 'done');
  const list = active === "Upcoming" ? upcoming : past;

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>Appointments</Text>

          {/* Tab Toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: colors.bgSubtle, borderRadius: 12, padding: 4, marginBottom: 4 }}>
            {tabs.map((t) => (
              <Pressable
                key={t}
                onPress={() => setActive(t)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: active === t ? colors.bgCard : 'transparent' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: active === t ? colors.textPrimary : colors.textMuted }}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {list.length === 0 ? (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginTop: 12 }}>
              <CalendarDays size={32} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>No {active.toLowerCase()} appointments</Text>
            </View>
          ) : list.map((appt) => (
            <Pressable key={appt.id} onPress={() => router.push(`/appointments/${appt.id}` as any)} style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, opacity: updating === appt.id ? 0.7 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {appt.pet?.avatar_url ? (
                  <Image source={{ uri: appt.pet.avatar_url }} style={{ width: 52, height: 52, borderRadius: 14 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                    <PawPrint size={24} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{appt.pet?.name || 'Pet'}</Text>
                    <StatusChip label={appt.pet?.species || 'Other'} variant="info" />
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{appt.pet?.breed || 'Unknown'} · {appt.owner?.name || 'Owner'}</Text>
                </View>
                {statusIcon(appt.status)}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>{appt.date} · {appt.time}</Text>
                </View>
                <StatusChip label={statusLabel(appt.status)} variant={statusVariant(appt.status)} />
              </View>

              {appt.reason && (
                <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 10, padding: 10, marginTop: 10 }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>📋 <Text style={{ fontWeight: '600' }}>Reason:</Text> {appt.reason}</Text>
                </View>
              )}

              {appt.notes && (
                <View style={{ backgroundColor: '#fff1f2', borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#fecdd3' }}>
                  <Text style={{ fontSize: 13, color: '#be123c' }}>Decline reason: {appt.notes}</Text>
                </View>
              )}

              {appt.status === 'reschedule_requested' && (
                <View style={{ backgroundColor: '#eff6ff', borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#bfdbfe' }}>
                  <Text style={{ fontSize: 13, color: '#1d4ed8', fontWeight: '700' }}>
                    Reschedule request
                  </Text>
                  <Text style={{ fontSize: 13, color: '#1e40af', marginTop: 3 }}>
                    {appt.proposedDate || 'New date'} · {appt.proposedTime || 'New time'}
                  </Text>
                  {!!appt.rescheduleReason && (
                    <Text style={{ fontSize: 12, color: '#1e3a8a', marginTop: 4 }}>{appt.rescheduleReason}</Text>
                  )}
                </View>
              )}

              {appt.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <Pressable 
                    onPress={() => handleUpdateStatus(appt.id, 'confirmed')}
                    disabled={updating === appt.id}
                    style={{ flex: 1, backgroundColor: colors.successBg, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#10b981' }}>✓ Confirm</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => openDeclineModal(appt)}
                    disabled={updating === appt.id}
                    style={{ flex: 1, backgroundColor: '#fff1f2', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#e11d48' }}>✕ Decline</Text>
                  </Pressable>
                </View>
              )}
              {appt.status === 'confirmed' && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <Pressable 
                    onPress={() => handleUpdateStatus(appt.id, 'completed')}
                    disabled={updating === appt.id}
                    style={{ flex: 1, backgroundColor: colors.infoBg, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0ea5e9' }}>✓ Mark Completed</Text>
                  </Pressable>
                   <Pressable 
                    onPress={() => openRescheduleModal(appt)}
                    disabled={updating === appt.id}
                    style={{ flex: 1, backgroundColor: '#eff6ff', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb' }}>↻ Reschedule</Text>
                  </Pressable>
                </View>
              )}
              {appt.status === 'reschedule_requested' && appt.rescheduleRequestedBy === 'owner' && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <Pressable
                    onPress={() => acceptOwnerReschedule(appt)}
                    disabled={updating === appt.id}
                    style={{ flex: 1, backgroundColor: colors.successBg, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#10b981' }}>✓ Accept Time</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openRescheduleModal(appt)}
                    disabled={updating === appt.id}
                    style={{ flex: 1, backgroundColor: '#eff6ff', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb' }}>↻ Suggest Again</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!declineTarget} transparent animationType="slide" onRequestClose={() => setDeclineTarget(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary }}>Reason for decline</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20, marginTop: 6, marginBottom: 16 }}>
              The owner will see this reason in their notification and appointment details.
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {declineReasons.map((reason) => {
                const selected = declineReason === reason;
                return (
                  <Pressable
                    key={reason}
                    onPress={() => setDeclineReason(reason)}
                    style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: selected ? colors.brand : colors.bgSubtle, borderWidth: 1, borderColor: selected ? colors.brand : colors.border }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: selected ? "#fff" : colors.textPrimary }}>{reason}</Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={declineReason}
              onChangeText={setDeclineReason}
              placeholder="Type another reason..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={{ minHeight: 92, textAlignVertical: "top", backgroundColor: colors.bgSubtle, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, color: colors.textPrimary, fontSize: 14, marginBottom: 16 }}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => setDeclineTarget(null)} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submitDecline} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>Decline</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!rescheduleTarget} transparent animationType="slide" onRequestClose={() => setRescheduleTarget(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary }}>Reschedule appointment</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20, marginTop: 6, marginBottom: 16 }}>
              The owner will get a notification and can accept, suggest another time, or cancel.
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
              placeholder="Reason or note for owner..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={{ minHeight: 82, textAlignVertical: "top", backgroundColor: colors.bgSubtle, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, color: colors.textPrimary, fontSize: 14, marginBottom: 16 }}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => setRescheduleTarget(null)} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submitReschedule} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>Send Request</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
