import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, CalendarDays, Clock, PawPrint } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import StatusChip from "../../components/ui/StatusChip";
import { vetAppointmentsApi } from "@/services/vets/appointmentsApi";

const statusVariant = (status: string): "success" | "warning" | "info" | "danger" => {
  const value = String(status || "").toLowerCase();
  if (value === "confirmed") return "success";
  if (value === "pending") return "warning";
  if (value === "completed") return "info";
  return "danger";
};

export default function VetAppointmentHistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setAppointments(await vetAppointmentsApi.listAppointments());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const history = useMemo(
    () => appointments
      .filter((item) => ["completed", "cancelled", "done"].includes(String(item.status || "").toLowerCase()))
      .sort((a, b) => `${b.date || ""} ${b.time || ""}`.localeCompare(`${a.date || ""} ${a.time || ""}`)),
    [appointments]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Appointment History</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brand} />}
        >
          {history.length === 0 ? (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 28, alignItems: "center", gap: 10 }}>
              <CalendarDays size={34} color={colors.textMuted} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>No past appointments</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>Completed and cancelled visits will appear here.</Text>
            </View>
          ) : history.map((appt) => (
            <Pressable key={appt.id} onPress={() => router.push(`/appointments/${appt.id}` as any)} style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {appt.pet?.avatar_url ? (
                  <Image source={{ uri: appt.pet.avatar_url }} style={{ width: 48, height: 48, borderRadius: 14 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                    <PawPrint size={22} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>{appt.pet?.name || "Pet"}</Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{appt.owner?.name || "Owner"} · {appt.reason || "Visit"}</Text>
                </View>
                <StatusChip label={String(appt.status || "Done")} variant={statusVariant(appt.status)} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Clock size={14} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{appt.date || appt.appointment_date || "--"} · {appt.time || appt.appointment_time || "--"}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
