import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useLanguage } from "../src/lib/language-context";
import { Calendar, Clock } from "../src/components/ui/icons";

const timeSlots = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "4:00 PM", "5:30 PM"];

export default function BookScreen() {
  const { t } = useLanguage();
  const tk = useTokens();
  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title={t("bookAppointmentHeaderTitle")} />
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 16 }}>
        <View style={[styles.vetCard, { backgroundColor: tk.card }]}>
          <Text style={[styles.vetName, { color: tk.text }]}>Furr Care Clinic</Text>
          <Text style={styles.vetSpec}>{t("vetCardShortInfo")}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>{t("selectDateLabel")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {[
            { key: "monShort", date: "22" },
            { key: "tueShort", date: "23" },
            { key: "wedShort", date: "24" },
            { key: "thuShort", date: "25" },
            { key: "friShort", date: "26" },
          ].map((item, i) => {
            const isActive = i === 0;
            const displayStr = `${t(item.key as any)} ${item.date}`;
            return (
              <TouchableOpacity key={item.key} style={[styles.dateBtn, { backgroundColor: isActive ? colors.primary : tk.card }]}>
                <Text style={[styles.dateBtnText, { color: isActive ? colors.white : tk.textMuted }]}>{displayStr}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={[styles.sectionTitle, { color: tk.text }]}>{t("selectTimeLabel")}</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((tVal, i) => {
            const isActive = i === 1;
            return (
              <TouchableOpacity key={tVal} style={[styles.timeBtn, { backgroundColor: isActive ? colors.primary : tk.card }]}>
                <Clock size={14} color={isActive ? colors.white : tk.textMuted} />
                <Text style={[styles.timeBtnText, { color: isActive ? colors.white : tk.textMuted }]}>{tVal}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={styles.confirmBtn}>
          <Text style={styles.confirmBtnText}>{t("confirmAppointmentBtn")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  vetCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
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
