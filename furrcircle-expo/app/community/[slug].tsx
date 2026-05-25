import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Users, Plus } from "lucide-react-native";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PageContainer } from "../../src/components/PageContainer";
import { circles, threads } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";

export default function CommunityDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const tk = useTokens();
  const circle = circles.find((c) => c.slug === slug) ?? circles[0];
  const circleThreads = threads.filter((t) => t.circle === circle.slug);

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title={circle.name} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.cover, { backgroundColor: circle.tintColor }]}>
          <Image source={circle.cover} style={styles.coverImg} resizeMode="contain" />
        </View>
        <View style={[styles.info, { backgroundColor: tk.card }]}>
          <Text style={[styles.circleName, { color: tk.text }]}>{circle.name}</Text>
          <View style={styles.membersRow}>
            <Users size={14} color={tk.textMuted} />
            <Text style={[styles.membersText, { color: tk.textMuted }]}>{(circle.members / 1000).toFixed(1)}k members</Text>
          </View>
          <Text style={[styles.about, { color: tk.text + "cc" }]}>{circle.about}</Text>
          <TouchableOpacity style={styles.joinBtn} activeOpacity={0.85}>
            <Text style={styles.joinBtnText}>Join Circle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: tk.text }]}>Discussions</Text>
          <TouchableOpacity onPress={() => router.push("/ask")} style={styles.askBtn}>
            <Plus size={14} color={colors.primary} />
            <Text style={styles.askBtnText}>Ask</Text>
          </TouchableOpacity>
        </View>

        {(circleThreads.length > 0 ? circleThreads : threads.slice(0, 3)).map((t) => (
          <TouchableOpacity key={t.id} onPress={() => router.push(`/thread/${t.id}`)} style={[styles.threadCard, { backgroundColor: tk.card }]} activeOpacity={0.8}>
            <View style={styles.threadTag}>
              <Text style={styles.threadTagText}>{t.tag.toUpperCase()}</Text>
            </View>
            <Text style={[styles.threadTitle, { color: tk.text }]} numberOfLines={2}>{t.title}</Text>
            <Text style={[styles.threadMeta, { color: tk.textMuted }]}>{t.upvotes} upvotes · {t.answers} replies · {t.time}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cover: { height: 180, alignItems: "center", justifyContent: "center" },
  coverImg: { width: "60%", height: "80%" },
  info: { borderRadius: 24, margin: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  circleName: { fontFamily: "Poppins_700Bold", fontSize: 22, color: colors.foreground },
  membersRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  membersText: { fontSize: 13, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
  about: { fontSize: 14, color: colors.foreground + "cc", fontFamily: "Inter_400Regular", lineHeight: 22, marginTop: 10 },
  joinBtn: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 12, alignItems: "center" },
  joinBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: colors.white },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 17, color: colors.foreground },
  askBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  askBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.primary },
  threadCard: { borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  threadTag: { alignSelf: "flex-start", backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  threadTagText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.coral },
  threadTitle: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.foreground, lineHeight: 20 },
  threadMeta: { marginTop: 8, fontSize: 12, color: colors.foreground + "88", fontFamily: "Inter_400Regular" },
});
