import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Flame, Search } from "lucide-react-native";
import { PageContainer } from "../../src/components/PageContainer";
import { circles, threads } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tk = useTokens();
  const trending = threads.slice(0, 3);

  return (
    <PageContainer>
    <ScrollView style={[styles.container, { paddingTop: insets.top, backgroundColor: tk.bg }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: tk.text }]}>Circles</Text>
          <Text style={[styles.subtitle, { color: tk.textMuted }]}>Conversations that bring pet parents together</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/ask")} style={styles.askBtn} activeOpacity={0.85}>
          <Plus size={16} color={colors.white} strokeWidth={3} />
          <Text style={styles.askBtnText}>Ask</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: tk.card }]}>
        <Search size={16} color={colors.foreground + "80"} />
        <TextInput
          placeholder="Search circles & questions"
          placeholderTextColor={colors.foreground + "66"}
          style={[styles.searchInput, { color: tk.text }]}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Flame size={16} color={colors.coral} />
        <Text style={[styles.sectionTitle, { color: tk.text }]}>Trending today</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 8 }}>
        {trending.map((t) => (
          <TouchableOpacity key={t.id} onPress={() => router.push(`/thread/${t.id}`)} style={[styles.trendCard, { backgroundColor: tk.card }]} activeOpacity={0.8}>
            <View style={styles.trendTag}>
              <Text style={styles.trendTagText}>{t.tag.toUpperCase()}</Text>
            </View>
            <Text style={[styles.trendCardTitle, { color: tk.text }]} numberOfLines={3}>{t.title}</Text>
            <Text style={styles.trendMeta}>{t.upvotes} upvotes · {t.answers} replies</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, { marginTop: 24, paddingHorizontal: 24, marginBottom: 8, color: tk.text }]}>Your circles</Text>
      <View style={styles.circleList}>
        {circles.map((c) => (
          <TouchableOpacity key={c.slug} onPress={() => router.push(`/community/${c.slug}`)} style={[styles.circleRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
            <View style={[styles.circleIcon, { backgroundColor: c.tintColor }]}>
              <Image source={c.cover} style={styles.circleImg} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.circleName, { color: tk.text }]}>{c.name}</Text>
              <Text style={styles.circleMeta}>{(c.members / 1000).toFixed(1)}k members</Text>
            </View>
            {c.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{c.unread} new</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 28, color: colors.foreground },
  subtitle: { fontSize: 12, color: colors.foreground + "99", fontFamily: "Inter_400Regular", marginTop: 2 },
  askBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.primary, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  askBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12,
    marginHorizontal: 20, marginBottom: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  trendCard: {
    width: 256, borderRadius: 24, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  trendTag: { backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  trendTagText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.coral },
  trendCardTitle: { fontFamily: "Poppins_700Bold", fontSize: 14, marginTop: 8, lineHeight: 20 },
  trendMeta: { marginTop: 12, fontSize: 11, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  circleList: { gap: 12, paddingHorizontal: 20, paddingBottom: 20 },
  circleRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  circleIcon: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  circleImg: { width: "80%", height: "80%" },
  circleName: { fontFamily: "Poppins_700Bold", fontSize: 15, lineHeight: 20 },
  circleMeta: { fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  unreadBadge: { backgroundColor: colors.coral, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  unreadText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.white },
});
