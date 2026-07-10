import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Gift, Calendar, Cake, ChevronLeft } from "../src/components/ui/icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { Avatar } from "../src/components/Avatar";
import { petApi } from "../services/pet/petApi";
import { colors } from "../src/lib/theme";
import { useTokens, useThemeStore } from "../src/lib/theme-store";
import { useLanguage } from "../src/lib/language-context";

const { width } = Dimensions.get("window");

const TINT_COLORS = [
  "rgba(255,107,107,0.12)",
  "rgba(37,99,235,0.1)",
  "rgba(255,217,61,0.22)",
  "rgba(255,111,207,0.12)",
  "rgba(76,175,80,0.12)",
];

interface BirthdayPet {
  id: string;
  name: string;
  avatar_url: string | null;
  breed: string | null;
  species: string;
  birth_date: string;
  daysRemaining: number;
  nextAge: number;
  formattedDate: string;
}

export default function BirthdaysScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);

  const [pets, setPets] = useState<BirthdayPet[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateBirthdays = (fetchedPets: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list: BirthdayPet[] = [];

    fetchedPets.forEach((pet) => {
      if (!pet.birth_date) return;

      const dob = new Date(pet.birth_date);
      if (isNaN(dob.getTime())) return;

      // Find next birthday
      const currentYear = today.getFullYear();
      let nextBday = new Date(currentYear, dob.getMonth(), dob.getDate());
      nextBday.setHours(0, 0, 0, 0);

      if (nextBday < today) {
        nextBday.setFullYear(currentYear + 1);
      }

      // Calculate days remaining
      const diffTime = nextBday.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Calculate next age
      const nextAge = nextBday.getFullYear() - dob.getFullYear();

      // Format date
      const localeCode = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : 'en-US');
      const formattedDate = nextBday.toLocaleDateString(localeCode, {
        month: "long",
        day: "numeric",
      });

      list.push({
        id: pet.id,
        name: pet.name,
        avatar_url: pet.avatar_url,
        breed: pet.breed,
        species: pet.species,
        birth_date: pet.birth_date,
        daysRemaining,
        nextAge,
        formattedDate,
      });
    });

    // Sort by days remaining
    list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    setPets(list);
  };

  const loadPets = async () => {
    try {
      const data = await petApi.getMyPets();
      calculateBirthdays(data || []);
    } catch (err) {
      console.error("Error loading pets for birthdays:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [])
  );

  return (
    <PageContainer fullWidth={true}>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title={t("petBirthdaysHeaderTitle")} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerSection}>
              <Cake size={36} color={colors.primary} style={styles.cakeIcon} />
              <Text style={[styles.titleText, { color: tk.text }]}>
                {t("upcomingCelebrationsTitle")}
              </Text>
              <Text style={[styles.subText, { color: tk.textMuted }]}>
                {t("upcomingCelebrationsSub")}
              </Text>
            </View>

            {pets.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: tk.card, borderColor: tk.border }]}>
                <Gift size={40} color={tk.textMuted} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyText, { color: tk.text }]}>
                  {t("noBirthdaysFoundTitle")}
                </Text>
                <Text style={[styles.emptySub, { color: tk.textMuted }]}>
                  {t("noBirthdaysFoundSub")}
                </Text>
              </View>
            ) : (
              pets.map((pet, i) => {
                const tintBg = TINT_COLORS[i % TINT_COLORS.length];
                
                let countdownText = "";
                if (pet.daysRemaining === 0 || pet.daysRemaining === 365) {
                  countdownText = t("todayCelebration");
                } else if (pet.daysRemaining === 1) {
                  countdownText = t("tomorrowCelebration");
                } else {
                  countdownText = t("inDaysCelebration").replace("{days}", String(pet.daysRemaining));
                }

                return (
                  <TouchableOpacity
                    key={pet.id}
                    onPress={() =>
                      router.push({
                        pathname: "/pet",
                        params: { id: pet.id },
                      })
                    }
                    style={[
                      styles.petCard,
                      { backgroundColor: tk.card, borderColor: tk.border },
                    ]}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardMain}>
                      <Avatar
                        source={
                          pet.avatar_url
                            ? { uri: pet.avatar_url }
                            : require("../src/assets/doodle-puppy.png")
                        }
                        name={pet.name}
                        size={60}
                      />
                      <View style={styles.infoColumn}>
                        <Text style={[styles.petName, { color: tk.text }]}>
                          {pet.name}
                        </Text>
                        <Text style={[styles.petBreed, { color: tk.textMuted }]}>
                          {pet.breed || pet.species}
                        </Text>
                        <Text style={[styles.turningText, { color: colors.primary }]}>
                          {pet.nextAge === 1 ? t("turningYearOld").replace("{age}", String(pet.nextAge)) : t("turningYearsOld").replace("{age}", String(pet.nextAge))}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: tk.border }]} />

                    <View style={styles.cardFooter}>
                      <View style={styles.dateWrap}>
                        <Calendar size={15} color={tk.textMuted} style={{ marginRight: 6 }} />
                        <Text style={[styles.dateText, { color: tk.text }]}>
                          {pet.formattedDate}
                        </Text>
                      </View>

                      <View style={[styles.countdownBadge, { backgroundColor: tintBg }]}>
                        <Text style={[styles.countdownText, { color: tk.text }]}>
                          {countdownText}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
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
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  cakeIcon: {
    marginBottom: 10,
  },
  titleText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    textAlign: "center",
  },
  subText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 32,
    marginTop: 10,
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
  petCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoColumn: {
    marginLeft: 16,
    flex: 1,
  },
  petName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
  },
  petBreed: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  turningText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  countdownBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countdownText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },
});
