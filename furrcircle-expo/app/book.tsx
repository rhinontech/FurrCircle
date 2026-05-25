import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { Calendar, Clock } from "lucide-react-native";

const timeSlots = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "4:00 PM", "5:30 PM"];

export default function BookScreen() {
  const tk = useTokens();
  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Book Appointment" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 16 }}>
        <View style={[styles.vetCard, { backgroundColor: tk.card }]}>
          <Text style={[styles.vetName, { color: tk.text }]}>Furr Care Clinic</Text>
          <Text style={styles.vetSpec}>General · Surgery · Open now</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Select date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {["Mon 22", "Tue 23", "Wed 24", "Thu 25", "Fri 26"].map((d, i) => (
            <TouchableOpacity key={d} style={[styles.dateBtn, { backgroundColor: tk.card }, i === 0 && styles.dateBtnActive]}>
              <Text style={[styles.dateBtnText, i === 0 && styles.dateBtnTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Select time</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((t, i) => (
            <TouchableOpacity key={t} style={[styles.timeBtn, { backgroundColor: tk.card }, i === 1 && styles.timeBtnActive]}>
              <Clock size={14} color={i === 1 ? colors.white : colors.foreground + "99"} />
              <Text style={[styles.timeBtnText, i === 1 && styles.timeBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.confirmBtn}>
          <Text style={styles.confirmBtnText}>Confirm appointment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  vetCard: { borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  vetName: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  vetSpec: { fontSize: 13, color: colors.success, fontFamily: "Poppins_600SemiBold", marginTop: 2 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, marginBottom: 12, marginTop: 4 },
  dateBtn: { width: 72, paddingVertical: 12, borderRadius: 16, alignItems: "center" },
  dateBtnActive: { backgroundColor: colors.primary },
  dateBtnText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.foreground + "88" },
  dateBtnTextActive: { color: colors.white },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  timeBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  timeBtnActive: { backgroundColor: colors.primary },
  timeBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.foreground + "88" },
  timeBtnTextActive: { color: colors.white },
  confirmBtn: { backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  confirmBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
