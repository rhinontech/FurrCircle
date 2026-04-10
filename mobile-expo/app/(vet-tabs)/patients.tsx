import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Image, Pressable, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { Search, PawPrint } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useRouter } from "expo-router";
import StatusChip from "../../components/ui/StatusChip";
import { vetAppointmentsApi } from "@/services/vets/appointmentsApi";

const statusVariant = (s: string): "success" | "warning" | "info" | "danger" => {
  const status = (s || "").toLowerCase();
  if (status === "healthy") return "success";
  if (status.includes("vaccine") || status.includes("check")) return "warning";
  if (status.includes("medication")) return "info";
  return "danger";
};

export default function PatientsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const fetchPatients = useCallback(async () => {
    try {
      const patientsData = await vetAppointmentsApi.listPatients();
      setPatients(patientsData);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const filtered = patients.filter((p) =>
    p.name?.toLowerCase().includes(query.toLowerCase()) ||
    p.owner?.name?.toLowerCase().includes(query.toLowerCase())
  );

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
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>My Patients</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14 }}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              placeholder="Search by pet or owner..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              style={{ flex: 1, height: 48, marginLeft: 10, fontSize: 14, color: colors.textPrimary }}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {filtered.length === 0 ? (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <PawPrint size={36} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
                {patients.length === 0 ? "No patients yet — they appear once you have appointments." : "No results match your search."}
              </Text>
            </View>
          ) : filtered.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/pets/${p.id}` as any)}
              style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              {p.avatar_url ? (
                <Image source={{ uri: p.avatar_url }} style={{ width: 56, height: 56, borderRadius: 14 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                  <PawPrint size={26} color={colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{p.name}</Text>
                  <StatusChip label={p.healthStatus || p.species || 'Pet'} variant={statusVariant(p.healthStatus || '')} />
                </View>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{p.breed || p.species} · {p.owner?.name || 'Unknown Owner'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 }}>
                  {p.lastVisit && (
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Last: <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>{p.lastVisit}</Text>
                    </Text>
                  )}
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Visits: <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{p.visits}</Text>
                  </Text>
                  {p.nextVisit && (
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Next: <Text style={{ color: colors.brand, fontWeight: '500' }}>{p.nextVisit}</Text>
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
