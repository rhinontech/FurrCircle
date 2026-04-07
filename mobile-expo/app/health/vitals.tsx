import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Dimensions, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, TrendingUp, Activity, Weight, Heart, Thermometer, Plus } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

const { width } = Dimensions.get("window");

const getIcon = (type: string) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('weight')) return Weight;
  if (t.includes('heart')) return Heart;
  if (t.includes('temp')) return Thermometer;
  return Activity;
};

const getColor = (type: string) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('weight')) return "#0ea5e9";
  if (t.includes('heart')) return "#f43f5e";
  if (t.includes('temp')) return "#f59e0b";
  return "#10b981";
};

export default function VitalsScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const { colors } = useTheme();
  
  const [vitals, setVitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVitals = async () => {
    try {
      if (!petId) return;
      const data = await api.get(`/health/vitals/${petId}`);
      setVitals(data);
    } catch (error) {
      console.error("Error fetching vitals", error);
      Alert.alert("Error", "Could not load health vitals.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, [petId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVitals();
  };

  // Group latest vitals by type
  const latestVitals = vitals.reduce((acc: any, curr: any) => {
    if (!acc[curr.type] || new Date(curr.timestamp) > new Date(acc[curr.type].timestamp)) {
      acc[curr.type] = curr;
    }
    return acc;
  }, {});

  const overviewStats = Object.values(latestVitals).map((v: any) => ({
    label: v.type.charAt(0).toUpperCase() + v.type.slice(1),
    value: `${v.value} ${v.unit || ''}`,
    icon: getIcon(v.type),
    color: getColor(v.type),
    timestamp: new Date(v.timestamp).toLocaleDateString()
  }));

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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}>Pet Vitals</Text>
        <Pressable
          onPress={() => petId && router.push(`/health/add-vital?petId=${petId}` as any)}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 24, marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Current Overview</Text>
          
          {overviewStats.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>No vital records yet</Text>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              {overviewStats.map((s: any) => {
                const Icon = s.icon;
                return (
                  <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={24} color={s.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={{ fontSize: 14, color: colors.textMuted }}>{s.label}</Text>
                      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}>{s.value}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>{s.timestamp}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>History Logs</Text>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 12 }}>
          {vitals.length === 0 ? (
             <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 20 }}>Detailed history will appear here</Text>
          ) : (
            vitals.slice(0, 10).map((v: any) => (
              <View key={v.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{v.type.charAt(0).toUpperCase() + v.type.slice(1)}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{new Date(v.timestamp).toLocaleDateString()} · {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.brand }}>{v.value} {v.unit}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
