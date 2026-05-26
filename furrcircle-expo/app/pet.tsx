import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Share2, Heart, ShieldCheck, Cake, Ruler, MapPin, Sparkles, Syringe, BadgeCheck, Phone, HandHeart, Home } from "lucide-react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { moonaTimeline, moonaPassport } from "../src/lib/demo-data";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";

const tabs = ["About", "Timeline", "Passport"] as const;

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

export default function PetScreen() {
  const router = useRouter();
  const tk = useTokens();
  const [tab, setTab] = useState<(typeof tabs)[number]>("About");

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Pet Profile" />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero card */}
          <View style={styles.px5}>
            <View style={styles.heroCard}>
              <Image source={require("../src/assets/doodle-boy-dog.png")} style={styles.heroImg} resizeMode="contain" />
              <TouchableOpacity style={[styles.heroBtn, { top: 16, right: 16 }]}>
                <Share2 size={16} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.heroBtn, { top: 64, right: 16 }]}>
                <Heart size={16} color={colors.pinky} fill={colors.pinky} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Name + verified */}
          <View style={styles.nameRow}>
            <View>
              <Text style={[styles.petName, { color: tk.text }]}>Moona</Text>
              <Text style={[styles.petBreed, { color: tk.textMuted }]}>Border Collie · ♀ · 2 years</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={colors.white} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {tabs.map((t) => (
              <TouchableOpacity key={t} onPress={() => setTab(t)}
                style={[styles.tabPill, tab === t ? styles.tabPillActive : { backgroundColor: colors.white }]}>
                <Text style={[styles.tabText, tab === t ? { color: colors.white } : { color: colors.foreground + "AA" }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.px5}>
            {tab === "About" && <AboutTab router={router} />}
            {tab === "Timeline" && <TimelineTab tk={tk} />}
            {tab === "Passport" && <PassportTab tk={tk} />}
          </View>
        </ScrollView>
      </View>
    </PageContainer>
  );
}

function AboutTab({ router }: { router: any }) {
  const tk = useTokens();
  const [adoption, setAdoption] = useState(false);
  const [foster, setFoster] = useState(false);
  const traits = ["Playful", "Loves water", "Good with kids", "Loud barker", "Smart"];

  return (
    <View style={{ gap: 20 }}>
      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard icon={Cake} label="Age" value="2 y" />
        <StatCard icon={Ruler} label="Weight" value="14 kg" />
        <StatCard icon={MapPin} label="Mumbai" value="2 km" />
      </View>

      {/* Availability */}
      <View>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Availability</Text>
        <Text style={[styles.sectionSub, { color: tk.textMuted }]}>Show Moona on Discover for matching families.</Text>
        <View style={styles.availGrid}>
          <TouchableOpacity onPress={() => setAdoption(!adoption)}
            style={[styles.availCard, adoption ? { backgroundColor: colors.success } : { backgroundColor: colors.white }]}>
            <Home size={20} color={adoption ? colors.white : colors.foreground} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.availLabel, { color: adoption ? colors.white : colors.foreground }]}>Open for adoption</Text>
              <Text style={[styles.availSub, { color: adoption ? colors.white + "CC" : colors.foreground + "88" }]}>{adoption ? "Listed" : "Off"}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFoster(!foster)}
            style={[styles.availCard, foster ? { backgroundColor: colors.coral } : { backgroundColor: colors.white }]}>
            <HandHeart size={20} color={foster ? colors.white : colors.foreground} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.availLabel, { color: foster ? colors.white : colors.foreground }]}>Open for foster</Text>
              <Text style={[styles.availSub, { color: foster ? colors.white + "CC" : colors.foreground + "88" }]}>{foster ? "Listed" : "Off"}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Personality */}
      <View>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Personality</Text>
        <View style={styles.traitRow}>
          {traits.map((t, i) => (
            <View key={t} style={[styles.traitChip, { backgroundColor: traitColors[i % 5].bg }]}>
              <Text style={[styles.traitText, { color: traitColors[i % 5].text }]}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Memory vault */}
      <TouchableOpacity onPress={() => router.push("/memory")} style={styles.memoryVault} activeOpacity={0.88}>
        <View style={styles.memoryIcon}>
          <Sparkles size={24} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.memoryTitle}>Memory vault</Text>
          <Text style={styles.memorySub}>17 memories · pet aura unlocked</Text>
        </View>
      </TouchableOpacity>

      {/* Gallery */}
      <View>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Gallery</Text>
        <View style={styles.galleryGrid}>
          {galleryTints.map((bg, i) => (
            <View key={i} style={[styles.galleryItem, { backgroundColor: bg }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function TimelineTab({ tk }: { tk: any }) {
  return (
    <View style={styles.timelineWrap}>
      <View style={styles.timelineLine} />
      {moonaTimeline.map((m) => (
        <View key={m.id} style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: m.tintColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.timelineDate}>{m.date}</Text>
            <Text style={[styles.timelineTitle, { color: tk.text }]}>{m.title}</Text>
            <Text style={[styles.timelineBody, { color: tk.text + "BB" }]}>{m.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function PassportTab({ tk }: { tk: any }) {
  return (
    <View style={{ gap: 16 }}>
      {/* Microchip */}
      <View style={[styles.passportCard, { backgroundColor: colors.white }]}>
        <View style={styles.passportCardHeader}>
          <BadgeCheck size={16} color={colors.success} />
          <Text style={styles.passportCardLabel}>MICROCHIP</Text>
        </View>
        <Text style={[styles.passportCardValue, { color: tk.text }]}>{moonaPassport.microchip}</Text>
      </View>

      {/* Vaccines */}
      <View>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Vaccines</Text>
        <View style={{ gap: 8 }}>
          {moonaPassport.vaccines.map((v) => (
            <View key={v.name} style={[styles.vaccineRow, { backgroundColor: colors.white }]}>
              <View style={[styles.vaccineIcon, { backgroundColor: v.status === "ok" ? "rgba(76,175,80,0.15)" : "rgba(255,217,61,0.4)" }]}>
                <Syringe size={16} color={v.status === "ok" ? colors.success : colors.foreground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.vaccineName, { color: tk.text }]}>{v.name}</Text>
                <Text style={[styles.vaccineDate, { color: tk.textMuted }]}>Given {v.date} · Next {v.next}</Text>
              </View>
              <View style={[styles.vaccineBadge, { backgroundColor: v.status === "ok" ? colors.success : colors.sunshine }]}>
                <Text style={[styles.vaccineBadgeText, { color: v.status === "ok" ? colors.white : colors.foreground }]}>{v.status === "ok" ? "OK" : "Due"}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Allergies */}
      <View>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Allergies</Text>
        <View style={styles.traitRow}>
          {moonaPassport.allergies.map((a) => (
            <View key={a} style={[styles.traitChip, { backgroundColor: "rgba(255,107,107,0.15)" }]}>
              <Text style={[styles.traitText, { color: colors.coral }]}>{a}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Primary vet */}
      <View style={[styles.passportCard, { backgroundColor: colors.white }]}>
        <Text style={styles.passportCardLabel}>PRIMARY VET</Text>
        <Text style={[styles.passportCardValue, { color: tk.text }]}>{moonaPassport.vet.name}</Text>
        <Text style={[styles.passportCardSub, { color: tk.textMuted }]}>{moonaPassport.vet.clinic}</Text>
        <TouchableOpacity style={styles.phoneBtn}>
          <Phone size={13} color={colors.white} />
          <Text style={styles.phoneBtnText}>{moonaPassport.vet.phone}</Text>
        </TouchableOpacity>
      </View>

      {/* Insurance */}
      <View style={[styles.passportCard, { backgroundColor: colors.white }]}>
        <Text style={styles.passportCardLabel}>INSURANCE</Text>
        <Text style={[styles.passportCardValue, { color: tk.text }]}>{moonaPassport.insurance.provider}</Text>
        <Text style={[styles.passportCardSub, { color: tk.textMuted }]}>Policy {moonaPassport.insurance.policy} · {moonaPassport.insurance.valid}</Text>
      </View>
    </View>
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
  heroCard: { backgroundColor: "rgba(255,107,107,0.2)", borderRadius: 32, padding: 24, alignItems: "center", marginBottom: 4 },
  heroImg: { width: 220, height: 208 },
  heroBtn: { position: "absolute", backgroundColor: colors.white, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  nameRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 12, marginBottom: 4 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 30 },
  petBreed: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.success, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: colors.white },
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginTop: 12, marginBottom: 14 },
  tabPill: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  tabPillActive: { backgroundColor: colors.foreground },
  tabText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statValue: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.foreground, marginTop: 4 },
  statLabel: { fontSize: 11, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, marginBottom: 6 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
  availGrid: { flexDirection: "row", gap: 10 },
  availCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  availLabel: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  availSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  traitRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  traitChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  traitText: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  memoryVault: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 24, padding: 16, backgroundColor: colors.primary },
  memoryIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  memoryTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  memorySub: { fontSize: 12, color: colors.white + "D9", fontFamily: "Inter_400Regular", marginTop: 2 },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  galleryItem: { width: "30.5%", aspectRatio: 1, borderRadius: 16 },
  timelineWrap: { paddingLeft: 28, position: "relative" },
  timelineLine: { position: "absolute", left: 10, top: 8, bottom: 8, width: 1, backgroundColor: colors.border },
  timelineItem: { flexDirection: "row", gap: 14, marginBottom: 20 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, marginLeft: -28, flexShrink: 0, marginTop: 2 },
  timelineDate: { fontFamily: "Poppins_700Bold", fontSize: 11, color: colors.foreground + "88", textTransform: "uppercase", letterSpacing: 0.5 },
  timelineTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, marginTop: 2, lineHeight: 20 },
  timelineBody: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 20 },
  passportCard: { borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  passportCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  passportCardLabel: { fontFamily: "Poppins_700Bold", fontSize: 11, color: colors.foreground + "88", textTransform: "uppercase", letterSpacing: 0.5 },
  passportCardValue: { fontFamily: "Poppins_700Bold", fontSize: 18, letterSpacing: 0.5 },
  passportCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  phoneBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: 12 },
  phoneBtnText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: colors.white },
  vaccineRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  vaccineIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  vaccineName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  vaccineDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  vaccineBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  vaccineBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
});
