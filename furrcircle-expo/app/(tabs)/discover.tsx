import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Heart, MapPin, Star, Stethoscope, Phone, HandHeart, Home, Calendar } from "../../src/components/ui/icons";
import { useState, useEffect } from "react";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { glassSurface } from "../../src/components/ui/Glass";
import { placesApi } from "../../services/places/placesApi";
import { petApi } from "../../services/pet/petApi";
import { useAuthStore } from "../../src/lib/auth-store";
import { useLocationStore } from "../../src/lib/location-store";

type Mode = "all" | "adoption" | "foster"/* | "breed"*/;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tk = useTokens();
  const { user } = useAuthStore();
  const locationCity = useLocationStore(s => s.city);
  const locationLat = useLocationStore(s => s.latitude);
  const locationLng = useLocationStore(s => s.longitude);
  // Fall back to the user's profile city when no live location is set, so we
  // auto-load vets instead of asking the user to "Add Location" they already have.
  const effectiveCity = locationCity || user?.city || null;
  const [mode, setMode] = useState<Mode>("all");
  const [nearbyVets, setNearbyVets] = useState<any[]>([]);
  const [vetsLoading, setVetsLoading] = useState(false);
  const [allPets, setAllPets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    const coords = locationLat && locationLng ? { lat: locationLat, lng: locationLng } : undefined;

    try {
      if (effectiveCity) {
        const vetsData = await placesApi.getVetsByCity(effectiveCity, locationLat, locationLng);
        setNearbyVets(vetsData.items || []);
      }
    } catch (err) {
      console.warn("Failed to refresh vets data:", err);
    }

    try {
      const petsData = await petApi.discoverPets(coords);
      setAllPets(petsData || []);
    } catch (err) {
      console.warn("Failed to refresh discover pets data:", err);
    }

    setRefreshing(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const coords = locationLat && locationLng ? { lat: locationLat, lng: locationLng } : undefined;

      if (effectiveCity) {
        setVetsLoading(true);
        try {
          const vetsData = await placesApi.getVetsByCity(effectiveCity, locationLat, locationLng);
          setNearbyVets(vetsData.items || []);
        } catch (err) {
          console.warn("Failed to fetch vets data:", err);
        } finally {
          setVetsLoading(false);
        }
      }

      try {
        const petsData = await petApi.discoverPets(coords);
        setAllPets(petsData || []);
      } catch (err) {
        console.warn("Failed to fetch discover pets data:", err);
      }
    };
    fetchData();
  }, [effectiveCity, locationLat, locationLng]);

  const pets = allPets.filter((p) =>
    mode === "all"
      ? p.isAdoptionOpen || p.isFosterOpen
      : mode === "adoption"
      ? p.isAdoptionOpen
      : p.isFosterOpen
  );

  return (
    <PageContainer>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          <View style={styles.headerSection}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.title, { color: tk.text }]}>Discover</Text>
              <Text style={[styles.subtitle, { color: tk.textMuted }]}>Vets, pets & places near you</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/events")} style={[styles.eventBtn, glassSurface(tk)]} activeOpacity={0.85}>
              <Calendar size={20} color={tk.text} />
            </TouchableOpacity>
          </View>

          {/* <View style={[styles.searchBar, glassSurface(tk)]}>
            <Search size={20} color={tk.textMuted} />
            <TextInput placeholder="Search vets, breeds, places…" placeholderTextColor={tk.textMuted} style={[styles.searchInput, { color: tk.text }]} />
          </View> */}

          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: tk.text }]}>Nearby vets</Text>
            <TouchableOpacity onPress={() => router.push("/vets")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.vetList}>
            {!effectiveCity ? (
              <TouchableOpacity onPress={() => router.push("/settings")} style={[styles.vetRow, glassSurface(tk)]} activeOpacity={0.8}>
                <View style={[styles.vetIcon, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
                  <MapPin size={28} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <View style={styles.vetNameRow}>
                    <Text style={[styles.vetName, { color: tk.text }]}>Add Location</Text>
                  </View>
                  <View style={styles.vetSpecRow}>
                    <Text style={[styles.vetSpec, { color: tk.textMuted }]}>Set your city to find nearby vets</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              vetsLoading && nearbyVets.length === 0 ? (
                <View style={[styles.emptyVetsContainer, glassSurface(tk)]}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={[styles.emptyVetsText, { color: tk.textMuted }]}>Finding vets near {effectiveCity}…</Text>
                </View>
              ) : nearbyVets.length === 0 ? (
                <View style={[styles.emptyVetsContainer, glassSurface(tk)]}>
                  <Stethoscope size={24} color={tk.textMuted} />
                  <Text style={[styles.emptyVetsText, { color: tk.textMuted }]}>No veterinarians found nearby in {effectiveCity}</Text>
                </View>
              ) : (
                nearbyVets.slice(0, 4).map((v) => (
                  <TouchableOpacity key={v.id} onPress={() => router.push(`/vets/${v.id}`)} style={[styles.vetRow, glassSurface(tk)]} activeOpacity={0.8}>
                    <View style={[styles.vetIcon, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
                      <Image source={require("../../src/assets/doodle-vet.png")} style={styles.vetImg} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.vetNameRow}>
                        <Text style={[styles.vetName, { color: tk.text }]} numberOfLines={1}>{v.name}</Text>
                      </View>
                      <View style={styles.vetSpecRow}>
                        <Stethoscope size={12} color={tk.textMuted} />
                        <Text style={[styles.vetSpec, { color: tk.textMuted }]}>{v.address ? v.address.split(',')[0] : "General"}</Text>
                      </View>
                      <View style={styles.vetMeta}>
                        <Star size={12} color={colors.sunshine} fill={colors.sunshine} />
                        <Text style={[styles.vetMetaText, { color: tk.textMuted }]}>{v.rating || "N/A"}</Text>
                        {effectiveCity && (
                          <>
                            <MapPin size={12} color={tk.textMuted} />
                            <Text style={[styles.vetMetaText, { color: tk.textMuted }]}>{effectiveCity}</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View style={styles.callBtn}>
                      <Phone size={16} color={colors.white} />
                    </View>
                  </TouchableOpacity>
                ))
              )
            )}
          </View>

          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: tk.text }]}>Pets nearby</Text>
            <Text style={[styles.petCount, { color: tk.textMuted }]}>{pets.length} found</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {([
              { k: "all" as Mode, label: "All" },
              { k: "adoption" as Mode, label: "Adoption" },
              { k: "foster" as Mode, label: "Foster" },
              // { k: "breed" as Mode, label: "Breed" },
            ]).map(({ k, label }) => {
              const isActive = mode === k;
              return (
                <TouchableOpacity key={k} onPress={() => setMode(k)} style={[styles.filterBtn, isActive ? { backgroundColor: tk.text } : glassSurface(tk)]}>
                  <Text style={[styles.filterBtnText, { color: isActive ? tk.bg : tk.textMuted }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.petsGrid}>
            {pets.map((p) => (
              <TouchableOpacity key={p.id} onPress={() => router.push(`/p/${p.id}`)} style={[styles.petCard, glassSurface(tk)]} activeOpacity={0.85}>
                <View style={[styles.petImageBg, { backgroundColor: "rgba(255,217,61,0.3)" }]}>
                  {p.avatar_url ? (
                    <Image source={{ uri: p.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Image source={require("../../src/assets/doodle-puppy.png")} style={styles.petImage} resizeMode="contain" />
                  )}
                  <View style={styles.petBadges}>
                    {p.isAdoptionOpen && <View style={[styles.adoptBadge, { backgroundColor: colors.success }]}><Text style={styles.adoptBadgeText}>Adopt</Text></View>}
                    {p.isFosterOpen && <View style={[styles.adoptBadge, { backgroundColor: colors.coral }]}><Text style={styles.adoptBadgeText}>Foster</Text></View>}
                    {/* {p.isBreedingOpen && <View style={[styles.adoptBadge, { backgroundColor: colors.sunshine }]}><Text style={[styles.adoptBadgeText, { color: colors.foreground }]}>Breed</Text></View>} */}
                  </View>
                </View>
                <View style={styles.petInfo}>
                  <View style={styles.petNameRow}>
                    <Text style={[styles.petName, { color: tk.text }]}>{p.name}</Text>
                    {/* <Heart size={16} color={colors.pinky} /> */}
                  </View>
                  <Text style={[styles.petBreed, { color: tk.textMuted }]}>{p.breed || p.species}</Text>
                  <View style={styles.petDistRow}>
                    <MapPin size={12} color={tk.textMuted} />
                    <Text style={[styles.petDist, { color: tk.textMuted }]}>{p.distanceLabel || p.city || p.owner?.city || "Nearby"}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {pets.length === 0 && (
              <View style={[styles.emptyPetsContainer, glassSurface(tk)]}>
                <Heart size={24} color={tk.textMuted} />
                <Text style={[styles.emptyPetsText, { color: tk.textMuted }]}>No pets match this filter near you yet.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  eventBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 28, paddingHorizontal: 16, paddingVertical: 14,
    marginHorizontal: 20, marginBottom: 4,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 0 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  seeAll: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: colors.primary },
  petCount: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  vetList: { gap: 12, paddingHorizontal: 20 },
  vetRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 24, padding: 12,
  },
  vetIcon: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  vetImg: { width: "80%", height: "80%" },
  vetNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  vetName: { fontFamily: "Poppins_700Bold", fontSize: 15, flex: 1 },
  openBadge: { backgroundColor: "rgba(76,175,80,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  openText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.success },
  vetSpecRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  vetSpec: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  vetMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  vetMetaText: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular", marginRight: 6 },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  filterBtn: {
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8,
  },
  filterBtnActive: { backgroundColor: colors.foreground },
  filterBtnText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: colors.foreground + "99" },
  filterBtnTextActive: { color: colors.white },
  petsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 20, rowGap: 12, marginTop: 12 },
  petCard: {
    width: "48%", borderRadius: 24, overflow: "hidden",
  },
  petImageBg: { height: 128, alignItems: "center", justifyContent: "center", position: "relative" },
  petImage: { width: "80%", height: "80%" },
  petBadges: { position: "absolute", top: 8, left: 8, flexDirection: "row", gap: 4 },
  adoptBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  adoptBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.white },
  petInfo: { padding: 12 },
  petNameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  petBreed: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  petDistRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  petDist: { fontSize: 11, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  emptyState: { width: "100%", padding: 24, alignItems: "center" },
  emptyText: { fontSize: 14, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  emptyVetsContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    gap: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.2)",
    width: "100%",
  },
  emptyVetsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
  emptyPetsContainer: {
    width: "100%",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    gap: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.2)",
  },
  emptyPetsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
});
