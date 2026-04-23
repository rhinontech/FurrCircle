import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Calendar,
  Clock,
  PawPrint,
  Stethoscope,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userAppointmentsApi } from "@/services/users/appointmentsApi";
import { vetAppointmentsApi } from "@/services/vets/appointmentsApi";
import { normalizeAppointment } from "@/services/shared/normalizers";
import AppointmentDateTimePicker from "@/components/AppointmentDateTimePicker";

const STATUS_META: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fffbeb", Icon: AlertCircle },
  confirmed: { label: "Confirmed", color: "#10b981", bg: "#ecfdf5", Icon: CheckCircle },
  completed: { label: "Completed", color: "#6366f1", bg: "#eef2ff", Icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fef2f2", Icon: XCircle },
  reschedule_requested: { label: "Reschedule Requested", color: "#0ea5e9", bg: "#eff6ff", Icon: Clock },
};
const DECLINE_REASONS = ["Unavailable time slot", "On leave", "Personal reason", "Emergency schedule change"];

const formatDate = (date?: string) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
};

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isVet = user?.role === "veterinarian";

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const fetchAppointment = useCallback(async () => {
    if (!id) return;
    try {
      // Fetch the right list and find by id
      let list: any[] = [];
      if (isVet) {
        list = await vetAppointmentsApi.listAppointments();
      } else {
        list = await userAppointmentsApi.listOwnerAppointments();
      }
      const found = list.find((a: any) => a.id === id);
      setAppointment(found || null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [id, isVet]);

  useFocusEffect(
    useCallback(() => {
      fetchAppointment();
    }, [fetchAppointment])
  );

  const handleVetAction = async (newStatus: "confirmed" | "cancelled" | "completed") => {
    if (newStatus === "cancelled") {
      setDeclineReason("");
      setShowDeclineModal(true);
      return;
    }

    const labels: Record<string, string> = {
      confirmed: "Confirm",
      cancelled: "Cancel",
      completed: "Mark Complete",
    };
    Alert.alert(
      `${labels[newStatus]} Appointment`,
      `Are you sure you want to ${labels[newStatus].toLowerCase()} this appointment?`,
      [
        { text: "No" },
        {
          text: "Yes",
          style: "default",
          onPress: async () => {
            setUpdating(true);
            try {
              await vetAppointmentsApi.updateStatus(id!, newStatus);
              setAppointment((prev: any) => ({ ...prev, status: newStatus }));
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to update appointment");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const openRescheduleModal = () => {
    setRescheduleDate(appointment?.proposedDate || appointment?.date || "");
    setRescheduleTime(appointment?.proposedTime || appointment?.time || "");
    setRescheduleReason(appointment?.rescheduleReason || "");
    setShowRescheduleModal(true);
  };

  const submitReschedule = async () => {
    if (!rescheduleDate.trim() || !rescheduleTime.trim()) {
      Alert.alert("Date and time required", "Please enter the new appointment date and time.");
      return;
    }

    setShowRescheduleModal(false);
    setUpdating(true);
    try {
      const payload = {
        date: rescheduleDate.trim(),
        time: rescheduleTime.trim(),
        reason: rescheduleReason.trim(),
      };
      const updated = isVet
        ? await vetAppointmentsApi.requestReschedule(id!, payload)
        : await userAppointmentsApi.respondReschedule(id!, { action: "counter", ...payload });
      setAppointment((prev: any) => ({ ...prev, ...updated }));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to request reschedule");
    } finally {
      setUpdating(false);
    }
  };

  const acceptReschedule = async () => {
    setUpdating(true);
    try {
      const updated = isVet
        ? await vetAppointmentsApi.respondReschedule(id!, { action: "accept" })
        : await userAppointmentsApi.respondReschedule(id!, { action: "accept" });
      setAppointment((prev: any) => ({ ...prev, ...updated }));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to accept reschedule");
    } finally {
      setUpdating(false);
    }
  };

  const cancelFromReschedule = async () => {
    Alert.alert(
      "Cancel Appointment",
      "Cancel this appointment instead of accepting the new time?",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Appointment",
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            try {
              const updated = isVet
                ? await vetAppointmentsApi.respondReschedule(id!, { action: "cancel", reason: "Cancelled during reschedule" })
                : await userAppointmentsApi.respondReschedule(id!, { action: "cancel", reason: "Owner cancelled during reschedule" });
              setAppointment((prev: any) => ({ ...prev, ...updated }));
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to cancel appointment");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const submitVetDecline = async () => {
    const reason = declineReason.trim();
    if (!reason) {
      Alert.alert("Reason required", "Please choose or type a reason so the owner knows why.");
      return;
    }

    setShowDeclineModal(false);
    setUpdating(true);
    try {
      await vetAppointmentsApi.updateStatus(id!, "cancelled", reason);
      setAppointment((prev: any) => ({ ...prev, status: "cancelled", notes: reason }));
      setDeclineReason("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update appointment");
    } finally {
      setUpdating(false);
    }
  };

  const handleOwnerCancel = async () => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No" },
        {
          text: "Cancel Appointment",
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            try {
              await userAppointmentsApi.cancelAppointment(id!);
              setAppointment((prev: any) => ({ ...prev, status: "cancelled" }));
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to cancel appointment");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ paddingTop: 16, paddingHorizontal: 20 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Calendar size={48} color={colors.textMuted} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
            Appointment not found
          </Text>
        </View>
      </View>
    );
  }

  const statusMeta = STATUS_META[appointment.status] || STATUS_META.pending;
  const StatusIcon = statusMeta.Icon;
  const pet = appointment.pet;
  const vet = appointment.vet || appointment.veterinarian;
  const owner = appointment.owner;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: "700",
            color: colors.textPrimary,
            textAlign: "center",
            marginRight: 40,
          }}
        >
          Appointment
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 }}>
        {/* Status banner */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            padding: 16,
            borderRadius: 16,
            backgroundColor: isDark ? statusMeta.color + "20" : statusMeta.bg,
            marginBottom: 20,
          }}
        >
          <StatusIcon size={22} color={statusMeta.color} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: statusMeta.color }}>
              {statusMeta.label}
            </Text>
            <Text style={{ fontSize: 13, color: statusMeta.color + "cc", marginTop: 2 }}>
              {appointment.status === "pending"
                ? "Waiting for vet confirmation"
                : appointment.status === "confirmed"
                ? "Appointment is confirmed"
                : appointment.status === "completed"
                ? "This appointment is done"
                : appointment.status === "reschedule_requested"
                ? "Waiting for reschedule response"
                : "This appointment was cancelled"}
            </Text>
          </View>
        </View>

        {/* Date & Time */}
        <View
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Date & Time
          </Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Calendar size={18} color={colors.brand} />
              <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: "600" }}>
                {formatDate(appointment.date)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Clock size={18} color={colors.brand} />
              <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: "600" }}>
                {appointment.time || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Pet */}
        {pet && (
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Pet
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {pet.avatar_url ? (
                <Image
                  source={{ uri: pet.avatar_url }}
                  style={{ width: 52, height: 52, borderRadius: 14 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: colors.bgSubtle,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PawPrint size={24} color={colors.textMuted} />
                </View>
              )}
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
                  {pet.name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {[pet.species, pet.breed].filter(Boolean).join(" · ")}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Vet (shown to owner) */}
        {!isVet && vet && (
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Veterinarian
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {vet.avatar_url ? (
                <Image
                  source={{ uri: vet.avatar_url }}
                  style={{ width: 52, height: 52, borderRadius: 14 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: colors.bgSubtle,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Stethoscope size={24} color={colors.textMuted} />
                </View>
              )}
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
                  {vet.name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {vet.hospital_name || vet.clinic_name || vet.email || ""}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Owner (shown to vet) */}
        {isVet && owner && (
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Owner
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {owner.avatar_url ? (
                <Image
                  source={{ uri: owner.avatar_url }}
                  style={{ width: 52, height: 52, borderRadius: 14 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: colors.bgSubtle,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={24} color={colors.textMuted} />
                </View>
              )}
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
                  {owner.name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {owner.email || ""}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Reason */}
        {appointment.reason && (
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <FileText size={16} color={colors.textMuted} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Reason
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 21 }}>
              {appointment.reason}
            </Text>
          </View>
        )}

        {/* Notes */}
        {appointment.notes && (
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {appointment.status === "cancelled" ? "Cancellation Reason" : "Notes"}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 21 }}>
              {appointment.notes}
            </Text>
          </View>
        )}

        {appointment.status === "reschedule_requested" && (
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Proposed New Time
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>
              {formatDate(appointment.proposedDate)} · {appointment.proposedTime || "—"}
            </Text>
            {!!appointment.rescheduleReason && (
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginTop: 8 }}>
                {appointment.rescheduleReason}
              </Text>
            )}
          </View>
        )}

        {/* Actions */}
        {updating && (
          <ActivityIndicator size="small" color={colors.brand} style={{ marginBottom: 16 }} />
        )}

        {/* Vet actions */}
        {isVet && appointment.status === "pending" && !updating && (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={() => handleVetAction("confirmed")}
              style={{
                backgroundColor: "#10b981",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                Confirm Appointment
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleVetAction("cancelled")}
              style={{
                backgroundColor: colors.bgCard,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#ef4444",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#ef4444" }}>
                Decline
              </Text>
            </Pressable>
          </View>
        )}

        {isVet && appointment.status === "confirmed" && !updating && (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={() => handleVetAction("completed")}
              style={{
                backgroundColor: "#6366f1",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                Mark as Completed
              </Text>
            </Pressable>
            <Pressable
              onPress={openRescheduleModal}
              style={{
                backgroundColor: colors.bgCard,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#2563eb",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#2563eb" }}>
                Reschedule
              </Text>
            </Pressable>
          </View>
        )}

        {isVet && appointment.status === "reschedule_requested" && appointment.rescheduleRequestedBy === "owner" && !updating && (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={acceptReschedule}
              style={{ backgroundColor: "#10b981", borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Accept New Time</Text>
            </Pressable>
            <Pressable
              onPress={openRescheduleModal}
              style={{ backgroundColor: colors.bgCard, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#2563eb" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#2563eb" }}>Suggest Another Time</Text>
            </Pressable>
          </View>
        )}

        {isVet && appointment.status === "reschedule_requested" && appointment.rescheduleRequestedBy === "vet" && !updating && (
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
            Waiting for the owner to respond to your reschedule request.
          </Text>
        )}

        {/* Owner cancel action */}
        {!isVet && ["pending", "confirmed"].includes(appointment.status) && !updating && (
          <Pressable
            onPress={handleOwnerCancel}
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#ef4444",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#ef4444" }}>
              Cancel Appointment
            </Text>
          </Pressable>
        )}

        {!isVet && appointment.status === "reschedule_requested" && appointment.rescheduleRequestedBy === "vet" && !updating && (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={acceptReschedule}
              style={{ backgroundColor: "#10b981", borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Accept New Time</Text>
            </Pressable>
            <Pressable
              onPress={openRescheduleModal}
              style={{ backgroundColor: colors.bgCard, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#2563eb" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#2563eb" }}>Suggest Another Time</Text>
            </Pressable>
            <Pressable
              onPress={cancelFromReschedule}
              style={{ backgroundColor: colors.bgCard, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#ef4444" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#ef4444" }}>Cancel Appointment</Text>
            </Pressable>
          </View>
        )}

        {!isVet && appointment.status === "reschedule_requested" && appointment.rescheduleRequestedBy === "owner" && !updating && (
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
            Waiting for the vet to accept your suggested time.
          </Text>
        )}
      </ScrollView>

      <Modal visible={showDeclineModal} transparent animationType="slide" onRequestClose={() => setShowDeclineModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary }}>Reason for decline</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20, marginTop: 6, marginBottom: 16 }}>
              The owner will see this reason in their notification and appointment details.
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {DECLINE_REASONS.map((reason) => {
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
              <Pressable onPress={() => setShowDeclineModal(false)} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submitVetDecline} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>Decline</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showRescheduleModal} transparent animationType="slide" onRequestClose={() => setShowRescheduleModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary }}>
              {isVet ? "Reschedule appointment" : "Suggest another time"}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20, marginTop: 6, marginBottom: 16 }}>
              {isVet ? "The owner will get a notification and can respond." : "The vet will get your suggested date and time."}
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
              <Pressable onPress={() => setShowRescheduleModal(false)} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSecondary }}>Close</Text>
              </Pressable>
              <Pressable onPress={submitReschedule} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
