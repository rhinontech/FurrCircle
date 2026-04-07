import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Image, Modal, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { Search, Stethoscope, MapPin, Star, ShieldCheck, Phone, Clock, Users, X, Heart, PawPrint } from "lucide-react-native";
import StatusChip from "../../components/ui/StatusChip";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { useRouter } from "expo-router";

const categories = ["All", "Vets", "Adoption", "Foster", "Shelters"];

export default function DiscoverScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [active, setActive] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<"vet" | "pet" | "shelter" | null>(null);

  const [vets, setVets] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [vetsRes, sheltersRes, petsRes] = await Promise.all([
        api.get('/appointments/vets'),
        api.get('/auth/users/shelter'),
        api.get('/pets/discover')
      ]);
      setVets(vetsRes || []);
      setShelters(sheltersRes || []);
      setPets(petsRes || []);
    } catch (error) {
      console.error("Error fetching discover data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const closeModal = () => { setSelectedItem(null); setModalType(null); };

  const handlePetInterest = async (pet: any) => {
    const isFosterOnly = !!pet?.isFosterOpen && !pet?.isAdoptionOpen;
    const actionLabel = isFosterOnly ? "foster" : "adoption";
    const owner = pet?.owner;
    if (!owner?.id) {
      Alert.alert("Chat unavailable", "This listing does not have an owner attached yet.");
      return;
    }

    try {
      const conversation = await api.post("/community/chats/start", {
        recipientId: owner.id,
        petId: pet.id,
        message: `Hi ${owner.name || ""}, I would love to ask about ${pet?.name || "this pet"} and whether ${actionLabel} is still available.`,
      });
      closeModal();
      router.push(`/community/chat/${conversation.id}` as any);
    } catch (error: any) {
      Alert.alert("Chat unavailable", error.message || "Could not start the conversation right now.");
    }
  };

  const filteredVets = vets.filter(v => (v.clinic_name || v.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredShelters = shelters.filter(s => (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPets = pets.filter(p => (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()));

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
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>Discover</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSubtle, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 }}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              placeholder="Search vets, shelters, pets..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, height: 48, marginLeft: 8, fontSize: 14, color: colors.textPrimary }}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {categories.map((c) => (
              <Pressable
                key={c}
                onPress={() => setActive(c)}
                style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginRight: 8, backgroundColor: active === c ? colors.brand : colors.bgSubtle }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: active === c ? '#fff' : colors.textMuted }}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Vets */}
        {(active === "All" || active === "Vets") && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>Nearby Vets</Text>
              <Text style={{ fontSize: 14, color: colors.brand, fontWeight: '500' }}>View all</Text>
            </View>
            {filteredVets.length === 0 ? <Text style={{ color: colors.textMuted }}>No vets found</Text> : filteredVets.map((vet) => (
              <Pressable
                key={vet.id}
                onPress={() => router.push(`/vets/${vet.id}` as any)}
                style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.infoBg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    {vet.avatar_url ? (
                      <Image source={{ uri: vet.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Stethoscope size={22} color="#0ea5e9" />
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                      {vet.clinic_name || vet.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <MapPin size={13} color={colors.textMuted} />
                      <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 5, marginRight: 14 }} numberOfLines={1}>
                        {vet.city || 'Nearby'}
                      </Text>
                      <Star size={13} color="#f59e0b" fill="#f59e0b" />
                      <Text style={{ fontSize: 13, color: '#f59e0b', fontWeight: '700', marginLeft: 5 }}>
                        {Number(vet.rating || 4.5).toFixed(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#e0f2fe', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#bae6fd' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#0369a1' }}>VET</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Adoption & Foster */}
        {(active === "All" || active === "Adoption" || active === "Foster") && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>
              {active === "Foster" ? "Needs a Foster Home" : "Adoption & Fostering"}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {filteredPets
                .filter(p => {
                  if (active === "Adoption") return p.isAdoptionOpen;
                  if (active === "Foster") return p.isFosterOpen;
                  return true;
                })
                .map((pet) => (
                <Pressable key={pet.id} onPress={() => { setSelectedItem(pet); setModalType("pet"); }} style={{ width: '47%', backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                  <View style={{ position: 'relative' }}>
                    {pet.avatar_url ? (
                      <Image source={{ uri: pet.avatar_url }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: '100%', height: 120, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                        <PawPrint size={40} color={colors.textMuted} />
                      </View>
                    )}
                    {pet.owner?.isVerified && (
                      <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#10b981', borderRadius: 999, padding: 4 }}>
                        <ShieldCheck size={12} color="#fff" />
                      </View>
                    )}
                    {pet.isFosterOpen && (
                      <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: colors.infoBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: colors.brand }}>FOSTER</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{pet.name} <Text style={{ fontWeight: '400', color: colors.textMuted }}> - {pet.species}</Text></Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{pet.breed || pet.city}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Shelters */}
        {(active === "All" || active === "Shelters") && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Nearby Shelters</Text>
            {filteredShelters.length === 0 ? <Text style={{ color: colors.textMuted }}>No shelters found</Text> : filteredShelters.map((s) => (
              <Pressable key={s.id} onPress={() => { setSelectedItem(s); setModalType("shelter"); }} style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                 <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  {s.avatar_url ? (
                    <Image source={{ uri: s.avatar_url }} style={{ width: 44, height: 44, borderRadius: 12 }} />
                  ) : (
                    <Users size={20} color={colors.brand} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{s.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <MapPin size={12} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4, marginRight: 12 }}>{s.city || 'Available'}</Text>
                    <Users size={12} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>Shelter</Text>
                  </View>
                </View>
                <StatusChip label="RESCUE" variant="info" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selectedItem} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '82%', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
                {selectedItem?.name || selectedItem?.clinic_name}
              </Text>
              <Pressable onPress={closeModal} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {(selectedItem?.avatar_url || selectedItem?.imageUrl) && (
                <Image source={{ uri: selectedItem.avatar_url || selectedItem.imageUrl }} style={{ width: '100%', height: 160, borderRadius: 16, marginBottom: 16 }} resizeMode="cover" />
              )}
              {modalType === "vet" && selectedItem && (
                <View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>{selectedItem.bio || 'Professional veterinarian dedicated to pet wellness.'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Clock size={16} color={colors.textMuted} />
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8 }}>{selectedItem.hours || '8:00 AM - 6:00 PM'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <Phone size={16} color={colors.textMuted} />
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8 }}>{selectedItem.phone || '+1 555-PAWS'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                      onPress={() => {
                        closeModal();
                        router.push(`/appointments/book?vetId=${selectedItem.id}&vetName=${encodeURIComponent(selectedItem.clinic_name || selectedItem.name)}`);
                      }}
                      style={{ flex: 1, backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Book Now</Text>
                    </Pressable>
                    <Pressable style={{ flex: 1, backgroundColor: colors.bgSubtle, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Contact</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {modalType === "pet" && selectedItem && (
                <View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                    {(selectedItem.breed || 'Mixed breed') + ' - ' + (selectedItem.city || 'Nearby')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>Species: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{selectedItem.species || 'Unknown'}</Text></Text>
                    </View>
                    <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>Age: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{selectedItem.age || 'Unknown'}</Text></Text>
                    </View>
                    <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>Gender: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{selectedItem.gender || 'Unknown'}</Text></Text>
                    </View>
                    <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>Weight: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{selectedItem.weight || '--'}</Text></Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 16, padding: 14, marginBottom: 14 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>About {selectedItem.name}</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
                      {selectedItem.healthStatus || 'Healthy'} pet looking for {selectedItem.isFosterOpen && !selectedItem.isAdoptionOpen ? 'a temporary foster home' : 'a loving forever home'} in {selectedItem.city || 'your area'}.
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      {selectedItem.isAdoptionOpen ? <StatusChip label="ADOPTION OPEN" variant="success" /> : null}
                      {selectedItem.isFosterOpen ? <StatusChip label="FOSTER OPEN" variant="info" /> : null}
                      {selectedItem.owner?.isVerified ? <StatusChip label="VERIFIED OWNER" variant="success" /> : null}
                    </View>
                  </View>
                  <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 16, padding: 14, marginBottom: 14 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Health Snapshot</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>Status: {selectedItem.healthStatus || 'Healthy'}</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>Vaccines: {selectedItem.Vaccines?.length || 0} records</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>Appointments: {selectedItem.Appointments?.length || 0} on file</Text>
                  </View>
                  <View style={{ backgroundColor: colors.bgSubtle, borderRadius: 16, padding: 14, marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Posted By</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>{selectedItem.owner?.name || 'Pet owner'}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{selectedItem.city || 'Location not set'}</Text>
                  </View>
                  <Pressable onPress={() => handlePetInterest(selectedItem)} style={{ backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <Heart size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700' }}>
                      {selectedItem.isFosterOpen && !selectedItem.isAdoptionOpen ? `Request Foster for ${selectedItem.name}` : `Request Adoption for ${selectedItem.name}`}
                    </Text>
                  </Pressable>
                </View>
              )}
              {modalType === "shelter" && selectedItem && (
                <View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>{selectedItem.bio || 'Helping pets find their forever families.'}</Text>
                  <Pressable style={{ backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Visit Website</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

