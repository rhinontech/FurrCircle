import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { SEED_USERS } from "../src/lib/seed-data";
import {
  Stethoscope, FileText, Sparkles, ShieldCheck,
  Pill, Syringe, Activity, FolderHeart, ChevronRight, X,
} from "lucide-react-native";

type PickerTarget = "records" | "passport" | null;

const DIRECT_TILES = [
  { icon: Stethoscope, label: "Book a Vet", bg: colors.primary, text: "#fff", to: "/book" },
  { icon: Syringe, label: "Log Vaccine", bg: colors.success, text: "#fff", to: "/log/vaccine" },
  { icon: Activity, label: "Log Vitals", bg: colors.coral, text: "#fff", to: "/log/vitals" },
  { icon: Pill, label: "Log Meds", bg: colors.pinky, text: "#fff", to: "/log/meds" },
] as const;

export default function CareScreen() {
  const router = useRouter();
  const tk = useTokens();
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  // Demo: use first seed user's pets. Replace with auth store pets when backend is ready.
  const myPets = SEED_USERS[0].pets;

  const handlePetSelected = (petId: string) => {
    setPickerTarget(null);
    if (pickerTarget === "records") {
      router.push({ pathname: "/records", params: { petId } });
    } else if (pickerTarget === "passport") {
      router.push({ pathname: "/pet", params: { id: petId, tab: "Passport" } });
    }
  };

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
          {DIRECT_TILES.map(({ icon: Icon, label, bg, text, to }) => (
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

          {/* Medical Records — shows pet picker first */}
          <TouchableOpacity
            onPress={() => setPickerTarget("records")}
            style={[styles.tile, { backgroundColor: colors.sunshine }]}
            activeOpacity={0.85}
          >
            <View style={styles.tileIconWrap}>
              <FolderHeart size={20} color={colors.foreground} strokeWidth={2.2} />
            </View>
            <Text style={[styles.tileLabel, { color: colors.foreground }]}>Medical Records</Text>
          </TouchableOpacity>

          {/* Pet Passport — shows pet picker first, then opens Passport tab */}
          <TouchableOpacity
            onPress={() => setPickerTarget("passport")}
            style={[styles.tile, { backgroundColor: colors.foreground }]}
            activeOpacity={0.85}
          >
            <View style={styles.tileIconWrap}>
              <FileText size={20} color="#fff" strokeWidth={2.2} />
            </View>
            <Text style={[styles.tileLabel, { color: "#fff" }]}>Pet Passport</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>

    {/* Pet Picker Modal */}
    <Modal visible={pickerTarget !== null} transparent animationType="slide" onRequestClose={() => setPickerTarget(null)}>
      <Pressable style={styles.overlay} onPress={() => setPickerTarget(null)}>
        <Pressable style={[styles.sheet, { backgroundColor: tk.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />
          <View style={styles.sheetTitleRow}>
            <Text style={[styles.sheetTitle, { color: tk.text }]}>
              {pickerTarget === "passport" ? "Whose passport?" : "Which pet?"}
            </Text>
            <TouchableOpacity onPress={() => setPickerTarget(null)}>
              <X size={20} color={tk.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sheetSub, { color: tk.textMuted }]}>
            {pickerTarget === "passport"
              ? "Select a pet to view their passport"
              : "Select a pet to view health records"}
          </Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            {myPets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                onPress={() => handlePetSelected(pet.id)}
                style={[styles.petRow, { backgroundColor: tk.bg }]}
                activeOpacity={0.8}
              >
                <View style={styles.petEmoji}>
                  <Text style={{ fontSize: 22 }}>{pet.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.petName, { color: tk.text }]}>{pet.name}</Text>
                  <Text style={[styles.petMeta, { color: tk.textMuted }]}>{pet.breed} · {pet.species} · {pet.ageYears}y</Text>
                </View>
                <ChevronRight size={18} color={tk.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    rowGap: 12,
    paddingBottom: 8,
  },
  tile: {
    width: "48%",
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

  // Pet Picker Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 44 },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 20, opacity: 0.2 },
  sheetTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  sheetSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 4 },
  petRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 18, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  petEmoji: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(37,99,235,0.08)", alignItems: "center", justifyContent: "center" },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  petMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
});
