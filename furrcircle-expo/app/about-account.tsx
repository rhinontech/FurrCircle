import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Calendar, MapPin } from "../src/components/ui/icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useLanguage } from "../src/lib/language-context";
import { userApi } from "../services/user/userApi";
import { Avatar } from "../src/components/Avatar";

export default function AboutAccountScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const tk = useTokens();
  const { username, prefilledName, prefilledAvatar } = useLocalSearchParams<{
    username: string;
    prefilledName?: string;
    prefilledAvatar?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    userApi.getUserProfile(username)
      .then(data => {
        setProfile(data);
      })
      .catch(err => {
        console.error("Failed to load profile:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username]);

  const displayName = profile?.name || prefilledName || username;
  const avatarUrl = profile?.avatar_url || prefilledAvatar;

  const getJoinedDate = () => {
    if (profile?.memberSince) return profile.memberSince;
    if (profile?.createdAt) {
      const date = new Date(profile.createdAt);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(
          language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-US",
          { month: "long", year: "numeric" }
        );
      }
    }
    return t("july2015Fallback");
  };

  const getCountry = () => {
    if (profile?.city) return profile.city;
    return t("indiaFallback");
  };

  return (
    <PageContainer noAmbient={true}>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title={t("aboutAccountHeaderTitle")} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatarOutline, { borderColor: tk.border }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <Avatar name={displayName} size={100} />
              )}
            </View>
            <Text style={[styles.usernameText, { color: tk.text }]}>
              {username || profile?.username || "username"}
            </Text>

            <Text style={[styles.introText, { color: tk.textMuted }]}>
              {t("aboutAccountIntroText")}
            </Text>
          </View>

          <View style={styles.infoSection}>
            {/* Date Joined */}
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Calendar size={24} color={tk.text} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: tk.text }]}>{t("dateJoinedLabel")}</Text>
                {loading && !profile ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                ) : (
                  <Text style={[styles.infoValue, { color: tk.textMuted }]}>{getJoinedDate()}</Text>
                )}
              </View>
            </View>

            {/* Account based in */}
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MapPin size={24} color={tk.text} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: tk.text }]}>{t("accountBasedInLabel")}</Text>
                {loading && !profile ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                ) : (
                  <Text style={[styles.infoValue, { color: tk.textMuted }]}>{getCountry()}</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24, paddingBottom: 40 },
  avatarSection: { alignItems: "center", marginBottom: 32, width: "100%" },
  avatarOutline: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1.5,
    padding: 3,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 50 },
  usernameText: { fontFamily: "Poppins_700Bold", fontSize: 18, marginBottom: 12, textAlign: "center" },
  introText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  linkText: { color: "#2563EB", fontFamily: "Inter_600SemiBold" },
  infoSection: { width: "100%", alignSelf: "stretch", gap: 24, marginTop: 12 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  iconContainer: { paddingTop: 2 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 15, marginBottom: 2 },
  infoValue: { fontFamily: "Inter_400Regular", fontSize: 13 },
  loader: { alignSelf: "flex-start", marginTop: 4 },
});
