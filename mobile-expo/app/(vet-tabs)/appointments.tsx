import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { Clock, CheckCircle, XCircle, AlertCircle, PawPrint, CalendarDays } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import StatusChip from "../../components/ui/StatusChip";
import { api } from "../../services/api";

const tabs = ["Upcoming", "Past"];

const statusIcon = (s: string) => {
  if (s === 'confirmed') return <CheckCircle size={18} color="#10b981" />;
  if (s === 'pending') return <AlertCircle size={18} color="#f59e0b" />;
  if (s === 'done' || s === 'completed') return <CheckCircle size={18} color="#64748b" />;
  return <XCircle size={18} color="#f43f5e" />;
};

const statusVariant = (s: string): "success" | "warning" | "info" | "danger" => {
  if (s === 'confirmed') return 'success';
  if (s === 'pending') return 'warning';
  if (s === 'done' || s === 'completed') return 'info';
  return 'danger';
};

export default function AppointmentsScreen() {
  const { colors } = useTheme();
  const [active, setActive] = useState("Upcoming");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await api.get('/appointments/vet');
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

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      // Update local state
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update appointment");
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
            <Pressable key={appt.id} style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, opacity: updating === appt.id ? 0.7 : 1 }}>
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
                <StatusChip label={appt.status.charAt(0).toUpperCase() + appt.status.slice(1)} variant={statusVariant(appt.status)} />
              </View>

              {appt.reason && (
                <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 10, padding: 10, marginTop: 10 }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>📋 <Text style={{ fontWeight: '600' }}>Reason:</Text> {appt.reason}</Text>
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
                    onPress={() => handleUpdateStatus(appt.id, 'cancelled')}
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
                    onPress={() => handleUpdateStatus(appt.id, 'cancelled')}
                    disabled={updating === appt.id}
                    style={{ flex: 1, backgroundColor: '#fff1f2', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#e11d48' }}>✕ Cancel</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
