import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { lostPets } from "../src/lib/demo-data";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { MapPin, Siren, Eye, Plus } from "lucide-react-native";

const lostDoodle = require("../src/assets/doodle-lost.png");
const tabs = ["Lost", "Spotted"] as const;

export default function LostScreen() {
  const tk = useTokens();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Lost");
  const list = lostPets.filter((p) => (tab === "Lost" ? p.status === "lost" : p.status === "spotted"));

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Lost & Found" />

        <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}>
          {/* Alert banner */}
          <View style={styles.px5}>
            <View style={styles.alertBanner}>
              <Image source={lostDoodle} style={styles.alertDoodle} resizeMode="contain" />
              <View style={{ maxWidth: "65%" }}>
                <Siren size={20} color={colors.white} />
                <Text style={styles.alertTitle}>{"Alert your local circle when a pet goes missing"}</Text>
                <TouchableOpacity style={styles.alertBtn}>
                  <Text style={styles.alertBtnText}>Report a lost pet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tab pills */}
          <View style={styles.tabRow}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabPill, tab === t ? styles.tabPillActive : { backgroundColor: colors.white }]}
              >
                {t === "Lost"
                  ? <Siren size={13} color={tab === t ? colors.white : colors.foreground + "AA"} />
                  : <Eye size={13} color={tab === t ? colors.white : colors.foreground + "AA"} />}
                <Text style={[styles.tabText, tab === t ? { color: colors.white } : { color: colors.foreground + "AA" }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pet cards */}
          <View style={styles.px5}>
            {list.map((p) => (
              <View key={p.id} style={[styles.card, { backgroundColor: p.tintColor }]}>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  {/* Pet image placeholder */}
                  <View style={styles.petImgPlaceholder} />
                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.statusBadge, { backgroundColor: p.status === "lost" ? colors.coral : colors.success }]}>
                        <Text style={styles.statusBadgeText}>{p.status.toUpperCase()}</Text>
                      </View>
                      {p.reward !== "—" && (
                        <View style={styles.rewardBadge}>
                          <Text style={styles.rewardBadgeText}>Reward {p.reward}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.petName, { color: tk.text }]}>{p.name}</Text>
                    <Text style={[styles.petBreed, { color: tk.textMuted }]}>{p.breed}</Text>
                    <View style={styles.areaRow}>
                      <MapPin size={12} color={tk.textMuted} />
                      <Text style={[styles.areaText, { color: tk.textMuted }]}>{p.area}</Text>
                    </View>
                    <Text style={[styles.lastSeen, { color: tk.textMuted }]}>{p.lastSeen}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity style={styles.fab}>
          <Plus size={16} color={colors.white} strokeWidth={3} />
          <Text style={styles.fabText}>I spotted a pet</Text>
        </TouchableOpacity>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px5: { paddingHorizontal: 20 },
  alertBanner: { backgroundColor: colors.coral, borderRadius: 24, padding: 20, marginBottom: 4, overflow: "hidden", position: "relative", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  alertDoodle: { position: "absolute", right: -14, bottom: -10, width: 110, height: 110 },
  alertTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white, lineHeight: 22, marginTop: 8, marginBottom: 12 },
  alertBtn: { alignSelf: "flex-start", backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  alertBtnText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: colors.coral },
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginTop: 16, marginBottom: 12 },
  tabPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  tabPillActive: { backgroundColor: colors.foreground },
  tabText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  card: { borderRadius: 24, padding: 16, marginBottom: 12 },
  petImgPlaceholder: { width: 80, height: 80, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.7)" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.white },
  rewardBadge: { backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  rewardBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.foreground },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 16, lineHeight: 22 },
  petBreed: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  areaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  areaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  lastSeen: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  fab: { position: "absolute", bottom: 24, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, borderRadius: 30, paddingHorizontal: 20, paddingVertical: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  fabText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
});
