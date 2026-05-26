import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { FileText, Heart, Syringe } from "lucide-react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { moonaTimeline, moonaPassport } from "../src/lib/demo-data";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useState } from "react";

type Tab = "about" | "timeline" | "passport";

export default function PetScreen() {
  const router = useRouter();
  const tk = useTokens();
  const [tab, setTab] = useState<Tab>("about");

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Moona" right={
        <TouchableOpacity onPress={() => router.push("/records")} style={styles.recordsBtn}>
          <FileText size={18} color={colors.primary} />
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.heroBg}>
          <Image source={require("../src/assets/doodle-boy-dog.png")} style={styles.heroImg} resizeMode="contain" />
        </View>
        <View style={styles.petInfo}>
          <Text style={[styles.petName, { color: tk.text }]}>Moona</Text>
          <Text style={[styles.petBreed, { color: tk.textMuted }]}>Border Collie · ♀ · 2y · Mumbai</Text>
        </View>

        <View style={styles.tabs}>
          {(["about", "timeline", "passport"] as Tab[]).map((t) => {
            const isActive = tab === t;
            return (
              <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, { backgroundColor: isActive ? tk.text : tk.card }]}>
                <Text style={[styles.tabText, { color: isActive ? tk.bg : tk.textMuted }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === "about" && <AboutTab />}
        {tab === "timeline" && <TimelineTab />}
        {tab === "passport" && <PassportTab />}
      </ScrollView>
    </View>
    </PageContainer>
  );
}

function AboutTab() {
  const router = useRouter();
  const tk = useTokens();
  const traits = ["🐾 Friendly", "🏃 Active", "🎾 Playful", "🧠 Smart"];
  return (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionLabel, { color: tk.textMuted }]}>Personality</Text>
      <View style={styles.tagRow}>
        {traits.map((t) => <View key={t} style={styles.traitTag}><Text style={styles.traitText}>{t}</Text></View>)}
      </View>
      <Text style={[styles.sectionLabel, { color: tk.textMuted }]}>Quick actions</Text>
      <TouchableOpacity onPress={() => router.push("/log/vitals")} style={[styles.actionRow, { backgroundColor: tk.card }]}>
        <Text style={[styles.actionLabel, { color: tk.text }]}>Log vitals</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/log/meds")} style={[styles.actionRow, { backgroundColor: tk.card }]}>
        <Text style={[styles.actionLabel, { color: tk.text }]}>Log medication</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/log/vaccine")} style={[styles.actionRow, { backgroundColor: tk.card }]}>
        <Text style={[styles.actionLabel, { color: tk.text }]}>Log vaccine</Text>
      </TouchableOpacity>
    </View>
  );
}

function TimelineTab() {
  const tk = useTokens();
  return (
    <View style={styles.tabContent}>
      {moonaTimeline.map((m) => (
        <View key={m.id} style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: m.tintColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.timelineDate, { color: tk.textMuted }]}>{m.date}</Text>
            <Text style={[styles.timelineTitle, { color: tk.text }]}>{m.title}</Text>
            <Text style={[styles.timelineBody, { color: tk.text }]}>{m.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function PassportTab() {
  const tk = useTokens();
  return (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionLabel, { color: tk.textMuted }]}>Microchip</Text>
      <View style={[styles.infoCard, { backgroundColor: tk.card }]}>
        <Text style={[styles.infoText, { color: tk.text }]}>{moonaPassport.microchip}</Text>
      </View>
      <Text style={[styles.sectionLabel, { color: tk.textMuted }]}>Vaccines</Text>
      {moonaPassport.vaccines.map((v) => (
        <View key={v.name} style={[styles.vaccineRow, { backgroundColor: tk.card }]}>
          <Syringe size={16} color={v.status === "ok" ? colors.success : colors.coral} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.vaccineName, { color: tk.text }]}>{v.name}</Text>
            <Text style={[styles.vaccineDate, { color: tk.textMuted }]}>Next: {v.next}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: v.status === "ok" ? "rgba(76,175,80,0.15)" : "rgba(255,107,107,0.15)" }]}>
            <Text style={[styles.statusText, { color: v.status === "ok" ? colors.success : colors.coral }]}>{v.status === "ok" ? "UP TO DATE" : "DUE"}</Text>
          </View>
        </View>
      ))}
      <Text style={[styles.sectionLabel, { color: tk.textMuted }]}>Vet</Text>
      <View style={[styles.infoCard, { backgroundColor: tk.card }]}>
        <Text style={[styles.infoText, { color: tk.text }]}>{moonaPassport.vet.name}</Text>
        <Text style={[styles.infoSubText, { color: tk.textMuted }]}>{moonaPassport.vet.clinic}</Text>
        <Text style={[styles.infoSubText, { color: tk.textMuted }]}>{moonaPassport.vet.phone}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBg: { height: 200, backgroundColor: "rgba(255,107,107,0.15)", alignItems: "center", justifyContent: "center" },
  heroImg: { width: "60%", height: "80%" },
  petInfo: { padding: 16 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 24 },
  petBreed: { fontSize: 14, fontFamily: "Inter_400Regular" },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 24, alignItems: "center" },
  tabActive: { backgroundColor: colors.foreground },
  tabText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.foreground + "99" },
  tabTextActive: { color: colors.white },
  tabContent: { paddingHorizontal: 16 },
  sectionLabel: { fontFamily: "Poppins_700Bold", fontSize: 14, marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  traitTag: { backgroundColor: "rgba(37,99,235,0.1)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  traitText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.primary },
  actionRow: { borderRadius: 14, padding: 16, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  actionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  timelineItem: { flexDirection: "row", gap: 12, marginBottom: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, flexShrink: 0 },
  timelineDate: { fontSize: 11, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  timelineTitle: { fontFamily: "Poppins_700Bold", fontSize: 14, marginTop: 2 },
  timelineBody: { fontSize: 13, color: colors.foreground + "cc", fontFamily: "Inter_400Regular", marginTop: 2 },
  infoCard: { borderRadius: 14, padding: 16, marginBottom: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  infoText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  infoSubText: { fontSize: 13, color: colors.foreground + "99", fontFamily: "Inter_400Regular", marginTop: 2 },
  vaccineRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  vaccineName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  vaccineDate: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  recordsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(37,99,235,0.1)", alignItems: "center", justifyContent: "center" },
});
