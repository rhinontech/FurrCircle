import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Pressable, Switch, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Syringe, Pill, Calendar, FileText, ChevronRight, Edit3, Heart, Home, PawPrint, ShieldAlert } from "lucide-react-native";
import StatusChip from "../../components/ui/StatusChip";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";

const statusVariant = (s: string) => {
  const status = s?.toLowerCase() || '';
  if (status.includes("healthy")) return "success" as const;
  if (status.includes("vaccine") || status.includes("due")) return "warning" as const;
  return "danger" as const;
};

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdoptionOpen, setIsAdoptionOpen] = useState(false);
  const [isFosterOpen, setIsFosterOpen] = useState(false);

  const fetchPet = async () => {
    try {
      const data = await api.get(`/pets/${id}`);
      setPet(data);
      setIsAdoptionOpen(data.isAdoptionOpen || false);
      setIsFosterOpen(data.isFosterOpen || false);
    } catch (error) {
      console.error("Error fetching pet details", error);
      Alert.alert("Error", "Could not load pet details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPet();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPet();
  };

  const handleToggleListing = async (type: "adoption" | "foster", value: boolean) => {
    try {
      const payload = type === "adoption" ? { isAdoptionOpen: value } : { isFosterOpen: value };
      const updatedPet = await api.patch(`/pets/${id}/listing`, payload);
      if (type === "adoption") setIsAdoptionOpen(updatedPet.isAdoptionOpen);
      else setIsFosterOpen(updatedPet.isFosterOpen);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update listing status.");
      // Revert local state
      if (type === "adoption") setIsAdoptionOpen(!value);
      else setIsFosterOpen(!value);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 18, textAlign: 'center' }}>Pet not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20, padding: 12, backgroundColor: colors.bgSubtle }}>
          <Text style={{ color: colors.brand }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.bg }} 
      contentContainerStyle={{ paddingBottom: 80 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      {/* Header */}
      <View style={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Pet Profile</Text>
        </View>
        <Pressable 
          onPress={() => router.push(`/pets/add?id=${id}`)}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}
        >
          <Edit3 size={18} color={colors.brand} />
        </Pressable>
      </View>

      {/* Hero */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{ backgroundColor: colors.heroBg, borderRadius: 28, padding: 20, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {pet.avatar_url ? (
              <Image source={{ uri: pet.avatar_url }} style={{ width: 96, height: 96, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }} resizeMode="cover" />
            ) : (
              <View style={{ width: 96, height: 96, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <PawPrint size={48} color="#fff" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>{pet.name}</Text>
                <StatusChip label={pet.healthStatus || 'Healthy'} variant={statusVariant(pet.healthStatus) as any} />
              </View>
              <Text style={{ fontSize: 14, color: colors.heroSub }}>{pet.breed} · {pet.species}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 24, marginTop: 16 }}>
            <View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Age</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{pet.age || 'N/A'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Weight</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{pet.weight || 'N/A'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Gender</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{pet.gender || 'Unknown'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Public Status Toggles */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Public Listings</Text>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingRight: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={20} color={isAdoptionOpen ? colors.brand : colors.textMuted} fill={isAdoptionOpen ? colors.brand : 'transparent'} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Open for Adoption</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Make pet profile public for permanent adoption</Text>
              </View>
            </View>
            <Switch 
              value={isAdoptionOpen} 
              onValueChange={(val) => handleToggleListing("adoption", val)} 
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor="#fff"
            />
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingRight: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                <Home size={20} color={isFosterOpen ? colors.brand : colors.textMuted} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Open for Foster</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Looking for temporary caregivers in your city</Text>
              </View>
            </View>
            <Switch 
              value={isFosterOpen} 
              onValueChange={(val) => handleToggleListing("foster", val)} 
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor="#fff"
            />
          </View>

          {(isAdoptionOpen || isFosterOpen) && (
            <View style={{ marginTop: 8, padding: 12, backgroundColor: colors.infoBg + '40', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: colors.brand }}>
              <Text style={{ fontSize: 11, color: colors.textPrimary, fontWeight: '500' }}>Your pet is now listed in the Discover feed. Potential caretakers can contact you through the app.</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        {[
          { icon: Syringe, label: "Vaccines", color: "#10b981", bg: colors.successBg, path: `/health/vaccines?petId=${id}` },
          { icon: Pill, label: "Meds", color: "#0ea5e9", bg: colors.infoBg, path: `/health/meds?petId=${id}` },
          { icon: Heart, label: "Vitals", color: "#ec4899", bg: colors.warningBg, path: `/health/vitals?petId=${id}` },
          { icon: FileText, label: "Records", color: "#8b5cf6", bg: colors.bgSubtle, path: `/health/records?petId=${id}` },
        ].map(({ icon: Icon, label, color, bg, path }) => (
          <Pressable 
            key={label} 
            onPress={() => path && router.push(path as any)}
            style={{ flex: 1, backgroundColor: bg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', paddingVertical: 12, gap: 6 }}
          >
            <Icon size={20} color={color} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Vaccines */}
      {pet.Vaccines && pet.Vaccines.length > 0 ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Vaccine Tracker</Text>
          {pet.Vaccines.map((v: any) => (
            <View key={v.id} style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: v.status?.toLowerCase() === 'done' ? colors.successBg : colors.warningBg, alignItems: 'center', justifyContent: 'center' }}>
                <Syringe size={18} color={v.status?.toLowerCase() === 'done' ? '#047857' : '#b45309'} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{v.name}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{v.lastVaccinationDate || v.nextDueDate}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: v.status?.toLowerCase() === 'done' ? colors.successBg : colors.warningBg }}>
                <Text style={{ fontSize: 11, fontWeight: '600', textTransform: 'capitalize', color: v.status?.toLowerCase() === 'done' ? '#047857' : '#b45309' }}>{v.status}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Medications */}
      {pet.Medications && pet.Medications.length > 0 ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Medications</Text>
          {pet.Medications.map((m: any) => (
            <View key={m.id} style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.infoBg, alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={18} color="#0369a1" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{m.name}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{m.dosage} · {m.frequency}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </View>
          ))}
        </View>
      ) : null}

      {/* Allergies */}
      {pet.Allergies && pet.Allergies.length > 0 ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Known Allergies</Text>
          {pet.Allergies.map((allergy: any) => (
            <View key={allergy.id} style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={18} color="#b45309" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>{allergy.allergen}</Text>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: allergy.severity === 'severe' ? '#fee2e2' : allergy.severity === 'mild' ? colors.successBg : colors.warningBg }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'capitalize', color: allergy.severity === 'severe' ? '#b91c1c' : allergy.severity === 'mild' ? '#047857' : '#b45309' }}>
                      {allergy.severity}
                    </Text>
                  </View>
                </View>
                {!!allergy.reaction && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{allergy.reaction}</Text>}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Appointments */}
      {pet.Appointments && pet.Appointments.length > 0 ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Upcoming Appointments</Text>
          {pet.Appointments.map((a: any) => (
            <View key={a.id} style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} color="#f59e0b" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{a.reason || 'Vet Visit'}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{new Date(a.appointment_date).toLocaleDateString()} · {a.appointment_time}</Text>
              </View>
              <StatusChip label={a.status} variant={a.status === 'confirmed' ? 'success' : 'warning'} />
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
