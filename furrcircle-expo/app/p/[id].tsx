import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { Heart, MessageCircle } from "lucide-react-native";

export default function PetPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tk = useTokens();
  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Pet Profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.heroBg}>
          <Image source={require("../../src/assets/doodle-puppy.png")} style={styles.heroImg} resizeMode="contain" />
        </View>
        <View style={[styles.info, { backgroundColor: tk.card }]}>
          <Text style={[styles.petName, { color: tk.text }]}>{id?.charAt(0).toUpperCase()}{id?.slice(1) ?? "Pet"}</Text>
          <Text style={styles.petMeta}>Beagle · 4 mo · Available for adoption</Text>
          <View style={styles.badgeRow}>
            <View style={styles.adoptBadge}><Text style={styles.adoptText}>Adopt</Text></View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Express interest</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: tk.bg }]}><Heart size={20} color={colors.coral} /></TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: tk.bg }]}><MessageCircle size={20} color={colors.primary} /></TouchableOpacity>
          </View>
        </View>
        <View style={[styles.aboutCard, { backgroundColor: tk.card }]}>
          <Text style={[styles.aboutTitle, { color: tk.text }]}>About</Text>
          <Text style={[styles.aboutText, { color: tk.text + "cc" }]}>A curious and playful pup looking for a forever home. Vaccinated, dewormed, and ready for love. Great with kids and other dogs.</Text>
        </View>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBg: { height: 240, backgroundColor: "rgba(255,217,61,0.3)", alignItems: "center", justifyContent: "center" },
  heroImg: { width: "60%", height: "80%" },
  info: { borderRadius: 24, margin: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 24, color: colors.foreground },
  petMeta: { fontSize: 14, color: colors.foreground + "88", fontFamily: "Inter_400Regular", marginTop: 2 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  adoptBadge: { backgroundColor: "rgba(76,175,80,0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  adoptText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: colors.success },
  actions: { flexDirection: "row", gap: 10, marginTop: 16, alignItems: "center" },
  primaryBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 12, alignItems: "center" },
  primaryBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  aboutCard: { borderRadius: 20, marginHorizontal: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  aboutTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.foreground, marginBottom: 8 },
  aboutText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
});
