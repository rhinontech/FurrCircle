import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { moonaTimeline } from "../src/lib/demo-data";
import { Plus } from "lucide-react-native";

export default function MemoryScreen() {
  const tk = useTokens();
  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Memory Vault" right={
        <TouchableOpacity style={styles.addBtn}><Plus size={18} color={colors.primary} /></TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 16 }}>
        <Text style={styles.subtitle}>Moona's precious moments, saved forever.</Text>
        {moonaTimeline.map((m) => (
          <View key={m.id} style={[styles.card, { backgroundColor: tk.card, borderLeftColor: m.tintColor }]}>
            <View style={[styles.dot, { backgroundColor: m.tintColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>{m.date}</Text>
              <Text style={[styles.title, { color: tk.text }]}>{m.title}</Text>
              <Text style={styles.body}>{m.body}</Text>
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
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(37,99,235,0.1)", alignItems: "center", justifyContent: "center" },
  subtitle: { fontSize: 14, color: colors.foreground + "99", fontFamily: "Inter_400Regular", marginBottom: 16, marginTop: 4 },
  card: { flexDirection: "row", gap: 12, borderRadius: 16, padding: 16, marginBottom: 10, borderLeftWidth: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, flexShrink: 0 },
  date: { fontSize: 11, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  title: { fontFamily: "Poppins_700Bold", fontSize: 14, marginTop: 2 },
  body: { fontSize: 13, color: colors.foreground + "cc", fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 20 },
});
