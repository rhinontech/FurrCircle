import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PageContainer } from "../../src/components/PageContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useTokens } from "../../src/lib/theme-store";
import { useLanguage } from "../../src/lib/language-context";
import { colors } from "../../src/lib/theme";
import { userApi } from "../../services/user/userApi";
import { MapPin } from "../../src/components/ui/icons";

const puppy = require("../../src/assets/doodle-puppy.png");

export default function FollowersScreen() {
  const { t } = useLanguage();
  const { userId, type, title } = useLocalSearchParams<{ userId: string; type: "followers" | "following"; title: string }>();
  const router = useRouter();
  const tk = useTokens();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fn = type === "following" ? userApi.getFollowing : userApi.getFollowers;
    fn(userId)
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [userId, type]);

  return (
    <PageContainer noAmbient={true}>
      <View style={{ flex: 1, backgroundColor: tk.bg }}>
        <ScreenHeader title={title || (type === "following" ? t("followingLabel") : t("followersLabel"))} />

        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : users.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Image source={puppy} style={{ width: 80, height: 80, opacity: 0.4 }} resizeMode="contain" />
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted }}>
              {type === "following" ? t("notFollowingAnyoneYet") : t("noFollowersYet")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: tk.border }} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/u/${item.username || item.id}`)}
                style={styles.row}
                activeOpacity={0.7}
              >
                <Image
                  source={item.avatar_url?.startsWith("http") ? { uri: item.avatar_url } : puppy}
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.name, { color: tk.text }]} numberOfLines={1}>
                    {item.name || item.username}
                  </Text>
                  <Text style={[styles.username, { color: tk.textMuted }]} numberOfLines={1}>
                    @{item.username}
                  </Text>
                  {item.city ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                      <MapPin size={11} color={tk.textMuted} />
                      <Text style={[styles.city, { color: tk.textMuted }]}>{item.city}</Text>
                    </View>
                  ) : null}
                </View>
                {item.verified ? (
                  <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>✓</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#f0f0f0" },
  name: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  username: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  city: { fontFamily: "Inter_400Regular", fontSize: 11 },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 13 },
});
