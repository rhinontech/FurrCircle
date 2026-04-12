import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Star, MapPin, Phone, Bookmark, Stethoscope } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { userDiscoverApi } from "../../services/users/discoverApi";

export default function SavedVetsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [vets, setVets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  const fetchSavedVets = async () => {
    try {
      const data = await userDiscoverApi.listSavedVets();
      setVets(data || []);
    } catch (e) {
      console.error("Failed to load saved vets", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchSavedVets();
  }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedVets();
  };

  const handleUnsave = (vet: any) => {
    Alert.alert("Remove Saved Vet", `Remove ${vet.clinic_name || vet.name} from saved vets?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          setUnsavingId(vet.id);
          try {
            await userDiscoverApi.unsaveVet(vet.id);
            setVets(prev => prev.filter(v => v.id !== vet.id));
          } catch (e: any) {
            Alert.alert("Error", e.message || "Could not remove saved vet.");
          } finally {
            setUnsavingId(null);
          }
        },
      },
    ]);
  };

  const handleCall = async (phone?: string) => {
    if (!phone) {
      Alert.alert("Phone unavailable", "This clinic does not have a phone number.");
      return;
    }
    const url = `tel:${phone.replace(/[^\d+]/g, "")}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) Linking.openURL(url);
    else Alert.alert("Unable to call", "Calling is not supported on this device.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Saved Veterinarians</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : vets.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 }}>
          <Bookmark size={48} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>No saved vets yet</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>Save vets from their profile page to find them quickly later.</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/discover")}
            style={{ marginTop: 8, backgroundColor: colors.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Discover Vets</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        >
          {vets.map((vet) => (
            <View key={vet.id} style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                {vet.avatar ? (
                  <Image source={{ uri: vet.avatar }} style={{ width: 56, height: 56, borderRadius: 16 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.infoBg ?? '#e0f2fe', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope size={24} color="#0ea5e9" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{vet.clinic_name || vet.name}</Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{vet.specialty || "General Veterinary Care"}</Text>
                  {vet.rating && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>{vet.rating}</Text>
                    </View>
                  )}
                </View>
                <Pressable
                  onPress={() => handleUnsave(vet)}
                  disabled={unsavingId === vet.id}
                  style={{ padding: 8 }}
                >
                  {unsavingId === vet.id
                    ? <ActivityIndicator size="small" color={colors.brand} />
                    : <Bookmark size={20} color={colors.brand} fill={colors.brand} />
                  }
                </Pressable>
              </View>

              {vet.city && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <MapPin size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>{vet.city}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => router.push(`/vets/${vet.id}`)}
                  style={{ flex: 1, backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>View Profile</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleCall(vet.phone)}
                  style={{ flex: 1, backgroundColor: colors.brand + '15', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  <Phone size={14} color={colors.brand} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.brand }}>Call</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
