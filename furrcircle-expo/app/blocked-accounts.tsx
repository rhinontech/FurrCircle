import { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useLanguage } from "../src/lib/language-context";
import { blockApi } from "../services/user/blockApi";
import { ShieldOff } from "../src/components/ui/icons";

const puppy = require("../src/assets/doodle-puppy.png");

export default function BlockedAccountsScreen() {
  const { t } = useLanguage();
  const tk = useTokens();
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      blockApi.getBlockedUsers()
        .then(setBlockedUsers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [])
  );

  const handleUnblock = (user: any) => {
    Alert.alert(
      t("unblockUserTitle").replace("{username}", user.username),
      t("unblockUserSub"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("unblockActionBtn"),
          onPress: async () => {
            setUnblockingId(user.id);
            try {
              await blockApi.unblockUser(user.id);
              setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
            } catch (err: any) {
              Alert.alert(t("errorTitle"), err.message || t("failedToUnblockMsg"));
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title={t("blockedAccountsHeaderTitle")} />

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <ShieldOff size={36} color="#EF4444" />
          </View>
          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 18, color: tk.text, marginBottom: 8 }}>
            {t("noBlockedAccountsTitle")}
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted, textAlign: "center" }}>
            {t("noBlockedAccountsSub")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListHeaderComponent={
            <Text style={[styles.subtitle, { color: tk.textMuted }]}>
              {blockedUsers.length === 1 ? t("blockedAccountsCountSingle").replace("{count}", String(blockedUsers.length)) : t("blockedAccountsCountPlural").replace("{count}", String(blockedUsers.length))}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: tk.card }]}>
              <TouchableOpacity
                onPress={() => router.push(`/u/${item.username}`)}
                style={styles.userInfo}
                activeOpacity={0.7}
              >
                <Image
                  source={item.avatar_url ? { uri: item.avatar_url } : puppy}
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: tk.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.username, { color: tk.textMuted }]} numberOfLines={1}>@{item.username}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleUnblock(item)}
                disabled={unblockingId === item.id}
                style={[styles.unblockBtn, { borderColor: tk.border }]}
                activeOpacity={0.7}
              >
                {unblockingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.unblockText, { color: tk.text }]}>{t("unblockBtnLabel")}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 8, paddingHorizontal: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  userInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,107,107,0.15)" },
  name: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  username: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 1 },
  unblockBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: "center",
  },
  unblockText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
});
