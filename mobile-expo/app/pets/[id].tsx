import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Image, Pressable, Switch, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Syringe, Pill, Calendar, FileText, ChevronRight, Edit3, Heart, Home, PawPrint, ShieldAlert, Camera } from "@/components/ui/IconCompat";
import StatusChip from "../../components/ui/StatusChip";
import { useTheme } from "../../contexts/ThemeContext";
import { userPetsApi } from "@/services/users/petsApi";
import { useAuth } from "../../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { G, Path } from "react-native-svg";

const CustomPawPrint = ({ size = 20, color = "currentColor", style }: { size?: number, color?: string, style?: any }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" style={style}>
    <G transform="translate(0 0)">
      <Path d="M 9.076 0 L 39.965 9.076 L 30.889 39.965 L 0 30.889 Z" fill="transparent" />
      <Path d="M 23.678 21.861 C 22.096 19.14 18.662 18.131 15.859 19.563 L 9.833 22.637 C 6.409 24.3 6.979 29.569 10.682 30.457 C 12.676 30.986 14.581 30.444 16.708 31.111 C 18.934 31.723 20.318 33.1 22.255 33.858 C 25.817 34.994 29.035 30.895 27.079 27.704 L 23.678 21.86 Z M 33.722 17.691 C 31.985 16.787 29.973 18.425 29.087 20.083 C 26.38 25.228 31.373 27.828 34.172 22.888 C 35.346 20.764 35.148 18.477 33.722 17.691 Z M 25.04 18.349 C 26.874 18.888 28.978 17.241 29.73 14.683 C 31.356 8.471 25.072 6.624 23.084 12.73 C 22.332 15.288 23.211 17.812 25.04 18.349 Z M 12.271 15.142 C 12.428 13.27 11.617 10.803 9.667 10.623 C 5.996 10.483 5.304 18.192 8.638 19.192 C 10.549 19.685 12.067 17.746 12.271 15.142 Z M 16.613 15.873 C 18.443 16.411 20.546 14.764 21.298 12.206 C 22.929 5.995 16.645 4.148 14.652 10.253 C 13.901 12.811 14.779 15.334 16.613 15.873 Z" fill={color} />
    </G>
  </Svg>
);

const statusVariant = (s: string) => {
  const status = s?.toLowerCase() || '';
  if (status.includes("healthy")) return "success" as const;
  if (status.includes("vaccine") || status.includes("due")) return "warning" as const;
  return "danger" as const;
};

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdoptionOpen, setIsAdoptionOpen] = useState(false);
  const [isFosterOpen, setIsFosterOpen] = useState(false);
  const isVet = user?.role === 'veterinarian';
  const canManagePet = !!pet?.canManage || !!pet?.isViewerOwner || (!!user?.id && pet?.ownerId === user.id);
  const canEditPetProfile = canManagePet;
  const canManageListing = canManagePet;
  const canAddClinicalRecord = canManagePet || isVet;

  const fetchPet = async () => {
    try {
      const data = await userPetsApi.getPetById(String(id));
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

  useFocusEffect(
    useCallback(() => {
      fetchPet();
    }, [id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPet();
  };

  const handleToggleListing = async (type: "adoption" | "foster", value: boolean) => {
    // Optimistic update for immediate feedback
    if (type === "adoption") setIsAdoptionOpen(value);
    else setIsFosterOpen(value);

    try {
      const payload = type === "adoption" ? { isAdoptionOpen: value } : { isFosterOpen: value };
      const updatedPet = await userPetsApi.updateListing(String(id), payload);
      
      // Sync final state from server
      if (type === "adoption") setIsAdoptionOpen(updatedPet.isAdoptionOpen ?? value);
      else setIsFosterOpen(updatedPet.isFosterOpen ?? value);
    } catch (error: any) {
      // Revert state on failure
      if (type === "adoption") setIsAdoptionOpen(!value);
      else setIsFosterOpen(!value);
      
      Alert.alert("Error", error.message || "Failed to update listing status.");
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {/* Navigation Header */}
        <View style={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable 
            onPress={() => router.back()} 
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>Pet Profile</Text>
          {canEditPetProfile ? (
            <Pressable
              onPress={() => router.push(`/pets/add?id=${id}`)}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
            >
              <Edit3 size={18} color={colors.brand} />
            </Pressable>
          ) : <View style={{ width: 40 }} />}
        </View>

        {/* Homepage Style Hero Card */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <LinearGradient
            colors={['#3b82f6', '#1e3a8a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 32, padding: 24, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 }}
          >
            {/* Background Paw Prints */}
            <CustomPawPrint size={120} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: -20, top: -20 }} />
            <CustomPawPrint size={80} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: 40, bottom: 40 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', padding: 3 }}>
                <View style={{ flex: 1, borderRadius: 42, overflow: 'hidden', backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                  {pet.avatar_url ? (
                    <Image source={{ uri: pet.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <CustomPawPrint size={40} color={colors.textMuted} />
                  )}
                </View>
                {/* <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, padding: 2 }}>
                  <View style={{ backgroundColor: '#3b82f6', borderRadius: 10, padding: 4 }}>
                    <Camera size={12} color="#fff" />
                  </View>
                </View> */}
              </View>

              <View style={{ flex: 1, marginLeft: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 26, fontWeight: '700', color: '#fff' }} numberOfLines={1}>{pet.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ fontSize: 13, color: '#fff', fontWeight: '500' }}>Age: {pet.age || 'N/A'}</Text>
                  </View>
                  <View style={{ marginLeft: 8 }}>
                    <StatusChip label={pet.healthStatus || 'Healthy'} variant={statusVariant(pet.healthStatus) as any} />
                  </View>
                </View>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8, fontWeight: '400' }}>{pet.breed} · {pet.species}</Text>
              </View>
            </View>

            <View style={{ height: 1, marginVertical: 20 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginBottom: 4 }}>Weight</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{pet.weight || '--'}</Text>
              </View>

              <View style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' }} />

              <View style={{ flex: 1.2, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginBottom: 4 }}>Gender</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{pet.gender || '--'}</Text>
              </View>

              <View style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' }} />

              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginBottom: 4 }}>Health Score</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>95/100</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Health Actions */}
        {canAddClinicalRecord ? (
          <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 }}>Health Records</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {[
                { icon: Syringe, label: "Vaccines", color: "#10b981", path: `/health/vaccines?petId=${id}` },
                { icon: Pill, label: "Meds", color: "#0ea5e9", path: `/health/meds?petId=${id}` },
                { icon: Heart, label: "Vitals", color: "#ec4899", path: `/health/vitals?petId=${id}` },
                { icon: FileText, label: "Documents", color: "#8b5cf6", path: `/health/records?petId=${id}` },
              ].map(({ icon: Icon, label, color, path }) => (
                <Pressable 
                  key={label} 
                  onPress={() => path && router.push(path as any)}
                  style={{ 
                    width: '48%', 
                    backgroundColor: colors.bgCard, 
                    borderRadius: 20, 
                    padding: 16, 
                    borderWidth: 1, 
                    borderColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={color} />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textPrimary }}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Public Status Toggles — hidden for vets */}
        {!isVet && (
          <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 }}>Listing Preferences</Text>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={20} color={isAdoptionOpen ? colors.brand : colors.textMuted} fill={isAdoptionOpen ? colors.brand : 'transparent'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Open for Adoption</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>Listed in Discover feed</Text>
                  </View>
                </View>
                <Switch 
                  value={isAdoptionOpen} 
                  disabled={!canManagePet}
                  onValueChange={(val) => handleToggleListing("adoption", val)} 
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor="#fff"
                />
              </View>

              <View style={{ height: 1, backgroundColor: colors.border }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                    <Home size={20} color={isFosterOpen ? colors.brand : colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Foster Care</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>Looking for temporary home</Text>
                  </View>
                </View>
                <Switch 
                  value={isFosterOpen} 
                  disabled={!canManagePet}
                  onValueChange={(val) => handleToggleListing("foster", val)} 
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>
        )}

        {/* Activity Summary / Timeline approximation */}
        {(pet.Vaccines?.length > 0 || pet.Medications?.length > 0) && (
          <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>Recent Activity</Text>
            </View>

            {/* Combined List of vaccines and meds */}
            <View style={{ gap: 12 }}>
              {pet.Vaccines?.slice(0, 2).map((v: any) => (
                <View key={v.id} style={{ 
                  backgroundColor: colors.bgCard, 
                  borderRadius: 20, 
                  padding: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Syringe size={20} color="#047857" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{v.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>Vaccination · {v.status}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              ))}
              
              {pet.Medications?.slice(0, 2).map((m: any) => (
                <View key={m.id} style={{ 
                  backgroundColor: colors.bgCard, 
                  borderRadius: 20, 
                  padding: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.infoBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Pill size={20} color="#0369a1" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{m.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>Medication · {m.frequency}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Allergies Section */}
        {pet.Allergies?.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 }}>Known Allergies</Text>
            <View style={{ gap: 12 }}>
              {pet.Allergies.map((allergy: any) => (
                <View key={allergy.id} style={{ 
                  backgroundColor: colors.bgCard, 
                  borderRadius: 20, 
                  padding: 16, 
                  flexDirection: 'row', 
                  alignItems: 'flex-start',
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldAlert size={20} color="#b45309" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{allergy.allergen}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: allergy.severity === 'severe' ? '#fee2e2' : colors.bgSubtle }}>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: allergy.severity === 'severe' ? '#b91c1c' : colors.textMuted, textTransform: 'uppercase' }}>{allergy.severity}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{allergy.reaction || 'No reaction recorded'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Appointments Section */}
        {pet.Appointments?.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 }}>Upcoming Appointments</Text>
            <View style={{ gap: 12 }}>
              {pet.Appointments.map((a: any) => (
                <View key={a.id} style={{ 
                  backgroundColor: colors.bgCard, 
                  borderRadius: 20, 
                  padding: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{a.reason || 'Vet Visit'}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{new Date(a.appointment_date).toLocaleDateString()} · {a.appointment_time}</Text>
                  </View>
                  <StatusChip label={a.status} variant={a.status === 'confirmed' ? 'success' : 'warning'} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
