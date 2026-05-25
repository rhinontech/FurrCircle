import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { lostPets } from "../src/lib/demo-data";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { MapPin, Plus } from "lucide-react-native";

export default function LostScreen() {
  const tk = useTokens();
  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Lost & Found" right={
        <TouchableOpacity style={styles.addBtn}>
          <Plus size={18} color={colors.white} />
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        <Text style={styles.intro}>Help reunite pets with their families. Share sightings or report a missing pet.</Text>
        {lostPets.map((p) => (
          <View key={p.id} style={[styles.card, { backgroundColor: p.tintColor }]}>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: p.status === "lost" ? colors.coral : colors.success }]}>
                <Text style={styles.statusText}>{p.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.lastSeen}>{p.lastSeen}</Text>
            </View>
            <Text style={[styles.petName, { color: tk.text }]}>{p.name}</Text>
            <Text style={[styles.petBreed, { color: tk.textMuted }]}>{p.breed}</Text>
            <View style={styles.areaRow}>
              <MapPin size={13} color={colors.foreground + "99"} />
              <Text style={styles.areaText}>{p.area}</Text>
            </View>
            {p.reward !== "—" && <Text style={styles.reward}>Reward: {p.reward}</Text>}
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.sightingBtn}><Text style={styles.sightingBtnText}>I spotted this pet</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.shareBtn, { backgroundColor: tk.card }]}><Text style={[styles.shareBtnText, { color: tk.text }]}>Share</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.coral, alignItems: "center", justifyContent: "center" },
  intro: { fontSize: 14, color: colors.foreground + "99", fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 16, marginTop: 4 },
  card: { borderRadius: 20, padding: 18, marginBottom: 14 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: colors.white },
  lastSeen: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  petBreed: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  areaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  areaText: { fontSize: 13, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  reward: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.success, marginTop: 8 },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  sightingBtn: { flex: 1, backgroundColor: colors.foreground, borderRadius: 20, paddingVertical: 10, alignItems: "center" },
  sightingBtnText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.white },
  shareBtn: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, alignItems: "center" },
  shareBtnText: { fontFamily: "Poppins_700Bold", fontSize: 13 },
});
