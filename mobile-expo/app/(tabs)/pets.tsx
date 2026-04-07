import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Plus, PawPrint } from "lucide-react-native";
import StatusChip from "../../components/ui/StatusChip";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

const statusVariant = (s: string) => {
  const status = s?.toLowerCase() || '';
  if (status.includes("healthy")) return "success" as const;
  if (status.includes("vaccine") || status.includes("due")) return "warning" as const;
  return "info" as const;
};

export default function PetsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPets = async () => {
    try {
      const data = await api.get('/pets');
      setPets(data);
    } catch (error) {
      console.error("Error fetching pets", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPets();
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
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>My Pets</Text>
          <Pressable
            onPress={() => router.push("/pets/add")}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {pets.length === 0 ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <PawPrint size={40} color={colors.textMuted} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>No pets added yet</Text>
              <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>Add your first fluffy friend to get started!</Text>
            </View>
          ) : (
            pets.map((pet) => (
              <Pressable
                key={pet.id}
                onPress={() => router.push(`/pets/${pet.id}`)}
                style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
              >
                {pet.avatar_url ? (
                  <Image source={{ uri: pet.avatar_url }} style={{ width: 64, height: 64, borderRadius: 16 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                    <PawPrint size={32} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginRight: 8 }}>{pet.name}</Text>
                    <StatusChip label={pet.healthStatus || 'Healthy'} variant={statusVariant(pet.healthStatus)} />
                  </View>
                  <Text style={{ fontSize: 14, color: colors.textMuted }}>{pet.breed} · {pet.age || (pet.birth_date ? 'Born ' + pet.birth_date : 'Unknown age')}</Text>
                  {/* We could fetch real reminder counts if we had a counts endpoint, but for now we'll just show it if data exists */}
                  {pet.reminderCount > 0 ? (
                    <Text style={{ fontSize: 12, color: '#f59e0b', fontWeight: '500', marginTop: 4 }}>
                      {pet.reminderCount} upcoming reminder{pet.reminderCount > 1 ? "s" : ""}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
