import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Plus,
  Stethoscope,
  Syringe,
  Pill,
  Bell,
  Clock,
  Calendar,
} from "../src/components/ui/icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { petApi } from "../services/pet/petApi";
import { reminderApi } from "../services/reminder/reminderApi";
import { colors } from "../src/lib/theme";
import { useTokens, useThemeStore } from "../src/lib/theme-store";
import { useLanguage } from "../src/lib/language-context";

const TINT_COLORS = [
  "rgba(255,107,107,0.12)",
  "rgba(37,99,235,0.1)",
  "rgba(255,217,61,0.22)",
  "rgba(255,111,207,0.12)",
  "rgba(76,175,80,0.12)",
];

export default function RemindersScreen() {
  const router = useRouter();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);
  const { t } = useLanguage();

  const [reminders, setReminders] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [fetchedPets, fetchedReminders] = await Promise.all([
        petApi.getMyPets(),
        reminderApi.getMyReminders(),
      ]);
      setPets(fetchedPets || []);
      setReminders(fetchedReminders || []);
    } catch (err) {
      console.error("Error fetching reminders/pets:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleToggle = async (id: string) => {
    try {
      await reminderApi.toggleReminder(id);
      // Update state locally
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isDone: !r.isDone } : r))
      );
    } catch (err) {
      console.error("Error toggling reminder:", err);
      Alert.alert(t("errorTitle"), t("failedToUpdateReminderStatus"));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t("deleteReminderTitle"),
      t("deleteReminderConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("deleteAction"),
          style: "destructive",
          onPress: async () => {
            try {
              await reminderApi.deleteReminder(id);
              setReminders((prev) => prev.filter((r) => r.id !== id));
            } catch (err) {
              console.error("Error deleting reminder:", err);
              Alert.alert(t("errorTitle"), t("failedToDeleteReminder"));
            }
          },
        },
      ]
    );
  };

  return (
    <PageContainer fullWidth={true}>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title={t("remindersHeaderTitle")} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Text style={[styles.sectionTitle, { color: tk.text }]}>
                {t("allRemindersSectionTitle")}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/vets/reminder")}
                style={styles.addBtn}
                activeOpacity={0.8}
              >
                <Plus size={16} color={colors.white} />
                <Text style={styles.addBtnText}>{t("addNewBtn")}</Text>
              </TouchableOpacity>
            </View>

            {reminders.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: tk.card, borderColor: tk.border }]}>
                <Bell size={40} color={tk.textMuted} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyText, { color: tk.text }]}>
                  {t("noRemindersScheduled")}
                </Text>
                <Text style={[styles.emptySub, { color: tk.textMuted }]}>
                  {t("noRemindersDescription")}
                </Text>
              </View>
            ) : (
              reminders.map((r, i) => {
                const pet = pets.find((p) => p.id === r.petId);
                const IconComponent =
                  r.type === "appointment"
                    ? Stethoscope
                    : (r.type === "vaccination" || r.type === "vaccine")
                    ? Syringe
                    : r.type === "medication"
                    ? Pill
                    : Bell;

                let dateText = t("noDateLabel");
                let timeText = t("noTimeLabel");
                if (r.date) {
                   const dt = new Date(`${r.date}T${r.time || "00:00"}`);
                  dateText = dt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  timeText = dt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }

                const tintBg = TINT_COLORS[i % TINT_COLORS.length];

                return (
                  <View
                    key={r.id}
                    style={[
                      styles.reminderCard,
                      { backgroundColor: tk.card, borderColor: tk.border },
                      r.isDone && { opacity: 0.7 },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <TouchableOpacity
                        onPress={() => handleToggle(r.id)}
                        style={styles.checkArea}
                        activeOpacity={0.7}
                      >
                        {r.isDone ? (
                          <CheckCircle2 size={22} color={colors.success} fill={colors.success + "22"} />
                        ) : (
                          <Circle size={22} color={tk.textMuted} />
                        )}
                        <View style={styles.titleColumn}>
                          <Text
                            style={[
                              styles.reminderTitle,
                              { color: tk.text },
                              r.isDone && { textDecorationLine: "line-through", color: tk.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {r.title}
                          </Text>
                          <Text style={[styles.petName, { color: colors.primary }]}>
                            {pet?.name || t("allPetsFallback")}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/vets/reminder",
                              params: { id: r.id },
                            })
                          }
                          style={[styles.actionBtn, { backgroundColor: tk.bg }]}
                        >
                          <Edit2 size={14} color={tk.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(r.id)}
                          style={[styles.actionBtn, { backgroundColor: tk.bg }]}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={[styles.cardDivider, { backgroundColor: tk.border }]} />

                    <View style={styles.cardFooter}>
                      <View style={[styles.badge, { backgroundColor: tintBg }]}>
                        <IconComponent size={14} color={tk.text} style={{ marginRight: 6 }} />
                        <Text style={[styles.badgeText, { color: tk.text }]}>
                          {(r.type === "appointment"
                            ? t("reminderTypeAppointment")
                            : (r.type === "vaccination" || r.type === "vaccine")
                            ? t("reminderTypeVaccination")
                            : r.type === "medication"
                            ? t("reminderTypeMedication")
                            : r.type === "grooming"
                            ? t("reminderTypeGrooming")
                            : t("reminderTypeOther")).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.timeInfo}>
                        <Calendar size={13} color={tk.textMuted} style={{ marginRight: 4 }} />
                        <Text style={[styles.timeText, { color: tk.textMuted }]}>
                          {dateText}
                        </Text>
                        <Clock size={13} color={tk.textMuted} style={{ marginLeft: 10, marginRight: 4 }} />
                        <Text style={[styles.timeText, { color: tk.textMuted }]}>
                          {timeText}
                        </Text>
                      </View>
                    </View>

                    {r.notes ? (
                      <View style={[styles.notesContainer, { backgroundColor: tk.bg }]}>
                        <Text style={[styles.notesText, { color: tk.textMuted }]} numberOfLines={2}>
                          {r.notes}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  addBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: colors.white,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 32,
    marginTop: 20,
  },
  emptyText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  reminderCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkArea: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  titleColumn: {
    marginLeft: 12,
    flex: 1,
  },
  reminderTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  petName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  notesContainer: {
    marginTop: 12,
    borderRadius: 10,
    padding: 10,
  },
  notesText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
});
