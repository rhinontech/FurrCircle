import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, PawPrint, Search } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import StatusChip from "../../components/ui/StatusChip";
import { vetAppointmentsApi } from "@/services/vets/appointmentsApi";

const statusVariant = (status: string): "success" | "warning" | "info" | "danger" => {
  const value = String(status || "").toLowerCase();
  if (value === "healthy") return "success";
  if (value.includes("vaccine") || value.includes("check")) return "warning";
  if (value.includes("medication")) return "info";
  return "danger";
};

export default function VetProfilePatientsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      setPatients(await vetAppointmentsApi.listPatients());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter((patient) =>
    patient.name?.toLowerCase().includes(query.toLowerCase()) ||
    patient.owner?.name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>All Patients</Text>
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
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, marginBottom: 16 }}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              placeholder="Search by pet or owner..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              style={{ flex: 1, height: 48, marginLeft: 10, fontSize: 14, color: colors.textPrimary }}
            />
          </View>

          {filtered.length === 0 ? (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
              <PawPrint size={36} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14, textAlign: "center" }}>
                {patients.length === 0 ? "No patients yet. They appear once you have appointments." : "No results match your search."}
              </Text>
            </View>
          ) : filtered.map((patient) => (
            <Pressable
              key={patient.id}
              onPress={() => router.push(`/pets/${patient.id}` as any)}
              style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 12 }}
            >
              {patient.avatar_url ? (
                <Image source={{ uri: patient.avatar_url }} style={{ width: 56, height: 56, borderRadius: 14 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                  <PawPrint size={26} color={colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>{patient.name}</Text>
                  <StatusChip label={patient.healthStatus || patient.species || "Pet"} variant={statusVariant(patient.healthStatus || "")} />
                </View>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{patient.breed || patient.species} · {patient.owner?.name || "Unknown Owner"}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 6 }}>
                  {patient.lastVisit && (
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Last: <Text style={{ color: colors.textSecondary, fontWeight: "500" }}>{patient.lastVisit}</Text>
                    </Text>
                  )}
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Visits: <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>{patient.visits}</Text>
                  </Text>
                  {patient.nextVisit && (
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Next: <Text style={{ color: colors.brand, fontWeight: "500" }}>{patient.nextVisit}</Text>
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
