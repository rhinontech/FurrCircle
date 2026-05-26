import { useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Share2, Heart, ShieldCheck, Cake, Ruler, MapPin, MessageCircle, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../../src/components/PageContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";

const boyDog = require("../../src/assets/doodle-boy-dog.png");
const puppy = require("../../src/assets/doodle-puppy.png");
const cat = require("../../src/assets/doodle-cat.png");

type PetData = {
  name: string;
  img: any;
  tint: string;
  breed: string;
  owner: string;
  ownerHandle: string;
  bio: string;
  age: string;
  weight: string;
  location: string;
  tags: string[];
};

const pets: Record<string, PetData> = {
  moona: {
    name: "Moona",
    img: boyDog,
    tint: "rgba(255,107,107,0.2)",
    breed: "Border Collie · ♀ · 2 y",
    owner: "Goutham R.",
    ownerHandle: "goutham",
    bio: "Park enthusiast. Will trade frisbees for cuddles. Adopted from BSPCA, August 2023.",
    age: "2 y",
    weight: "14 kg",
    location: "Mumbai",
    tags: ["Playful", "Loves water", "Good with kids", "Smart"],
  },
  biscuit: {
    name: "Biscuit",
    img: puppy,
    tint: "rgba(255,217,61,0.3)",
    breed: "Beagle · ♂ · 4 mo",
    owner: "Rescue & Co.",
    ownerHandle: "rescueco",
    bio: "Tiny ears, huge personality. Looking for a forever home with a yard and patient humans.",
    age: "4 mo",
    weight: "5 kg",
    location: "Bandra W",
    tags: ["Adoptable", "Vaccinated", "House-trained"],
  },
  mochi: {
    name: "Mochi",
    img: cat,
    tint: "rgba(255,111,207,0.2)",
    breed: "Persian · ♀ · 1 y",
    owner: "Aanya P.",
    ownerHandle: "aanya",
    bio: "Professional window patroller. Reports squirrels and pigeons hourly.",
    age: "1 y",
    weight: "3.4 kg",
    location: "Powai",
    tags: ["Indoor", "Loves brushing", "Quiet"],
  },
  kobi: {
    name: "Kobi",
    img: cat,
    tint: "rgba(37,99,235,0.1)",
    breed: "Tabby · ♂ · 4 y",
    owner: "Goutham R.",
    ownerHandle: "goutham",
    bio: "Gentle giant. Has opinions about cardboard boxes.",
    age: "4 y",
    weight: "5.2 kg",
    location: "Mumbai",
    tags: ["Cuddly", "Box collector", "Talkative"],
  },
};

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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function PetPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tk = useTokens();
  const insets = useSafeAreaInsets();
  const pet = pets[id ?? "moona"] ?? { ...pets.moona, name: capitalize(id ?? "pet") };
  const [liked, setLiked] = useState(false);

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
            <View style={[styles.heroCard, { backgroundColor: pet.tint }]}>
              <Image source={pet.img} style={styles.heroImg} resizeMode="contain" />
              <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.heartBtn}>
                <Heart size={16} color={liked ? colors.pinky : colors.foreground} fill={liked ? colors.pinky : "transparent"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Name + breed + verified */}
          <View style={styles.nameRow}>
            <View>
              <Text style={[styles.petName, { color: tk.text }]}>{pet.name}</Text>
              <Text style={[styles.petBreed, { color: tk.textMuted }]}>{pet.breed}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={colors.white} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          {/* Owner chip */}
          <View style={styles.px6}>
            <TouchableOpacity onPress={() => router.push(`/user/${pet.ownerHandle}` as any)} style={[styles.ownerChip, { backgroundColor: colors.white }]}>
              <View style={styles.ownerAvatar}>
                <Image source={boyDog} style={styles.ownerAvatarImg} resizeMode="cover" />
              </View>
              <Text style={[styles.ownerName, { color: tk.text }]}>{pet.owner}</Text>
              <Text style={[styles.ownerHandle, { color: tk.textMuted }]}>@{pet.ownerHandle}</Text>
            </TouchableOpacity>

            <Text style={[styles.bio, { color: tk.text + "CC" }]}>{pet.bio}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard icon={Cake} label="Age" value={pet.age} />
            <StatCard icon={Ruler} label="Weight" value={pet.weight} />
            <StatCard icon={MapPin} label="City" value={pet.location} />
          </View>

          {/* Personality */}
          <View style={styles.px6}>
            <Text style={[styles.sectionTitle, { color: tk.text }]}>Personality</Text>
            <View style={styles.tagsRow}>
              {pet.tags.map((t, i) => (
                <View key={t} style={[styles.traitChip, { backgroundColor: traitColors[i % 5].bg }]}>
                  <Text style={[styles.traitText, { color: traitColors[i % 5].text }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Gallery */}
          <View style={styles.px5}>
            <Text style={[styles.sectionTitle, { color: tk.text, paddingHorizontal: 4 }]}>Gallery</Text>
            <View style={styles.galleryGrid}>
              {galleryTints.map((bg, i) => (
                <View key={i} style={[styles.galleryItem, { backgroundColor: bg }]} />
              ))}
            </View>
          </View>

          {/* CTA buttons */}
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.messageBtn}>
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

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.white }]}>
      <Icon size={20} color={colors.foreground + "99"} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
