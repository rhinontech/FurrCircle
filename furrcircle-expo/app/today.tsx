import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { Check, Heart, ChevronRight, Plus, ChevronDown } from "../src/components/ui/icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useLanguage } from "../src/lib/language-context";
import { useAuthStore } from "../src/lib/auth-store";
import { petApi } from "../services/pet/petApi";
import { AdaptiveSheet } from "../src/components/AdaptiveSheet";
import { Avatar } from "../src/components/Avatar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const boyDog = require("../src/assets/doodle-boy-dog.png");
const stethoscope = require("../src/assets/icon-stethoscope.png");
const party = require("../src/assets/icon-party.png");
const walk = require("../src/assets/doodle-walk.png");

export default function TodayScreen() {
  const tk = useTokens();
  const router = useRouter();
  const { user } = useAuthStore();
  const { petId: paramPetId } = useLocalSearchParams<{ petId?: string }>();
  const { t } = useLanguage();

  const [pets, setPets] = useState<any[]>([]);
  const [activePet, setActivePet] = useState<any>(null);
  const [dailyLog, setDailyLog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLog, setIsLoadingLog] = useState(false);

  // Modals state
  const [isPetPickerOpen, setIsPetPickerOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form state
  const [formAppetite, setFormAppetite] = useState<string>("normal");
  const [formWater, setFormWater] = useState<string>("normal");
  const [formMood, setFormMood] = useState<string>("normal");

  const loadPets = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedPets = await petApi.getMyPets();
      setPets(fetchedPets || []);
      
      if (fetchedPets && fetchedPets.length > 0) {
        let selected = fetchedPets[0];
        if (paramPetId) {
          const found = fetchedPets.find((p: any) => p.id === paramPetId);
          if (found) selected = found;
        }
        setActivePet(selected);
      }
    } catch (err) {
      console.error("loadPets Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [paramPetId]);

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets])
  );

  // Fetch daily log when activePet changes
  useEffect(() => {
    if (activePet?.id) {
      setIsLoadingLog(true);
      petApi.getDailyLog(activePet.id)
        .then((log) => {
          setDailyLog(log);
        })
        .catch(console.error)
        .finally(() => setIsLoadingLog(false));
    } else {
      setDailyLog(null);
    }
  }, [activePet?.id]);

  const openLogModal = () => {
    if (dailyLog) {
      setFormAppetite(dailyLog.appetite || "normal");
      setFormWater(dailyLog.waterIntake || "normal");
      setFormMood(dailyLog.mood || "normal");
    } else {
      setFormAppetite("normal");
      setFormWater("normal");
      setFormMood("normal");
    }
    setIsLogModalOpen(true);
  };

  const handleSaveLog = async () => {
    if (!activePet) return;
    try {
      const payload = {
        appetite: formAppetite,
        waterIntake: formWater,
        mood: formMood
      };
      const updatedLog = await petApi.upsertDailyLog(activePet.id, payload);
      setDailyLog(updatedLog);
      setIsLogModalOpen(false);
    } catch (err) {
      console.error("handleSaveLog Error:", err);
    }
  };

  const greetingName = user?.name || user?.username || "Goutham";

  // Calculate percentage and mood text
  const getLogStats = (log: any) => {
    if (!log) return { statusText: t("noData"), percentage: 0, statusColor: "pinky" as const };
    
    const appetiteVal = log.appetite === "good" ? 2 : log.appetite === "normal" ? 1 : 0;
    const waterVal = log.waterIntake === "good" ? 2 : log.waterIntake === "normal" ? 1 : 0;
    const moodVal = log.mood === "good" ? 2 : log.mood === "normal" ? 1 : 0;
    
    const sum = appetiteVal + waterVal + moodVal;
    const pct = Math.round((sum / 6) * 100);
    
    let statusText = t("normalLabel");
    let statusColor: "success" | "sunshine" | "pinky" = "sunshine";
    
    if (pct >= 70) {
      statusText = t("goodLabel");
      statusColor = "success";
    } else if (pct < 40) {
      statusText = t("badLabel");
      statusColor = "pinky";
    }
    
    return { statusText, percentage: pct, statusColor };
  };

  const { statusText, percentage, statusColor } = getLogStats(dailyLog);

  const valueColorMap = {
    good: "success" as const,
    normal: "sunshine" as const,
    bad: "pinky" as const
  };

  return (
    <PageContainer fullWidth={true}>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader 
          title={t("todayHeaderTitle")} 
          right={
            activePet ? (
              <TouchableOpacity onPress={openLogModal} style={[styles.headerPlusBtn, { backgroundColor: tk.card, borderColor: tk.glassBorder }]}>
                <Plus size={20} color={tk.text} strokeWidth={2.5} />
              </TouchableOpacity>
            ) : undefined
          }
        />
        
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Greeting */}
            <View style={styles.greetingWrap}>
              <Text style={[styles.greetingSub, { color: tk.textMuted }]}>{t("hiGreeting").replace("{name}", greetingName)}</Text>
              
              {pets.length > 0 ? (
                <TouchableOpacity onPress={() => setIsPetPickerOpen(true)} activeOpacity={0.7} style={styles.greetingTitleRow}>
                  <Text style={[styles.greetingTitle, { color: tk.text }]}>
                    {t("howIsPetDoingToday").replace("{name}", activePet?.name || "Moona")}
                  </Text>
                  <View style={[styles.chevronDownWrap, { backgroundColor: tk.card }]}>
                    <ChevronDown size={18} color={tk.text} />
                  </View>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.greetingTitle, { color: tk.text }]}>
                  {t("pleaseAddPetToGetStarted")}
                </Text>
              )}
            </View>

            {/* Status card */}
            {activePet && (
              <View style={styles.px5}>
                <TouchableOpacity onPress={openLogModal} activeOpacity={0.92}>
                  <View style={[styles.statusCard, { backgroundColor: tk.card, borderColor: tk.glassBorder, borderWidth: 1 }]}>
                    {isLoadingLog ? (
                      <View style={styles.cardLoadingWrap}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    ) : (
                      <View style={styles.statusCardInner}>
                        {/* Status rows */}
                        <View style={styles.statusList}>
                          <StatusRow 
                            color={dailyLog ? valueColorMap[dailyLog.appetite as "good" | "normal" | "bad"] : "sunshine"} 
                            label={t("appetiteLabel")} 
                            meta={dailyLog ? (dailyLog.appetite === "good" ? t("goodLabel") : dailyLog.appetite === "normal" ? t("normalLabel") : t("badLabel")) : t("notLogged")} 
                            tk={tk} 
                          />
                          <StatusRow 
                            color={dailyLog ? valueColorMap[dailyLog.waterIntake as "good" | "normal" | "bad"] : "sunshine"} 
                            label={t("waterIntakeLabel")} 
                            meta={dailyLog ? (dailyLog.waterIntake === "good" ? t("goodLabel") : dailyLog.waterIntake === "normal" ? t("normalLabel") : t("badLabel")) : t("notLogged")} 
                            tk={tk} 
                          />
                          <StatusRow 
                            color={dailyLog ? valueColorMap[dailyLog.mood as "good" | "normal" | "bad"] : "sunshine"} 
                            label={t("moodLabel")} 
                            meta={dailyLog ? (dailyLog.mood === "good" ? t("goodLabel") : dailyLog.mood === "normal" ? t("normalLabel") : t("badLabel")) : t("notLogged")} 
                            tk={tk} 
                          />
                          
                          <View style={[styles.divider, { backgroundColor: tk.border }]} />
                          
                          <StatusRow 
                            color={statusColor} 
                            label={statusText} 
                            meta={dailyLog ? `${percentage}%` : "--%"} 
                            icon="heart" 
                            tk={tk} 
                          />
                        </View>
                        {/* Dog image */}
                        <Image source={boyDog} style={styles.dogImg} resizeMode="contain" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {!dailyLog && !isLoadingLog && (
                  <TouchableOpacity onPress={openLogModal} style={[styles.logBtn, { backgroundColor: colors.primary }]} activeOpacity={0.9}>
                    <Plus size={16} color={colors.white} strokeWidth={3} />
                    <Text style={styles.logBtnText}>{t("logTodaysCare")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Upcoming events header */}
            <View style={styles.eventsHeader}>
              <Text style={[styles.eventsTitle, { color: tk.text }]}>{t("upcomingSectionTitle")}</Text>
            </View>

            {/* Event cards */}
            <View style={styles.px5}>
              <EventCard
                bg={colors.primary}
                icon={stethoscope}
                title={t("manageCareTitle")}
                subtitle={t("remindersSchedulesSub")}
                onPress={() => router.push("/reminders")}
                textColor={colors.white}
                imgStyle={styles.eventIconImg}
              />
              <EventCard
                bg={colors.coral}
                icon={party}
                title={t("upcomingBirthdaysTitle")}
                subtitle={t("celebrateSpecialDaysSub")}
                onPress={() => router.push("/birthdays")}
                textColor={colors.white}
                imgStyle={styles.eventIconImg}
              />
              <EventCard
                bg={colors.sunshine}
                icon={walk}
                title={t("weekendPlaydateTitle")}
                subtitle={t("matchWithNearbyPetsSub")}
                onPress={() => router.push("/match")}
                textColor={colors.foreground}
                imgStyle={styles.eventIconImgLg}
              />
            </View>
          </ScrollView>
        )}

        {/* Pet Picker Bottom Sheet */}
        <PetPickerModal
          open={isPetPickerOpen}
          onClose={() => setIsPetPickerOpen(false)}
          pets={pets}
          activePetId={activePet?.id}
          onSelect={(petId: string) => {
            const found = pets.find((p) => p.id === petId);
            if (found) setActivePet(found);
          }}
          tk={tk}
        />

        {/* Log Entry Bottom Sheet */}
        <LogEntryModal
          open={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          petName={activePet?.name}
          appetite={formAppetite}
          waterIntake={formWater}
          mood={formMood}
          setAppetite={setFormAppetite}
          setWaterIntake={setFormWater}
          setMood={setFormMood}
          onSave={handleSaveLog}
          tk={tk}
        />
      </View>
    </PageContainer>
  );
}

function StatusRow({ color, label, meta, icon, tk }: { color: "success" | "sunshine" | "pinky"; label: string; meta?: string; icon?: "heart"; tk: any }) {
  const bgMap = { success: colors.success, sunshine: colors.sunshine, pinky: colors.pinky };
  const bg = bgMap[color];
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, { backgroundColor: bg }]}>
        {icon === "heart"
          ? <Heart size={14} color={colors.white} fill={colors.white} />
          : <Check size={14} color={colors.white} strokeWidth={3} />}
      </View>
      <Text style={[styles.statusLabel, { color: tk.text }]}>{label}</Text>
      {meta && <Text style={[styles.statusMeta, { color: tk.textMuted }]}>{meta}</Text>}
    </View>
  );
}

function EventCard({ bg, icon, title, subtitle, onPress, textColor, imgStyle }: {
  bg: string; icon: any; title: string; subtitle: string;
  onPress: () => void; textColor: string; imgStyle: any;
}) {
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={[styles.eventCard, { backgroundColor: bg }]}>
      <View style={styles.eventIconWrap}>
        <Image source={icon} style={imgStyle} resizeMode="contain" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eventCardText, { color: textColor }]}>{title}</Text>
        <Text style={[styles.eventCardSubText, { color: textColor, opacity: 0.85 }]}>{subtitle}</Text>
      </View>
      <ChevronRight size={22} color={textColor} />
    </TouchableOpacity>
  );
}

function PetPickerModal({ open, onClose, pets, activePetId, onSelect, tk }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  return (
    <AdaptiveSheet visible={open} onClose={onClose} maxWidth={420}>
      <View style={{ padding: 20, paddingBottom: 20 + insets.bottom }}>
        <Text style={[styles.modalTitle, { color: tk.text }]}>{t("chooseAPetTitle")}</Text>
        <ScrollView style={styles.petListScroll} showsVerticalScrollIndicator={false}>
          {pets.map((pet: any) => (
            <TouchableOpacity
              key={pet.id}
              onPress={() => {
                onSelect(pet.id);
                onClose();
              }}
              style={[
                styles.petRow, 
                { borderBottomColor: tk.border },
                pet.id === activePetId && { backgroundColor: tk.border, borderRadius: 12 }
              ]}
            >
              <Avatar source={pet.avatar_url ? { uri: pet.avatar_url } : require("../src/assets/doodle-puppy.png")} name={pet.name} size={40} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.petNameText, { color: tk.text }]}>{pet.name}</Text>
                <Text style={[styles.petBreedText, { color: tk.textMuted }]}>{pet.breed || pet.species}</Text>
              </View>
              {pet.id === activePetId ? (
                <View style={[styles.activeIndicator, { backgroundColor: colors.success }]}>
                  <Check size={12} color={colors.white} strokeWidth={3} />
                </View>
              ) : (
                <ChevronRight size={16} color={tk.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </AdaptiveSheet>
  );
}

function LogEntryModal({ open, onClose, petName, appetite, waterIntake, mood, setAppetite, setWaterIntake, setMood, onSave, tk }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const options = [
    { label: t("badLabel"), value: "bad", bg: colors.pinky, text: colors.white },
    { label: t("normalLabel"), value: "normal", bg: colors.sunshine, text: colors.foreground },
    { label: t("goodLabel"), value: "good", bg: colors.success, text: colors.white },
  ];

  const OptionSelector = ({ label, currentValue, onChange }: any) => (
    <View style={styles.selectorSection}>
      <Text style={[styles.sectionLabel, { color: tk.text }]}>{label}</Text>
      <View style={styles.optionGroup}>
        {options.map((opt) => {
          const isSelected = currentValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.optionBtn,
                { borderColor: tk.border, backgroundColor: isSelected ? opt.bg : "transparent" }
              ]}
            >
              <Text style={[styles.optionText, { color: isSelected ? opt.text : tk.text }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <AdaptiveSheet visible={open} onClose={onClose} maxWidth={420}>
      <View style={{ padding: 20, paddingBottom: 20 + insets.bottom }}>
        <Text style={[styles.modalTitle, { color: tk.text }]}>{t("logDailyCareTitle")}</Text>
        <Text style={[styles.modalSubtitle, { color: tk.textMuted }]}>{t("howIsPetDoingTodaySubtitle").replace("{name}", petName || t("yourPetFallback"))}</Text>

        <OptionSelector label={t("appetiteLabel")} currentValue={appetite} onChange={setAppetite} />
        <OptionSelector label={t("waterIntakeLabel")} currentValue={waterIntake} onChange={setWaterIntake} />
        <OptionSelector label={t("moodLabel")} currentValue={mood} onChange={setMood} />

        <TouchableOpacity onPress={onSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>{t("saveLogBtn")}</Text>
        </TouchableOpacity>
      </View>
    </AdaptiveSheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px5: { paddingHorizontal: 20 },
  greetingWrap: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  greetingSub: { fontFamily: "Poppins_400Regular", fontSize: 15 },
  greetingTitle: { fontFamily: "Poppins_700Bold", fontSize: 30, lineHeight: 36 },
  greetingTitleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" },
  chevronDownWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  statusCard: { borderRadius: 24, padding: 20 },
  statusCardInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusList: { flex: 1, gap: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  statusLabel: { fontFamily: "Poppins_500Medium", fontSize: 16 },
  statusMeta: { fontSize: 13, fontFamily: "Inter_400Regular", marginLeft: 6 },
  divider: { height: 1, width: 120, marginVertical: 2 },
  dogImg: { width: 120, height: 180 },
  eventsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 28, marginBottom: 14 },
  eventsTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 18 },
  eventCard: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 20, marginBottom: 12 },
  eventIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  eventIconImg: { width: 38, height: 38 },
  eventIconImgLg: { width: 52, height: 52 },
  eventCardText: { fontFamily: "Poppins_600SemiBold", fontSize: 18, lineHeight: 24 },
  eventCardSubText: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18, marginTop: 2 },
  
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardLoadingWrap: { padding: 40, justifyContent: "center", alignItems: "center", width: "100%" },
  headerPlusBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  logBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 14, marginTop: 12 },
  logBtnText: { color: colors.white, fontFamily: "Poppins_700Bold", fontSize: 14 },
  
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  modalSubtitle: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 2 },
  petListScroll: { maxHeight: 300, marginTop: 12 },
  petRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, paddingHorizontal: 8 },
  petNameText: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  petBreedText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  activeIndicator: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  
  selectorSection: { marginVertical: 4 },
  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  optionGroup: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 8, marginBottom: 14 },
  optionBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  optionText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  saveBtn: { borderRadius: 16, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  saveBtnText: { color: colors.white, fontFamily: "Poppins_700Bold", fontSize: 15 },
});
