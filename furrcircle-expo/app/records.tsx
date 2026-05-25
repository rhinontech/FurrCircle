import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { moonaPassport } from "../src/lib/demo-data";
import { FileText, Plus } from "lucide-react-native";

export default function RecordsScreen() {
  const tk = useTokens();
  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Health Records" right={<TouchableOpacity style={styles.addBtn}><Plus size={18} color={colors.primary} /></TouchableOpacity>} />
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 16 }}>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Vaccination history</Text>
        {moonaPassport.vaccines.map((v) => (
          <View key={v.name} style={[styles.card, { backgroundColor: tk.card }]}>
            <FileText size={20} color={v.status === "ok" ? colors.success : colors.coral} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: tk.text }]}>{v.name}</Text>
              <Text style={styles.cardMeta}>Given: {v.date} · Next: {v.next}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: v.status === "ok" ? "rgba(76,175,80,0.15)" : "rgba(255,107,107,0.15)" }]}>
              <Text style={[styles.badgeText, { color: v.status === "ok" ? colors.success : colors.coral }]}>{v.status === "ok" ? "OK" : "DUE"}</Text>
            </View>
          </View>
        ))}
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Allergies</Text>
        <View style={styles.tagRow}>
          {moonaPassport.allergies.map((a) => (
            <View key={a} style={styles.allergyTag}><Text style={styles.allergyText}>{a}</Text></View>
          ))}
        </View>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Insurance</Text>
        <View style={[styles.infoCard, { backgroundColor: tk.card }]}>
          <Text style={[styles.infoTitle, { color: tk.text }]}>{moonaPassport.insurance.provider}</Text>
          <Text style={styles.infoMeta}>Policy: {moonaPassport.insurance.policy}</Text>
          <Text style={styles.infoMeta}>{moonaPassport.insurance.valid}</Text>
        </View>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(37,99,235,0.1)", alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, marginTop: 20, marginBottom: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardTitle: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  cardMeta: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  allergyTag: { backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  allergyText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.coral },
  infoCard: { borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  infoTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  infoMeta: { fontSize: 13, color: colors.foreground + "88", fontFamily: "Inter_400Regular", marginTop: 4 },
});
