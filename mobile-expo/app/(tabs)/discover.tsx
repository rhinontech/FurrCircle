import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Image, Modal, ActivityIndicator, RefreshControl, Alert, Linking, Platform } from "react-native";
import { Search, Stethoscope, MapPin, Star, ShieldCheck, Phone, Clock, X, Heart, PawPrint, ChevronRight, Sliders } from "@/components/ui/IconCompat";
import StatusChip from "../../components/ui/StatusChip";
import { useTheme } from "../../contexts/ThemeContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { userDiscoverApi } from "@/services/users/discoverApi";
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

const categories = ["All", "Vets", "Adoption", "Foster"];

function EmptyPlaceholder({ icon: Icon, title, description, colors }: any) {
  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard, borderRadius: 20, paddingVertical: 32, paddingHorizontal: 24, alignItems: "center", marginBottom: 16 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Icon size={24} color={colors.brand} strokeWidth={1.8} />
      </View>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>{title}</Text>
      <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 20 }}>{description}</Text>
    </View>
  );
}

import Animated, { FadeInUp, FadeInRight, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, withSpring } from 'react-native-reanimated';
import { BlurView } from "expo-blur";

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function DiscoverScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  // ... rest of state ...

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withRepeat(withSequence(withTiming(-10, { duration: 1500 }), withTiming(0, { duration: 1500 })), -1, true) }
    ]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(withSequence(withTiming(0.4, { duration: 2000 }), withTiming(1, { duration: 2000 })), -1, true)
  }));

  const pawFloatingStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withRepeat(withSequence(withTiming(-5, { duration: 2500 }), withTiming(0, { duration: 2500 })), -1, true) }
    ]
  }));

  // ... (keeping state and useEffect logic) ...
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [active, setActive] = useState(category && categories.includes(category) ? category : "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<"vet" | "pet" | null>(null);

  const [vets, setVets] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const data = await userDiscoverApi.getDiscoverData();
      setVets(data.vets);
      setPets(data.pets);
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
      const conversation = await userDiscoverApi.startPetInterestChat({
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

  const handleContactVet = async (vet: any) => {
    const phone = vet?.phone;
    if (!phone) {
      Alert.alert("Phone unavailable", "This clinic does not have a phone number listed.");
      return;
    }
    const url = `tel:${phone.replace(/[^\d+]/g, "")}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Unable to call", "Calling is not supported on this device.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to call", "Please try again in a moment.");
    }
  };

  const filteredVets = vets.filter(v => (v.clinic_name || v.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPets = pets.filter(p => (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()));

  const displayPets = filteredPets.filter(p => {
    if (active === "Adoption") return p.isAdoptionOpen;
    if (active === "Foster") return p.isFosterOpen;
    return true;
  });

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
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Header with Gradient */}
        <LinearGradient
          colors={['#2F5BFF', '#1C3FAA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}
        >
          {/* Decorative Paw Prints */}
          <CustomPawPrint size={100} color="rgba(255,255,255,0.08)" style={{ position: 'absolute', right: -20, top: 10 }} />
          <CustomPawPrint size={60} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', left: 40, bottom: -10 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff' }}>👋 Explore</Text>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Find vets, pets & friends nearby</Text>
            </View>
          </View>
        </LinearGradient>


        <View style={{ paddingHorizontal: 20, marginTop: -28 }}>
          <View style={{
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 15,
            elevation: 8,
            borderWidth: 0.3,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              height: 58,
              backgroundColor: isDark ? colors.bgCard : '#fff',
            }}>
              <Search size={20} color={isDark ? colors.textSecondary : "#6366F1"} strokeWidth={2.5} />
              <TextInput
                placeholder="Search vets, pets, or services..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, marginLeft: 12, fontSize: 16, color: colors.textPrimary, fontWeight: '600' }}
              />
              {/* <View style={{ width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: 12 }} /> */}
              {/* <Pressable>
                <Sliders size={20} color="#6366F1" />
              </Pressable> */}
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, marginTop: 8, }}>
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
              {filteredVets.length > 0 && (

                <Pressable onPress={() => setActive("Vets")} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: colors.brand, fontWeight: '700' }}>View all</Text>
                  <ChevronRight size={14} color={colors.brand} style={{ marginLeft: 4 }} />
                </Pressable>
              )}
            </View>
            {filteredVets.length === 0 ? (
              <EmptyPlaceholder
                icon={Stethoscope}
                title="No clinics found"
                description={searchQuery ? `We couldn't find any vets matching "${searchQuery}".` : "New veterinary clinics will be added to your area soon."}
                colors={colors}
              />
            ) : filteredVets.map((vet) => (
              <Pressable
                key={vet.id}
                onPress={() => router.push(`/vets/${vet.id}` as any)}
                style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: 24,
                  padding: 12,
                  marginBottom: 16,
                  elevation: 4,
                  borderWidth: Platform.OS === 'android' ? 0.1 : 0,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: colors.infoBg, alignItems: 'center', justifyContent: 'center', marginRight: 16, overflow: 'hidden' }}>
                    {vet.avatar_url ? (
                      <Image source={{ uri: vet.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Stethoscope size={32} color="#3b82f6" />
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>
                      {vet.clinic_name || vet.name || "Vet Clinic"}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <MapPin size={14} color={colors.textMuted} />
                      <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 4 }} numberOfLines={1}>
                        {vet.city || 'Nearby'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '700', marginLeft: 4 }}>
                        {Number(vet.rating || 0).toFixed(1)}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 4 }}>
                        ({vet.reviewsCount || 0} reviews)
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => router.push(`/vets/${vet.id}` as any)} style={{ backgroundColor: colors.brand, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>View</Text>
                  </Pressable>
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
              {displayPets.length === 0 ? (
                <View style={{ flex: 1 }}>
                  <EmptyPlaceholder
                    icon={active === "Foster" ? ShieldCheck : Heart}
                    title={active === "Foster" ? "No fosters needed" : (active === "Adoption" ? "No pets for adoption" : "No results")}
                    description={searchQuery ? `No pets matching "${searchQuery}" found in this category.` : `New pets for ${active === "Foster" ? "foster" : "adoption"} will appear here soon.`}
                    colors={colors}
                  />
                </View>
              ) : displayPets.map((pet) => (
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
                    <Pressable
                      onPress={() => handleContactVet(selectedItem)}
                      style={{ flex: 1, backgroundColor: colors.bgSubtle, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                    >
                      <Phone size={15} color={colors.textPrimary} />
                      <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Call Clinic</Text>
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
                  <View style={{ gap: 10 }}>
                    <Pressable
                      onPress={() => {
                        closeModal();
                        router.push(`/adoptions/apply?petId=${selectedItem.id}&petName=${encodeURIComponent(selectedItem.name || "")}&applicationType=${selectedItem.isFosterOpen && !selectedItem.isAdoptionOpen ? "foster" : "adoption"}` as any);
                      }}
                      style={{ backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                    >
                      <Heart size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '700' }}>
                        {selectedItem.isFosterOpen && !selectedItem.isAdoptionOpen ? `Apply to Foster ${selectedItem.name}` : `Apply to Adopt ${selectedItem.name}`}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handlePetInterest(selectedItem)}
                      style={{ backgroundColor: colors.bgSubtle, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                    >
                      <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>Message Owner Instead</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
