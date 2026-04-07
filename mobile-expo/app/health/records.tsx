import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, FileText, Calendar, ShieldAlert } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

export default function RecordsScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors } = useTheme();
  
  const [records, setRecords] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = async () => {
    try {
      if (!petId) return;
      const [recordsData, allergiesData] = await Promise.all([
        api.get(`/health/records/${petId}`),
        api.get(`/health/allergies/${petId}`),
      ]);
      setRecords(recordsData || []);
      setAllergies(allergiesData || []);
    } catch (error) {
      console.error("Error fetching medical records", error);
      Alert.alert("Error", "Could not load medical records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [petId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}>Records & Allergies</Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <Pressable
            onPress={() => petId && router.push(`/health/add-record?petId=${petId}` as any)}
            style={{ flex: 1, backgroundColor: colors.brand, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Add Record</Text>
          </Pressable>
          <Pressable
            onPress={() => petId && router.push(`/health/add-allergy?petId=${petId}` as any)}
            style={{ flex: 1, backgroundColor: colors.warningBg, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>Add Allergy</Text>
          </Pressable>
        </View>

        <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 }}>Known Allergies</Text>
          {allergies.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center', opacity: 0.6 }}>
              <ShieldAlert size={32} color={colors.textMuted} />
              <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 14 }}>No allergies added yet</Text>
            </View>
          ) : (
            allergies.map((allergy) => (
              <View key={allergy.id} style={{ backgroundColor: colors.bgSubtle, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{allergy.allergen}</Text>
                    {!!allergy.reaction && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{allergy.reaction}</Text>}
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: allergy.severity === 'severe' ? '#fee2e2' : allergy.severity === 'mild' ? '#dcfce7' : '#fef3c7' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'capitalize', color: allergy.severity === 'severe' ? '#b91c1c' : allergy.severity === 'mild' ? '#047857' : '#b45309' }}>
                      {allergy.severity}
                    </Text>
                  </View>
                </View>
                {!!allergy.notes && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 10 }}>{allergy.notes}</Text>}
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 10 }}>Logged {new Date(allergy.diagnosedAt).toLocaleDateString()}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 }}>Medical Timeline</Text>
        {records.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', opacity: 0.5 }}>
            <FileText size={48} color={colors.textMuted} strokeWidth={1} />
            <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14 }}>No medical records found</Text>
          </View>
        ) : (
          records.map((r, i) => (
            <View key={r.id} style={{ position: 'relative' }}>
              {i < records.length - 1 && (
                <View style={{ position: 'absolute', left: 24, top: 24, bottom: -24, width: 2, backgroundColor: colors.border }} />
              )}
              <View style={{ flexDirection: 'row', marginBottom: 24 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.heroBg, alignItems: 'center', justifyContent: 'center', zIndex: 1, borderWidth: 4, borderColor: colors.bg }}>
                  <FileText size={20} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 16, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, flex: 1, paddingRight: 12 }}>{r.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{new Date(r.date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{r.clinic_name || 'Generic Clinic'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                    <Calendar size={14} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>Vet: {r.veterinarian_name || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
