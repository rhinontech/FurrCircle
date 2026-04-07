import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Pill, Clock, Plus } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

export default function MedsScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors } = useTheme();
  
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMeds = async () => {
    try {
      if (!petId) return;
      const data = await api.get(`/health/meds/${petId}`);
      setMeds(data);
    } catch (error) {
      console.error("Error fetching medications", error);
      Alert.alert("Error", "Could not load medication records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeds();
  }, [petId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeds();
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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}>Medications</Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {meds.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', opacity: 0.5 }}>
            <Pill size={48} color={colors.textMuted} strokeWidth={1} />
            <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14 }}>No weight medication found</Text>
          </View>
        ) : (
          meds.map((m) => (
            <View key={m.id} style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={26} color="#e11d48" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>{m.name}</Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{m.dosage}</Text>
                </View>
              </View>

              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Clock size={16} color={colors.textMuted} />
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{m.frequency}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: colors.borderSubtle }} />
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>Start Date: <Text style={{ fontWeight: '600' }}>{new Date(m.startDate).toLocaleDateString()}</Text></Text>
                </View>
              </View>

              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.borderSubtle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Duration: <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{m.endDate ? 'Until ' + new Date(m.endDate).toLocaleDateString() : 'Ongoing'}</Text></Text>
                <Pressable style={{ backgroundColor: colors.brand, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Log Dose</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable 
        onPress={() => {/* TODO: Add medication form */}}
        style={{ position: 'absolute', bottom: 40, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', elevation: 8 }}
      >
        <Plus size={24} color="#fff" />
      </Pressable>
    </View>
  );
}
