import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Settings, ChevronRight, Bell, MessageCircle, MapPin, Award, Sun, CalendarDays, Siren, Stethoscope, Share2, Plus, LogOut } from "lucide-react-native";
import { useCallback, useState } from "react";
import { getPets, type Pet } from "../../src/lib/pets-store";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { Avatar } from "../../src/components/Avatar";
import { useAuthStore } from "../../src/lib/auth-store";
import { petApi } from "../../services/pet/petApi";
import { userApi } from "../../services/user/userApi";

const TINT_COLORS = ["rgba(255,107,107,0.15)", "rgba(37,99,235,0.1)", "rgba(255,217,61,0.3)", "rgba(255,111,207,0.15)", "rgba(76,175,80,0.15)"];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tk = useTokens();
  const { user, logout } = useAuthStore();
  const [pets, setPets] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      petApi.getMyPets().then(setPets).catch(console.error);

      if (user?.username) {
        userApi.getUserProfile(user.username)
          .then((profile) => {
            setUserProfile(profile);
          })
          .catch(console.error);
      }
    }, [user?.username])
  );

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: tk.bg }}>
      <ScrollView style={[styles.container, { backgroundColor: tk.bg }]}
        showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: tk.text }]}>Profile</Text>
          <View style={styles.headerActions}>
            {/* <TouchableOpacity onPress={() => user?.username && router.push(`/u/${user.username}`)} style={[styles.iconBtn, { backgroundColor: tk.card }]}>
              <Share2 size={20} color={tk.text} strokeWidth={2} />
            </TouchableOpacity> */}
            <TouchableOpacity onPress={() => router.push("/settings")} style={[styles.iconBtn, { backgroundColor: tk.card }]}>
              <Settings size={20} color={tk.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* User card */}
        <TouchableOpacity onPress={() => user?.username && router.push(`/u/${user.username}`)} style={[styles.userCard, { backgroundColor: tk.card }]}>
          <Avatar source={userProfile?.avatar_url ? { uri: userProfile.avatar_url } : (user?.avatar_url ? { uri: user.avatar_url } : require("../../src/assets/doodle-boy-dog.png"))} name={userProfile?.name || user?.name || "User"} size={80} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: tk.text }]}>{userProfile?.name || user?.name || "User"}</Text>
            <Text style={[styles.userMeta, { color: tk.textMuted }]}>{userProfile?.city || user?.city || "Location unknown"} · {pets.length} pets</Text>
            <View style={styles.statsRow}>
              <Text style={[styles.statText, { color: tk.textMuted }]}><Text style={[styles.statNum, { color: tk.text }]}>{userProfile?.followersCount?.toString() || "0"}</Text> followers</Text>
              <Text style={[styles.statText, { color: tk.textMuted }]}><Text style={[styles.statNum, { color: tk.text }]}>{userProfile?.followingCount?.toString() || "0"}</Text> following</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Pets */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: tk.text }]}>My pets</Text>
          <TouchableOpacity onPress={() => router.push("/add-pet")} style={styles.addPetBtn}>
            <Plus size={16} color={colors.coral} /><Text style={styles.addPetText}>Add pet</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 8 }}>
          {pets.map((p, i) => (
            <TouchableOpacity key={p.id} onPress={() => router.push({ pathname: "/pet", params: { id: p.id } })} style={[styles.petCard, { backgroundColor: TINT_COLORS[(i + 2) % TINT_COLORS.length] }]} activeOpacity={0.85}>
              <View style={[styles.petCardImgWrap, { overflow: "hidden" }]}>
                {p.avatar_url ? <Image source={{ uri: p.avatar_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : null}
                {(p.isAdoptionOpen || p.isFosterOpen) && (
                  <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: colors.coral, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 }}>
                    <Text style={{ color: colors.white, fontSize: 9, fontFamily: 'Poppins_700Bold' }}>
                      {p.isAdoptionOpen && p.isFosterOpen ? "ADOPT/FOSTER" : p.isAdoptionOpen ? "ADOPT" : "FOSTER"}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.petCardName, { color: tk.text }]}>{p.name}</Text>
              <Text style={[styles.petCardBreed, { color: tk.textMuted }]}>{p.breed || p.species} · {p.gender === "female" ? "♀" : "♂"} · {p.age || "?"}y</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => router.push("/add-pet")} style={[styles.petCardAdd, { backgroundColor: tk.card, borderColor: tk.border }]} activeOpacity={0.85}>
            <Plus size={24} color={tk.textMuted} />
            <Text style={[styles.addPetCardText, { color: tk.textMuted }]}>Add pet</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Quick access */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 24, marginTop: 24, marginBottom: 12, color: tk.text }]}>Quick access</Text>
        <View style={styles.tilesGrid}>
          <Tile onPress={() => router.push("/today")} icon={Sun} label="Today" tintColor="rgba(255,107,107,0.15)" tk={tk} />
          <Tile onPress={() => router.push("/events")} icon={CalendarDays} label="Events" tintColor="rgba(255,217,61,0.3)" tk={tk} />
          <Tile onPress={() => router.push("/lost")} icon={Siren} label="Lost & Found" tintColor="rgba(255,111,207,0.15)" tk={tk} />
          <Tile onPress={() => router.push("/care")} icon={Stethoscope} label="Care" tintColor="rgba(37,99,235,0.1)" tk={tk} />
        </View>

        {/* Activity */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 24, marginTop: 24, marginBottom: 12, color: tk.text }]}>Activity</Text>
        <View style={styles.activityList}>
          <Row onPress={() => router.push("/notifications")} icon={Bell} label="Notifications" meta="3 new" tintColor="rgba(255,217,61,0.3)" tk={tk} />
          <Row onPress={() => router.push("/chat")} icon={MessageCircle} label="Messages" meta="2 unread" tintColor="rgba(37,99,235,0.1)" tk={tk} />
          <Row onPress={() => router.push("/pet")} icon={Award} label="Badges & Achievements" meta="12" tintColor="rgba(255,111,207,0.15)" tk={tk} />
          <Row onPress={() => router.push("/discover")} icon={MapPin} label="Places visited" meta="8" tintColor="rgba(76,175,80,0.15)" tk={tk} />
        </View>

        {/* Log Out */}
        <TouchableOpacity onPress={handleLogout}
          style={[styles.dangerRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
          <View style={[styles.dangerIcon, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
            <LogOut size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dangerLabel, { color: colors.primary }]}>Sign out</Text>
            <Text style={[styles.dangerSub, { color: tk.textMuted }]}>{user?.email ?? ""}</Text>
          </View>
          <ChevronRight size={16} color={tk.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Row({ onPress, icon: Icon, label, meta, tintColor, tk }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, { backgroundColor: tk.card }]} activeOpacity={0.8}>
      <View style={[styles.rowIcon, { backgroundColor: tintColor }]}><Icon size={20} color={tk.text} strokeWidth={2} /></View>
      <Text style={[styles.rowLabel, { flex: 1, color: tk.text }]}>{label}</Text>
      <Text style={[styles.rowMeta, { color: tk.textMuted }]}>{meta}</Text>
      <ChevronRight size={16} color={tk.textMuted} />
    </TouchableOpacity>
  );
}

function Tile({ onPress, icon: Icon, label, tintColor, tk }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tile, { backgroundColor: tk.card }]} activeOpacity={0.8}>
      <View style={[styles.tileIconBg, { backgroundColor: tintColor }]}>
        <Icon size={20} color={tk.text} strokeWidth={2} />
      </View>
      <Text style={[styles.tileLabel, { color: tk.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  userCard: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 24, padding: 16, marginHorizontal: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  userName: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  userMeta: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  statText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statNum: { fontFamily: "Poppins_700Bold" },
  dangerRow: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 16, marginHorizontal: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1, marginTop: 24 },
  dangerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(239,68,68,0.12)", alignItems: "center", justifyContent: "center" },
  dangerLabel: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#EF4444" },
  dangerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  addPetBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addPetText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.coral },
  petCard: { width: 160, borderRadius: 22, padding: 14 },
  petCardImgContainer: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  petCardImgInner: {
    width: 78,
    height: 78,
  },
  petCardImgWrap: { width: "100%", height: 72, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.6)" },
  petCardName: { fontFamily: "Poppins_700Bold", fontSize: 15, marginTop: 8 },
  petCardBreed: { fontSize: 12, fontFamily: "Inter_400Regular" },
  petCardAdd: { width: 160, borderRadius: 22, borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  addPetCardText: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  tilesGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12, paddingHorizontal: 20 },
  tile: { width: "48%", borderRadius: 16, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  tileIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tileLabel: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  activityList: { gap: 10, paddingHorizontal: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  rowMeta: { fontSize: 13, fontFamily: "Inter_400Regular" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#EF4444",
  },
});
