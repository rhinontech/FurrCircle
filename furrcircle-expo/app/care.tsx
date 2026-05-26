import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import {
  Stethoscope, FileText, Sparkles, ShieldCheck,
  Pill, Syringe, Activity, FolderHeart, ChevronRight,
} from "lucide-react-native";

const tiles = [
  { icon: Stethoscope, label: "Book a Vet", bg: colors.primary, text: "#fff", to: "/book" },
  { icon: Syringe, label: "Log Vaccine", bg: colors.success, text: "#fff", to: "/log/vaccine" },
  { icon: Activity, label: "Log Vitals", bg: colors.coral, text: "#fff", to: "/log/vitals" },
  { icon: Pill, label: "Log Meds", bg: colors.pinky, text: "#fff", to: "/log/meds" },
  { icon: FolderHeart, label: "Medical Records", bg: colors.sunshine, text: colors.foreground, to: "/records" },
  // { icon: Sparkles, label: "AI Symptom Check", bg: "#1D55D4", text: "#fff", to: "/care" },
  { icon: FileText, label: "Pet Passport", bg: colors.foreground, text: "#fff", to: "/pet" },
  // { icon: ShieldCheck, label: "Insurance", bg: "#3EA842", text: "#fff", to: "/care" },
] as const;

export default function CareScreen() {
  const router = useRouter();
  const tk = useTokens();

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Care & Health" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero reminder banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>MOONA · REMINDER</Text>
            <Text style={styles.heroTitle}>Monthly checkup is due this week</Text>
            <TouchableOpacity onPress={() => router.push("/book")} style={styles.heroBtn} activeOpacity={0.85}>
              <Text style={styles.heroBtnText}>Book now</Text>
              <ChevronRight size={16} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Image
            source={require("../src/assets/doodle-vet.png")}
            style={styles.heroImg}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.sectionTitle, { color: tk.text }]}>Care services</Text>

        <View style={styles.grid}>
          {tiles.map(({ icon: Icon, label, bg, text, to }) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(to)}
              style={[styles.tile, { backgroundColor: bg }]}
              activeOpacity={0.85}
            >
              <View style={styles.tileIconWrap}>
                <Icon size={20} color={text} strokeWidth={2.2} />
              </View>
              <Text style={[styles.tileLabel, { color: text }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  heroBanner: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    padding: 20,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  heroContent: { flex: 1, zIndex: 1 },
  heroEyebrow: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    lineHeight: 30,
    marginBottom: 16,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  heroBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: colors.primary,
  },
  heroImg: {
    position: "absolute",
    right: -12,
    bottom: 0,
    width: 160,
    height: 140,
  },

  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    paddingHorizontal: 24,
    marginTop: 28,
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 8,
  },
  tile: {
    width: "47%",
    height: 128,
    borderRadius: 24,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
  },
});
