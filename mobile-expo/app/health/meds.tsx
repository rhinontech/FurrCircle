import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert, Image } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { ChevronLeft, Pill, Clock, Plus, Trash2 } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { userHealthApi } from "@/services/users/healthApi";

export default function MedsScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors } = useTheme();
  
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMeds = async () => {
    try {
      if (!petId) return;
      const data = await userHealthApi.listMedications(String(petId));
      setMeds(data);
    } catch (error) {
      console.error("Error fetching medications", error);
      Alert.alert("Error", "Could not load medication records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMeds();
    }, [petId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeds();
  };

  const handleDelete = (med: any) => {
    Alert.alert(
      "Delete Medication",
      `Delete ${med.name || "this medication"} from records?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!petId) return;
            setDeletingId(med.id);
            try {
              await userHealthApi.deleteMedication(String(petId), med.id);
              setMeds(prev => prev.filter(item => item.id !== med.id));
            } catch (error: any) {
              Alert.alert("Error", error.message || "Could not delete medication.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
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
            <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14 }}>No medications found</Text>
          </View>
        ) : (
          meds.map((m) => (
            <View key={m.id} style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 }}>
              {m.imageUrl ? (
                <Image source={{ uri: m.imageUrl }} style={{ width: "100%", height: 180, borderRadius: 16, marginBottom: 16, backgroundColor: colors.bgSubtle }} resizeMode="cover" />
              ) : null}
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={26} color="#e11d48" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>{m.name}</Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{m.dosage}</Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(m)}
                  disabled={deletingId === m.id}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center', opacity: deletingId === m.id ? 0.55 : 1 }}
                >
                  {deletingId === m.id ? <ActivityIndicator size="small" color="#e11d48" /> : <Trash2 size={18} color="#e11d48" />}
                </Pressable>
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

              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Duration: <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{m.endDate ? 'Until ' + new Date(m.endDate).toLocaleDateString() : 'Ongoing'}</Text></Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={() => petId && router.push(`/health/add-med?petId=${petId}` as any)}
        style={{ position: 'absolute', bottom: 40, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', elevation: 8 }}
      >
        <Plus size={24} color="#fff" />
      </Pressable>
    </View>
  );
}
