import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { CalendarDays, PawPrint, Star, Clock, ChevronRight, CheckCircle, AlertCircle } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import StatusChip from "../../components/ui/StatusChip";
import { api } from "../../services/api";

export default function VetDashboard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [stats, setStats] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, apptsData] = await Promise.all([
        api.get("/appointments/vet/stats"),
        api.get("/appointments/vet")
      ]);
      
      const mappedStats = [
        { label: "Today's Appts", value: String(statsData.todayAppointments || 0), icon: CalendarDays, color: "#0ea5e9" },
        { label: "Total Patients", value: String(statsData.totalPatients || 0), icon: PawPrint, color: "#10b981" },
        { label: "Avg Rating", value: String(statsData.avgRating || 4.8), icon: Star, color: "#f59e0b" },
        { label: "Pending", value: String(statsData.pendingAppointments || 0), icon: Clock, color: "#f43f5e" },
      ];
      
      setStats(mappedStats);
      
      // Filter for today's appointments only for the dashboard summary
      const todayStr = new Date().toISOString().split('T')[0];
      const todayAppts = (apptsData || []).filter((a: any) => a.date === todayStr);
      setAppointments(todayAppts);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {/* Greeting */}
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Good morning 👋</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary }}>
            {user?.name || "Dr. James Wilson"}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
            {user?.clinic_name || "PetCare Clinic"} · {user?.specialty || "Veterinarian"}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {stats.map((s) => (
            <View key={s.label} style={{ width: '47%', backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
              <s.icon size={22} color={s.color} />
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginTop: 10 }}>{s.value}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>Today's Schedule</Text>
            <Text style={{ fontSize: 14, color: colors.brand, fontWeight: '500' }}>View all</Text>
          </View>
          
          {appointments.length === 0 ? (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <CalendarDays size={32} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>No appointments for today</Text>
            </View>
          ) : appointments.map((appt) => (
            <Pressable key={appt.id} style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              {appt.pet?.avatar_url ? (
                <Image source={{ uri: appt.pet.avatar_url }} style={{ width: 48, height: 48, borderRadius: 14 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                  <PawPrint size={24} color={colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{appt.pet?.name || "Pet"}</Text>
                  <StatusChip label={appt.pet?.species || "Other"} variant="info" />
                </View>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{appt.owner?.name || "Unknown Owner"}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Clock size={12} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{appt.time}</Text>
                </View>
              </View>
              {appt.status === 'confirmed' || appt.status === 'completed'
                ? <CheckCircle size={20} color="#10b981" />
                : <AlertCircle size={20} color="#f59e0b" />
              }
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
