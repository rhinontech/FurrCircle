import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../src/lib/theme";

const { height } = Dimensions.get("window");

const steps = [
  { title: "Welcome to FurrCircle", desc: "The social ecosystem for modern pet parents.", img: require("../src/assets/doodle-group.png"), tintColor: "rgba(255,107,107,0.15)" },
  { title: "Connect with your community", desc: "Join circles, discover local vets, and find playdates.", img: require("../src/assets/doodle-community.png"), tintColor: "rgba(37,99,235,0.1)" },
  { title: "Track your pet's health", desc: "Vaccines, vitals, meds — everything in one place.", img: require("../src/assets/doodle-vet.png"), tintColor: "rgba(76,175,80,0.15)" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={[styles.hero, { backgroundColor: steps[0].tintColor }]}>
        <Image source={steps[0].img} style={styles.heroImg} resizeMode="contain" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{steps[0].title}</Text>
        <Text style={styles.desc}>{steps[0].desc}</Text>
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>Get started</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: height * 0.5, alignItems: "center", justifyContent: "center" },
  heroImg: { width: "70%", height: "80%" },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 32, alignItems: "center" },
  title: { fontFamily: "Poppins_700Bold", fontSize: 26, color: colors.foreground, textAlign: "center", lineHeight: 34 },
  desc: { fontSize: 15, color: colors.foreground + "99", fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 12, lineHeight: 24 },
  dots: { flexDirection: "row", gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(26,26,46,0.2)" },
  dotActive: { width: 24, backgroundColor: colors.primary },
  ctaBtn: { marginTop: 32, width: "100%", backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  ctaBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  skipBtn: { marginTop: 16, paddingVertical: 8 },
  skipText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.foreground + "66" },
});
