import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { posts } from "../../src/lib/demo-data";

export default function UserProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const tk = useTokens();
  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title={`@${handle}`} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.hero, { backgroundColor: tk.card }]}>
          <View style={styles.avatar}>
            <Image source={require("../../src/assets/doodle-boy-dog.png")} style={styles.avatarImg} resizeMode="cover" />
          </View>
          <Text style={[styles.name, { color: tk.text }]}>Goutham R.</Text>
          <Text style={styles.handle}>@{handle}</Text>
          <Text style={[styles.location, { color: tk.textMuted }]}>Mumbai · 2 pets</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={[styles.statNum, { color: tk.text }]}>128</Text><Text style={[styles.statLabel, { color: tk.textMuted }]}>Followers</Text></View>
            <View style={styles.stat}><Text style={[styles.statNum, { color: tk.text }]}>96</Text><Text style={[styles.statLabel, { color: tk.textMuted }]}>Following</Text></View>
            <View style={styles.stat}><Text style={[styles.statNum, { color: tk.text }]}>{posts.length}</Text><Text style={[styles.statLabel, { color: tk.textMuted }]}>Posts</Text></View>
          </View>
          <TouchableOpacity style={styles.followBtn}><Text style={styles.followBtnText}>Follow</Text></TouchableOpacity>
        </View>
        <Text style={[styles.gridTitle, { color: tk.text }]}>Posts</Text>
        <View style={styles.grid}>
          {posts.map((p) => (
            <View key={p.id} style={[styles.gridItem, { backgroundColor: p.tintColor }]}>
              <Image source={p.image} style={styles.gridImg} resizeMode="contain" />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: "center", padding: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  avatar: { width: 88, height: 88, borderRadius: 44, overflow: "hidden", backgroundColor: "rgba(255,107,107,0.15)", marginBottom: 12 },
  avatarImg: { width: "100%", height: "100%" },
  name: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  handle: { fontSize: 14, color: colors.primary, fontFamily: "Poppins_600SemiBold", marginTop: 2 },
  location: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 24, marginTop: 16 },
  stat: { alignItems: "center" },
  statNum: { fontFamily: "Poppins_700Bold", fontSize: 18, color: colors.foreground },
  statLabel: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  followBtn: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 24, paddingHorizontal: 40, paddingVertical: 10 },
  followBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
  gridTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.foreground, paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 6 },
  gridItem: { width: "30.5%", aspectRatio: 1, borderRadius: 14, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  gridImg: { width: "80%", height: "80%" },
});
