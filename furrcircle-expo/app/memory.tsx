import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Sparkles, Plus } from "lucide-react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";

const boyDog = require("../src/assets/doodle-boy-dog.png");
const birthday = require("../src/assets/doodle-birthday.png");
const walk = require("../src/assets/doodle-walk.png");
const rescue = require("../src/assets/doodle-rescue.png");
const trophy = require("../src/assets/icon-trophy.png");

const aura = {
  zodiac: "Leo ♌",
  mood: "Playful",
  traits: ["Loyal", "Water-loving", "Mischievous", "Smart"],
  score: 92,
};

const years = [
  { year: "2026", grid: [boyDog, birthday, walk, boyDog, walk, birthday] },
  { year: "2025", grid: [walk, boyDog, rescue, birthday] },
  { year: "2024", grid: [rescue, walk, boyDog] },
];

const gridTints = [
  "rgba(255,107,107,0.15)",
  "rgba(255,217,61,0.3)",
  "rgba(37,99,235,0.1)",
  "rgba(255,111,207,0.15)",
  "rgba(76,175,80,0.15)",
  "rgba(26,26,46,0.05)",
];

export default function MemoryScreen() {
  const tk = useTokens();

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Memory vault" />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Aura banner */}
          <View style={styles.px5}>
            <View style={styles.auraBanner}>
              <Image source={trophy} style={styles.trophyImg} resizeMode="contain" />
              <View style={{ maxWidth: "65%" }}>
                <View style={styles.auraLabelRow}>
                  <Sparkles size={13} color={colors.white} />
                  <Text style={styles.auraLabel}>Moona's pet aura</Text>
                </View>
                <Text style={styles.auraTitle}>{aura.zodiac} · {aura.mood}</Text>
                <View style={styles.traitsRow}>
                  {aura.traits.map((t) => (
                    <View key={t} style={styles.traitChip}>
                      <Text style={styles.traitText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.compatibility}>
                  <Text style={styles.compatibilityScore}>{aura.score}%</Text>
                  {" "}compatibility with Goutham
                </Text>
              </View>
            </View>
          </View>

          {/* Year sections */}
          <View style={styles.yearsWrap}>
            {years.map((y) => (
              <View key={y.year} style={styles.yearSection}>
                <Text style={[styles.yearLabel, { color: tk.text }]}>{y.year}</Text>
                <View style={styles.photoGrid}>
                  {y.grid.map((img, i) => (
                    <View key={i} style={[styles.photoItem, { backgroundColor: gridTints[i % 6] }]}>
                      <Image source={img} style={styles.photoImg} resizeMode="contain" />
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addPhotoBtn}>
                    <Plus size={20} color={colors.foreground + "66"} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px5: { paddingHorizontal: 20 },
  auraBanner: { borderRadius: 28, padding: 20, backgroundColor: colors.primary, overflow: "hidden", position: "relative" },
  trophyImg: { position: "absolute", right: -10, bottom: -10, width: 110, height: 110, opacity: 0.9 },
  auraLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  auraLabel: { fontSize: 12, color: colors.white, fontFamily: "Inter_400Regular" },
  auraTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: colors.white, lineHeight: 30, marginTop: 8 },
  traitsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  traitChip: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  traitText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: colors.white },
  compatibility: { marginTop: 16, fontSize: 12, color: colors.white + "D9", fontFamily: "Inter_400Regular" },
  compatibilityScore: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  yearsWrap: { paddingHorizontal: 20, marginTop: 24, gap: 24 },
  yearSection: {},
  yearLabel: { fontFamily: "Poppins_700Bold", fontSize: 18, marginBottom: 10 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoItem: { width: "30.5%", aspectRatio: 1, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  photoImg: { width: "80%", height: "80%" },
  addPhotoBtn: { width: "30.5%", aspectRatio: 1, borderRadius: 16, borderWidth: 2, borderColor: "rgba(26,26,46,0.15)", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
});
