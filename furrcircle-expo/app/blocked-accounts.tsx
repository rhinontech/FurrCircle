import { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { blockApi } from "../services/user/blockApi";
import { ShieldOff } from "lucide-react-native";

const puppy = require("../src/assets/doodle-puppy.png");

export default function BlockedAccountsScreen() {
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
      `Unblock @${user.username}?`,
      `They will be able to see your profile and contact you again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            setUnblockingId(user.id);
            try {
              await blockApi.unblockUser(user.id);
              setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to unblock user");
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
      <ScreenHeader title="Blocked Accounts" />

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
            No blocked accounts
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted, textAlign: "center" }}>
            Users you block will appear here. You can unblock them at any time.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListHeaderComponent={
            <Text style={[styles.subtitle, { color: tk.textMuted }]}>
              {blockedUsers.length} blocked {blockedUsers.length === 1 ? "account" : "accounts"}
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
                  <Text style={[styles.unblockText, { color: tk.text }]}>Unblock</Text>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
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
