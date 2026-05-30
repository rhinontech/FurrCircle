import { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Share2, Heart, ShieldCheck, Cake, Ruler, MapPin, MessageCircle, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../../src/components/PageContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { petApi } from "../../services/pet/petApi";

const boyDog = require("../../src/assets/doodle-boy-dog.png");
const puppy = require("../../src/assets/doodle-puppy.png");
const cat = require("../../src/assets/doodle-cat.png");

const traitColors = [
  { bg: "rgba(37,99,235,0.15)", text: colors.primary },
  { bg: "rgba(255,107,107,0.15)", text: colors.coral },
  { bg: "rgba(255,217,61,0.3)", text: colors.foreground },
  { bg: "rgba(255,111,207,0.15)", text: colors.pinky },
  { bg: "rgba(76,175,80,0.15)", text: colors.success },
];

const galleryTints = [
  "rgba(255,217,61,0.3)",
  "rgba(37,99,235,0.15)",
  "rgba(255,107,107,0.2)",
  "rgba(255,111,207,0.15)",
  "rgba(76,175,80,0.15)",
  "rgba(26,26,46,0.1)",
];

export default function PetPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tk = useTokens();
  const insets = useSafeAreaInsets();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) { setLoading(false); return; }
      setLoading(true);
      petApi.getPetById(id)
        .then(data => { setPet(data); setLoading(false); })
        .catch(err => { console.error("Failed to load pet:", err); setLoading(false); });
    }, [id])
  );

  if (loading) {
    return (
      <PageContainer>
        <View style={[styles.container, { backgroundColor: tk.bg, justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </PageContainer>
    );
  }

  if (!pet) {
    return (
      <PageContainer>
        <View style={[styles.container, { backgroundColor: tk.bg }]}>
          <ScreenHeader title="Pet Profile" />
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontFamily: "Inter_400Regular", color: tk.textMuted }}>Pet not found.</Text>
          </View>
        </View>
      </PageContainer>
    );
  }

  const TINT: Record<string, string> = {
    dog: "rgba(255,107,107,0.2)",
    cat: "rgba(255,111,207,0.2)",
  };
  const tintColor = TINT[String(pet.species || "").toLowerCase()] || "rgba(255,217,61,0.3)";
  const petBreed = pet.breed || pet.species || "Unknown breed";
  const petGender = pet.gender === "male" ? "♂" : pet.gender === "female" ? "♀" : "";
  const breedString = `${petBreed} · ${petGender} · ${pet.age ? `${pet.age} y` : "?"}`;
  const ownerName = pet.owner?.name || "Pet parent";
  const ownerHandle = pet.owner?.username || pet.owner?.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "owner";
  const petBio = pet.description || pet.history || "No bio available.";
  const petAge = pet.age ? `${pet.age} y` : "?";
  const petWeight = pet.weight ? `${pet.weight} kg` : "?";
  const petLocation = pet.city || pet.owner?.city || "Unknown";
  const traits = Array.isArray(pet.personality) ? pet.personality : [];

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg, paddingBottom: insets.bottom }]}>
        <ScreenHeader
          title="Pet profile"
          right={
            <TouchableOpacity style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: tk.bg }}>
              <Share2 size={20} color={tk.text} />
            </TouchableOpacity>
          }
        />

        <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
          {/* Hero card */}
          <View style={styles.px5}>
            <View style={[styles.heroCard, { backgroundColor: tintColor }]}>
              <Image source={pet.avatar_url ? { uri: pet.avatar_url } : boyDog} style={styles.heroImg} resizeMode="contain" />
              <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.heartBtn}>
                <Heart size={16} color={liked ? colors.pinky : colors.foreground} fill={liked ? colors.pinky : "transparent"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Name + breed + verified */}
          <View style={styles.nameRow}>
            <View>
              <Text style={[styles.petName, { color: tk.text }]}>{pet.name}</Text>
              <Text style={[styles.petBreed, { color: tk.textMuted }]}>{breedString}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={colors.white} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          {/* Owner chip */}
          <View style={styles.px6}>
            <TouchableOpacity onPress={() => router.replace(`/u/${ownerHandle}` as any)} style={[styles.ownerChip, { backgroundColor: tk.text + "10" }]}>
              <View style={styles.ownerAvatar}>
                {pet.owner?.avatar_url ? (
                  <Image source={{ uri: pet.owner.avatar_url }} style={styles.ownerAvatarImg} resizeMode="cover" />
                ) : (
                  <Image source={boyDog} style={styles.ownerAvatarImg} resizeMode="cover" />
                )}
              </View>
              <Text style={[styles.ownerName, { color: tk.text }]}>{ownerName}</Text>
              <Text style={[styles.ownerHandle, { color: tk.textMuted }]}>@{ownerHandle}</Text>
            </TouchableOpacity>

            <Text style={[styles.bio, { color: tk.text + "CC" }]}>{petBio}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard icon={Cake} label="Age" value={petAge} tk={tk} />
            <StatCard icon={Ruler} label="Weight" value={petWeight} tk={tk} />
            <StatCard icon={MapPin} label="City" value={petLocation} tk={tk} />
          </View>

          {/* Personality */}
          <View style={styles.px6}>
            <Text style={[styles.sectionTitle, { color: tk.text }]}>Personality</Text>
            <View style={styles.tagsRow}>
              {traits.length === 0 ? (
                <Text style={{ color: tk.textMuted, fontSize: 13, fontFamily: "Inter_400Regular" }}>No traits specified.</Text>
              ) : (
                traits.map((t: string, i: number) => (
                  <View key={t} style={[styles.traitChip, { backgroundColor: traitColors[i % 5].bg }]}>
                    <Text style={[styles.traitText, { color: traitColors[i % 5].text }]}>{t}</Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Gallery */}
          <View style={styles.px5}>
            <Text style={[styles.sectionTitle, { color: tk.text, paddingHorizontal: 4 }]}>Gallery</Text>
            <View style={styles.galleryGrid}>
              {galleryTints.map((bg: string, i: number) => (
                <View key={i} style={[styles.galleryItem, { backgroundColor: bg }]} />
              ))}
            </View>
          </View>

          {/* CTA buttons */}
          <View style={styles.ctaRow}>
            <TouchableOpacity onPress={() => router.push(`/chat?recipient=${pet.ownerId || ""}&pet=${pet.id}` as any)} style={styles.messageBtn}>
              <MessageCircle size={16} color={colors.white} />
              <Text style={styles.messageBtnText}>Message owner</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/match")} style={styles.matchBtn}>
              <Sparkles size={16} color={colors.white} />
              <Text style={styles.matchBtnText}>Match</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </PageContainer>
  );
}

function StatCard({ icon: Icon, label, value, tk }: { icon: any; label: string; value: string; tk: any }) {
  return (
    <View style={[styles.statCard, { backgroundColor: tk.card }]}>
      <Icon size={20} color={tk.textMuted} />
      <Text style={[styles.statValue, { color: tk.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: tk.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px5: { paddingHorizontal: 20 },
  px6: { paddingHorizontal: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  backArrow: { fontSize: 20, color: colors.foreground, fontFamily: "Poppins_600SemiBold" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  heroCard: { borderRadius: 32, padding: 24, alignItems: "center", overflow: "hidden", marginBottom: 4 },
  heroImg: { width: 220, height: 224 },
  heartBtn: { position: "absolute", top: 16, right: 16, backgroundColor: colors.white, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  nameRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 14, marginBottom: 12 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 30 },
  petBreed: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.success, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: colors.white },
  ownerChip: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 20, paddingLeft: 6, paddingRight: 14, paddingVertical: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  ownerAvatar: { width: 24, height: 24, borderRadius: 12, overflow: "hidden", backgroundColor: "rgba(255,107,107,0.2)" },
  ownerAvatarImg: { width: "100%", height: "100%" },
  ownerName: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  ownerHandle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bio: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginTop: 14 },
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statValue: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.foreground, marginTop: 4 },
  statLabel: { fontSize: 11, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, marginTop: 20, marginBottom: 10 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  traitChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  traitText: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  galleryItem: { width: "30.5%", aspectRatio: 1, borderRadius: 16 },
  ctaRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginTop: 24 },
  messageBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, borderRadius: 30, paddingVertical: 14 },
  messageBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
  matchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.foreground, borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14 },
  matchBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
});
