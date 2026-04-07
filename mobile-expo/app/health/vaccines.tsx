import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ShieldCheck, Download, Plus } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import StatusChip from "../../components/ui/StatusChip";
import { api } from "../../services/api";

export default function VaccinesScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors } = useTheme();
  
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVaccines = async () => {
    try {
      if (!petId) return;
      const data = await api.get(`/health/vaccines/${petId}`);
      setVaccines(data);
    } catch (error) {
      console.error("Error fetching vaccines", error);
      Alert.alert("Error", "Could not load vaccination records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, [petId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVaccines();
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
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}>Vaccinations</Text>
        <Pressable
          onPress={() => petId && router.push(`/health/add-vaccine?petId=${petId}` as any)}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {vaccines.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', opacity: 0.5 }}>
            <ShieldCheck size={48} color={colors.textMuted} strokeWidth={1} />
            <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14 }}>No vaccination records found</Text>
          </View>
        ) : (
          vaccines.map((v) => (
            <View key={v.id} style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.infoBg, alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={24} color="#0ea5e9" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{v.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Certificate ID: {v.id.substring(0, 8)}</Text>
                  </View>
                </View>
                <StatusChip 
                  label={v.status || 'Active'} 
                  variant={v.status?.toLowerCase() === 'done' ? 'success' : v.status?.toLowerCase() === 'due' ? 'warning' : 'info'} 
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 24, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' }}>Last Dose</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 4 }}>
                    {v.lastVaccinationDate ? new Date(v.lastVaccinationDate).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' }}>Next Due</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: v.status?.toLowerCase() === 'due' ? '#f59e0b' : colors.textSecondary, marginTop: 4 }}>
                    {v.nextDueDate ? new Date(v.nextDueDate).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>

              <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, backgroundColor: colors.bgSubtle, borderRadius: 10, marginTop: 12 }}>
                <Download size={14} color={colors.textSecondary} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Download Certificate</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
