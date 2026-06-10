import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { Check, Heart, ArrowRight, ChevronRight } from "lucide-react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useAuthStore } from "../src/lib/auth-store";
import { petApi } from "../services/pet/petApi";

const boyDog = require("../src/assets/doodle-boy-dog.png");
const stethoscope = require("../src/assets/icon-stethoscope.png");
const party = require("../src/assets/icon-party.png");
const walk = require("../src/assets/doodle-walk.png");

export default function TodayScreen() {
  const tk = useTokens();
  const router = useRouter();
  const { user } = useAuthStore();

  const [petName, setPetName] = useState("Moona");

  useFocusEffect(
    useCallback(() => {
      petApi.getMyPets()
        .then((fetchedPets) => {
          if (fetchedPets && fetchedPets.length > 0) {
            const randomIndex = Math.floor(Math.random() * fetchedPets.length);
            setPetName(fetchedPets[randomIndex].name || "Moona");
          }
        })
        .catch(console.error);
    }, [])
  );

  const greetingName = user?.name || user?.username || "Goutham";

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Today" />
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Greeting */}
          <View style={styles.greetingWrap}>
            <Text style={[styles.greetingSub, { color: tk.textMuted }]}>Hi {greetingName} 👋</Text>
            <Text style={[styles.greetingTitle, { color: tk.text }]}>{`How is ${petName}\ndoing today?`}</Text>
          </View>

          {/* Status card */}
          <View style={styles.px5}>
            <View style={[styles.statusCard, { backgroundColor: tk.card }]}>
              <View style={styles.statusCardInner}>
                {/* Status rows */}
                <View style={styles.statusList}>
                  <StatusRow color="success" label="Park Walk" tk={tk} />
                  <StatusRow color="success" label="Food" meta="3/3" tk={tk} />
                  <StatusRow color="sunshine" label="Snack" meta="1/2" tk={tk} />
                  <View style={[styles.divider, { backgroundColor: tk.border }]} />
                  <StatusRow color="pinky" label="Good" meta="87%" icon="heart" tk={tk} />
                </View>
                {/* Dog image */}
                <Image source={boyDog} style={styles.dogImg} resizeMode="contain" />
              </View>
            </View>
          </View>

          {/* Upcoming events header */}
          <View style={styles.eventsHeader}>
            <Text style={[styles.eventsTitle, { color: tk.text }]}>Upcoming</Text>
            {/* <ArrowRight size={20} color={tk.text} /> */}
          </View>

          {/* Event cards */}
          <View style={styles.px5}>
            <EventCard
              bg={colors.primary}
              icon={stethoscope}
              title="Manage Care"
              subtitle="Reminders & Schedules"
              onPress={() => router.push("/reminders")}
              textColor={colors.white}
              imgStyle={styles.eventIconImg}
            />
            <EventCard
              bg={colors.coral}
              icon={party}
              title="Upcoming Birthdays"
              subtitle="Celebrate special days"
              onPress={() => router.push("/birthdays")}
              textColor={colors.white}
              imgStyle={styles.eventIconImg}
            />
            <EventCard
              bg={colors.sunshine}
              icon={walk}
              title="Weekend Playdate"
              subtitle="Match with nearby pets"
              onPress={() => router.push("/match")}
              textColor={colors.foreground}
              imgStyle={styles.eventIconImgLg}
            />
          </View>
        </ScrollView>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  px5: { paddingHorizontal: 20 },
  greetingWrap: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  greetingSub: { fontFamily: "Poppins_400Regular", fontSize: 15 },
  greetingTitle: { fontFamily: "Poppins_700Bold", fontSize: 30, lineHeight: 36, marginTop: 6 },
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
});
