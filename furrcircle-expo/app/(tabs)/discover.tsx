import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Heart, MapPin, Star, Stethoscope, Phone, HandHeart, Home } from "lucide-react-native";
import { useState } from "react";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";

const nearbyVets = [
  { name: "Furr Care Clinic", spec: "General · Surgery", dist: "0.6 km", rating: 4.9, open: true, tintColor: "rgba(37,99,235,0.1)" },
  { name: "Dr. Kavya Rao", spec: "Feline specialist", dist: "1.1 km", rating: 4.8, open: true, tintColor: "rgba(76,175,80,0.15)" },
  { name: "Paws & Tails Hospital", spec: "24x7 emergency", dist: "2.3 km", rating: 4.7, open: true, tintColor: "rgba(255,107,107,0.15)" },
  { name: "Bandra Pet Wellness", spec: "Dental · Grooming", dist: "3.0 km", rating: 4.6, open: false, tintColor: "rgba(255,217,61,0.3)" },
];

type Mode = "all" | "adoption" | "foster";

const allPets = [
  { img: require("../../src/assets/doodle-puppy.png"), name: "Biscuit", breed: "Beagle", dist: "0.8 km", tintColor: "rgba(255,217,61,0.3)", id: "biscuit", adoption: true, foster: false },
  { img: require("../../src/assets/doodle-cat.png"), name: "Mochi", breed: "Persian", dist: "1.2 km", tintColor: "rgba(255,111,207,0.2)", id: "mochi", adoption: true, foster: true },
  { img: require("../../src/assets/doodle-boy-dog.png"), name: "Rocky", breed: "Indie", dist: "1.6 km", tintColor: "rgba(37,99,235,0.1)", id: "rocky", adoption: false, foster: true },
  { img: require("../../src/assets/doodle-puppy.png"), name: "Snow", breed: "Pom mix", dist: "2.4 km", tintColor: "rgba(76,175,80,0.15)", id: "snow", adoption: false, foster: true },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tk = useTokens();
  const [mode, setMode] = useState<Mode>("all");

  const pets = allPets.filter((p) =>
    mode === "all" ? p.adoption || p.foster : mode === "adoption" ? p.adoption : p.foster
  );

  return (
    <PageContainer>
    <ScrollView style={[styles.container, { paddingTop: insets.top, backgroundColor: tk.bg }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: tk.text }]}>Discover</Text>
        <Text style={[styles.subtitle, { color: tk.textMuted }]}>Vets, pets & places near you</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: tk.card }]}>
        <Search size={20} color={tk.textMuted} />
        <TextInput placeholder="Search vets, breeds, places…" placeholderTextColor={tk.textMuted} style={[styles.searchInput, { color: tk.text }]} />
      </View>

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Nearby vets</Text>
        <TouchableOpacity onPress={() => router.push("/care")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.vetList}>
        {nearbyVets.map((v) => (
          <TouchableOpacity key={v.name} onPress={() => router.push("/book")} style={[styles.vetRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
            <View style={[styles.vetIcon, { backgroundColor: v.tintColor }]}>
              <Image source={require("../../src/assets/doodle-vet.png")} style={styles.vetImg} resizeMode="contain" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.vetNameRow}>
                <Text style={[styles.vetName, { color: tk.text }]} numberOfLines={1}>{v.name}</Text>
                {v.open && <View style={styles.openBadge}><Text style={styles.openText}>OPEN</Text></View>}
              </View>
              <View style={styles.vetSpecRow}>
                <Stethoscope size={12} color={tk.textMuted} />
                <Text style={[styles.vetSpec, { color: tk.textMuted }]}>{v.spec}</Text>
              </View>
              <View style={styles.vetMeta}>
                <Star size={12} color={colors.sunshine} fill={colors.sunshine} />
                <Text style={[styles.vetMetaText, { color: tk.textMuted }]}>{v.rating}</Text>
                <MapPin size={12} color={tk.textMuted} />
                <Text style={[styles.vetMetaText, { color: tk.textMuted }]}>{v.dist}</Text>
              </View>
            </View>
            <View style={styles.callBtn}>
              <Phone size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
        ))}
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
        ]).map(({ k, label }) => {
          const isActive = mode === k;
          return (
            <TouchableOpacity key={k} onPress={() => setMode(k)} style={[styles.filterBtn, { backgroundColor: isActive ? tk.text : tk.card }]}>
              <Text style={[styles.filterBtnText, { color: isActive ? tk.bg : tk.textMuted }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.petsGrid}>
        {pets.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => router.push(`/p/${p.id}`)} style={[styles.petCard, { backgroundColor: tk.card }]} activeOpacity={0.85}>
            <View style={[styles.petImageBg, { backgroundColor: p.tintColor }]}>
              <Image source={p.img} style={styles.petImage} resizeMode="contain" />
              <View style={styles.petBadges}>
                {p.adoption && <View style={[styles.adoptBadge, { backgroundColor: colors.success }]}><Text style={styles.adoptBadgeText}>Adopt</Text></View>}
                {p.foster && <View style={[styles.adoptBadge, { backgroundColor: colors.coral }]}><Text style={styles.adoptBadgeText}>Foster</Text></View>}
              </View>
            </View>
            <View style={styles.petInfo}>
              <View style={styles.petNameRow}>
                <Text style={[styles.petName, { color: tk.text }]}>{p.name}</Text>
                <Heart size={16} color={colors.pinky} />
              </View>
              <Text style={[styles.petBreed, { color: tk.textMuted }]}>{p.breed}</Text>
              <View style={styles.petDistRow}>
                <MapPin size={12} color={tk.textMuted} />
                <Text style={[styles.petDist, { color: tk.textMuted }]}>{p.dist}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {pets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: tk.textMuted }]}>No pets match this filter yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 28, paddingHorizontal: 16, paddingVertical: 14,
    marginHorizontal: 20, marginBottom: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  seeAll: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: colors.primary },
  petCount: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  vetList: { gap: 12, paddingHorizontal: 20 },
  vetRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 24, padding: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
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
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  filterBtnActive: { backgroundColor: colors.foreground },
  filterBtnText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: colors.foreground + "99" },
  filterBtnTextActive: { color: colors.white },
  petsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, marginTop: 12 },
  petCard: {
    width: "47%", borderRadius: 24, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
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
  emptyState: { flex: 1, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 14, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
});
