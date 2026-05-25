import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { Scale, Syringe, Pill, CheckCircle } from "lucide-react-native";

const todayTasks = [
  { id: "t1", title: "Morning walk — 30 min", done: true, icon: CheckCircle, tintColor: "rgba(76,175,80,0.15)" },
  { id: "t2", title: "Flea & tick tablet", done: false, icon: Pill, tintColor: "rgba(37,99,235,0.1)" },
  { id: "t3", title: "Monthly weight log", done: false, icon: Scale, tintColor: "rgba(255,217,61,0.3)" },
  { id: "t4", title: "Bordetella due in 2 weeks", done: false, icon: Syringe, tintColor: "rgba(255,107,107,0.15)", urgent: true },
];

export default function TodayScreen() {
  const tk = useTokens();
  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Today" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 16 }}>
        <Text style={styles.dateLabel}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</Text>
        {todayTasks.map((t) => (
          <View key={t.id} style={[styles.card, { backgroundColor: tk.card }, t.done && styles.cardDone]}>
            <View style={[styles.icon, { backgroundColor: t.tintColor }]}>
              <t.icon size={20} color={t.done ? colors.success : colors.foreground} strokeWidth={2} />
            </View>
            <Text style={[styles.taskTitle, { color: tk.text }, t.done && styles.taskDone]}>{t.title}</Text>
            {t.urgent && <View style={styles.urgentBadge}><Text style={styles.urgentText}>URGENT</Text></View>}
          </View>
        ))}
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateLabel: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.foreground + "88", marginBottom: 16, marginTop: 8 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardDone: { opacity: 0.6 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  taskTitle: { flex: 1, fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  taskDone: { textDecorationLine: "line-through", color: colors.foreground + "88" },
  urgentBadge: { backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  urgentText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.coral },
});
