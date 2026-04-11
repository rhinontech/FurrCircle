import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
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
} from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userAppointmentsApi } from "@/services/users/appointmentsApi";
import { vetAppointmentsApi } from "@/services/vets/appointmentsApi";
import { normalizeAppointment } from "@/services/shared/normalizers";

const STATUS_META: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fffbeb", Icon: AlertCircle },
  confirmed: { label: "Confirmed", color: "#10b981", bg: "#ecfdf5", Icon: CheckCircle },
  completed: { label: "Completed", color: "#6366f1", bg: "#eef2ff", Icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fef2f2", Icon: XCircle },
};

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
          style: newStatus === "cancelled" ? "destructive" : "default",
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
              Notes
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 21 }}>
              {appointment.notes}
            </Text>
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
      </ScrollView>
    </View>
  );
}
