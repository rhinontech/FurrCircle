import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Flame, Search } from "lucide-react-native";
import { PageContainer } from "../../src/components/PageContainer";
import { circles, threads, type Circle } from "../../src/lib/demo-data";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";

const CATEGORY_PRESETS = [
  { id: "dogs", label: "Dogs", cover: require("../../src/assets/doodle-group.png"), tintColor: "rgba(255,107,107,0.15)" },
  { id: "puppies", label: "Puppies", cover: require("../../src/assets/doodle-puppy.png"), tintColor: "rgba(255,217,61,0.3)" },
  { id: "cats", label: "Cats", cover: require("../../src/assets/doodle-cat.png"), tintColor: "rgba(255,111,207,0.15)" },
  { id: "rescue", label: "Rescue", cover: require("../../src/assets/doodle-rescue.png"), tintColor: "rgba(76,175,80,0.15)" },
  { id: "health", label: "Health", cover: require("../../src/assets/doodle-vet.png"), tintColor: "rgba(37,99,235,0.1)" },
];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tk = useTokens();
  const trending = threads.slice(0, 3);

  const [circlesList, setCirclesList] = useState<Circle[]>(circles);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreateCircle = (name: string, about: string, categoryId: string) => {
    const selectedPreset = CATEGORY_PRESETS.find((c) => c.id === categoryId) || CATEGORY_PRESETS[0];
    const newCircle: Circle = {
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      name,
      members: 1,
      unread: 0,
      tintColor: selectedPreset.tintColor,
      cover: selectedPreset.cover,
      about,
    };
    setCirclesList((prev) => [newCircle, ...prev]);
  };

  return (
    <PageContainer>
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: tk.bg }}>
      <ScrollView style={[styles.container, { backgroundColor: tk.bg }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
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
        <Search size={16} color={tk.textMuted} />
        <TextInput
          placeholder="Search circles & questions"
          placeholderTextColor={tk.textMuted}
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
            <Text style={[styles.trendMeta, { color: tk.textMuted }]}>{t.upvotes} upvotes · {t.answers} replies</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, { marginTop: 24, paddingHorizontal: 24, marginBottom: 8, color: tk.text }]}>Your circles</Text>
      <View style={styles.circleList}>
        {circlesList.map((c) => (
          <TouchableOpacity key={c.slug} onPress={() => router.push(`/community/${c.slug}`)} style={[styles.circleRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
            <View style={[styles.circleIcon, { backgroundColor: c.tintColor }]}>
              <Image source={c.cover} style={styles.circleImg} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.circleName, { color: tk.text }]}>{c.name}</Text>
              <Text style={[styles.circleMeta, { color: tk.textMuted }]}>{c.members >= 1000 ? `${(c.members / 1000).toFixed(1)}k` : c.members} members</Text>
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

      <TouchableOpacity onPress={() => setCreateOpen(true)} style={styles.fab} activeOpacity={0.85}>
        <Plus size={28} color="#fff" strokeWidth={2.4} />
      </TouchableOpacity>

      <CreateCircleSheet open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateCircle} tk={tk} />
    </View>
    </PageContainer>
  );
}

function CreateCircleSheet({ open, onClose, onCreate, tk }: any) {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [category, setCategory] = useState("dogs");

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a circle name.");
      return;
    }
    if (!about.trim()) {
      Alert.alert("Required", "Please enter a short description.");
      return;
    }
    onCreate(name.trim(), about.trim(), category);
    setName("");
    setAbout("");
    setCategory("dogs");
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: tk.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />
          <Text style={[styles.sheetTitle, { color: tk.text }]}>Create new Circle</Text>

          <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Beagle Buddies"
            placeholderTextColor={tk.textMuted}
            style={[styles.modalInput, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border }]}
          />

          <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Description</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            placeholder="What is this circle about?"
            placeholderTextColor={tk.textMuted}
            style={[styles.modalInput, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border, height: 80, textAlignVertical: "top" }]}
            multiline
          />

          <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORY_PRESETS.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={[
                    styles.categoryBtn,
                    { backgroundColor: isSelected ? tk.text : tk.bg }
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryBtnText, { color: isSelected ? tk.bg : tk.textMuted }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={handleSubmit} style={styles.createBtn} activeOpacity={0.85}>
            <Text style={styles.createBtnText}>Create Circle</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
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
  fab: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.2,
  },
  sheetTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  categoryBtn: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  createBtn: {
    marginTop: 28,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  createBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.white,
  },
});
