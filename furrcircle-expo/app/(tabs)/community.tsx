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
import { useState, useMemo, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Flame, Search, X, Hash, HelpCircle, Users } from "lucide-react-native";
import { PageContainer } from "../../src/components/PageContainer";
import { circles, threads, posts, type Circle } from "../../src/lib/demo-data";
import { SEED_USERS } from "../../src/lib/seed-data";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";

type FilterType = "all" | "people" | "pets" | "posts" | "circles" | "questions" | "tags";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "people", label: "People" },
  { key: "pets", label: "Pets" },
  { key: "posts", label: "Posts" },
  { key: "circles", label: "Circles" },
  { key: "questions", label: "Questions" },
  { key: "tags", label: "#Tags" },
];

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
  const searchInputRef = useRef<TextInput>(null);

  const [circlesList, setCirclesList] = useState<Circle[]>(circles);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const isSearchActive = searchFocused || searchQuery.length > 0;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return {
      people: SEED_USERS.filter(
        (u) => u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q)
      ),
      pets: SEED_USERS.flatMap((u) => u.pets).filter(
        (p) => p.name.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q) || p.species.toLowerCase().includes(q)
      ),
      posts: posts.filter(
        (p) => p.caption.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)) || p.pet.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q)
      ),
      circles: circlesList.filter(
        (c) => c.name.toLowerCase().includes(q) || c.about.toLowerCase().includes(q)
      ),
      questions: threads.filter(
        (t) => t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q)
      ),
      tags: [...new Set(posts.flatMap((p) => p.tags))].filter((t) => t.toLowerCase().includes(q)),
    };
  }, [searchQuery, circlesList]);

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

  const clearSearch = () => {
    setSearchQuery("");
    setActiveFilter("all");
    searchInputRef.current?.blur();
  };

  const totalResults = searchResults
    ? searchResults.people.length + searchResults.pets.length + searchResults.posts.length +
      searchResults.circles.length + searchResults.questions.length + searchResults.tags.length
    : 0;

  const getFilterCount = (key: FilterType) => {
    if (!searchResults) return 0;
    if (key === "all") return totalResults;
    return searchResults[key].length;
  };

  return (
    <PageContainer>
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: tk.bg }}>
      <ScrollView style={[styles.container, { backgroundColor: tk.bg }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

        {/* Header — always visible */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: tk.text }]}>Circles</Text>
            {!isSearchActive && (
              <Text style={[styles.subtitle, { color: tk.textMuted }]}>Conversations that bring pet parents together</Text>
            )}
          </View>
          {!isSearchActive && (
            <TouchableOpacity onPress={() => router.push("/ask")} style={styles.askBtn} activeOpacity={0.85}>
              <Plus size={16} color={colors.white} strokeWidth={3} />
              <Text style={styles.askBtnText}>Ask</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: tk.card }]}>
          <Search size={16} color={tk.textMuted} />
          <TextInput
            ref={searchInputRef}
            placeholder="Search people, pets, circles, posts…"
            placeholderTextColor={tk.textMuted}
            style={[styles.searchInput, { color: tk.text }]}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setActiveFilter("all");
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => {
              if (!searchQuery) setSearchFocused(false);
            }}
            returnKeyType="search"
          />
          {isSearchActive && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={tk.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* SEARCH ACTIVE STATE */}
        {isSearchActive ? (
          <>
            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }}>
              {FILTERS.map((f) => {
                const isActive = activeFilter === f.key;
                const count = getFilterCount(f.key);
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setActiveFilter(f.key)}
                    style={[styles.chip, { backgroundColor: isActive ? tk.text : tk.card }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipLabel, { color: isActive ? tk.bg : tk.textMuted }]}>{f.label}</Text>
                    {searchQuery.trim().length > 0 && count > 0 && (
                      <View style={[styles.chipBadge, { backgroundColor: isActive ? tk.bg + "33" : tk.text + "22" }]}>
                        <Text style={[styles.chipBadgeText, { color: isActive ? tk.bg : tk.text }]}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Results */}
            {!searchQuery.trim() ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: tk.textMuted }]}>Type to search people, pets, circles, posts, questions and tags</Text>
              </View>
            ) : totalResults === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: tk.text }]}>No results for "{searchQuery}"</Text>
                <Text style={[styles.emptyText, { color: tk.textMuted }]}>Try a different name or keyword</Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 20, gap: 4 }}>
                {/* PEOPLE */}
                {(activeFilter === "all" || activeFilter === "people") && searchResults!.people.length > 0 && (
                  <ResultSection
                    label="PEOPLE"
                    count={searchResults!.people.length}
                    showSeeAll={activeFilter === "all" && searchResults!.people.length > 3}
                    onSeeAll={() => setActiveFilter("people")}
                    tk={tk}
                  >
                    {(activeFilter === "all" ? searchResults!.people.slice(0, 3) : searchResults!.people).map((u) => (
                      <TouchableOpacity key={u.id} onPress={() => router.push(`/u/${u.handle}`)} style={[styles.resultRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                        <View style={[styles.resultIcon, { backgroundColor: colors.primary + "22" }]}>
                          <Users size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.resultTitle, { color: tk.text }]}>{u.name}</Text>
                          <Text style={[styles.resultMeta, { color: tk.textMuted }]}>@{u.handle} · {u.location}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ResultSection>
                )}

                {/* PETS */}
                {(activeFilter === "all" || activeFilter === "pets") && searchResults!.pets.length > 0 && (
                  <ResultSection
                    label="PETS"
                    count={searchResults!.pets.length}
                    showSeeAll={activeFilter === "all" && searchResults!.pets.length > 3}
                    onSeeAll={() => setActiveFilter("pets")}
                    tk={tk}
                  >
                    {(activeFilter === "all" ? searchResults!.pets.slice(0, 3) : searchResults!.pets).map((p) => (
                      <View key={p.id} style={[styles.resultRow, { backgroundColor: tk.card }]}>
                        <View style={[styles.resultIcon, { backgroundColor: "#FF6FCF22" }]}>
                          <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.resultTitle, { color: tk.text }]}>{p.name}</Text>
                          <Text style={[styles.resultMeta, { color: tk.textMuted }]}>{p.breed} · {p.species} · {p.ageYears}y</Text>
                        </View>
                      </View>
                    ))}
                  </ResultSection>
                )}

                {/* CIRCLES */}
                {(activeFilter === "all" || activeFilter === "circles") && searchResults!.circles.length > 0 && (
                  <ResultSection
                    label="CIRCLES"
                    count={searchResults!.circles.length}
                    showSeeAll={activeFilter === "all" && searchResults!.circles.length > 3}
                    onSeeAll={() => setActiveFilter("circles")}
                    tk={tk}
                  >
                    {(activeFilter === "all" ? searchResults!.circles.slice(0, 3) : searchResults!.circles).map((c) => (
                      <TouchableOpacity key={c.slug} onPress={() => router.push(`/community/${c.slug}`)} style={[styles.resultRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                        <View style={[styles.circleIconSm, { backgroundColor: c.tintColor }]}>
                          <Image source={c.cover} style={styles.circleImgSm} resizeMode="contain" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.resultTitle, { color: tk.text }]}>{c.name}</Text>
                          <Text style={[styles.resultMeta, { color: tk.textMuted }]}>{c.members >= 1000 ? `${(c.members / 1000).toFixed(1)}k` : c.members} members</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ResultSection>
                )}

                {/* QUESTIONS */}
                {(activeFilter === "all" || activeFilter === "questions") && searchResults!.questions.length > 0 && (
                  <ResultSection
                    label="QUESTIONS"
                    count={searchResults!.questions.length}
                    showSeeAll={activeFilter === "all" && searchResults!.questions.length > 3}
                    onSeeAll={() => setActiveFilter("questions")}
                    tk={tk}
                  >
                    {(activeFilter === "all" ? searchResults!.questions.slice(0, 3) : searchResults!.questions).map((t) => (
                      <TouchableOpacity key={t.id} onPress={() => router.push(`/thread/${t.id}`)} style={[styles.resultRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                        <View style={[styles.resultIcon, { backgroundColor: "#FFD93D44" }]}>
                          <HelpCircle size={18} color="#B8860B" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.resultTitle, { color: tk.text }]} numberOfLines={2}>{t.title}</Text>
                          <Text style={[styles.resultMeta, { color: tk.textMuted }]}>{t.upvotes} upvotes · {t.answers} answers</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ResultSection>
                )}

                {/* POSTS */}
                {(activeFilter === "all" || activeFilter === "posts") && searchResults!.posts.length > 0 && (
                  <ResultSection
                    label="POSTS"
                    count={searchResults!.posts.length}
                    showSeeAll={activeFilter === "all" && searchResults!.posts.length > 3}
                    onSeeAll={() => setActiveFilter("posts")}
                    tk={tk}
                  >
                    {(activeFilter === "all" ? searchResults!.posts.slice(0, 3) : searchResults!.posts).map((p) => (
                      <TouchableOpacity key={p.id} onPress={() => router.push(`/post/${p.id}`)} style={[styles.resultRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                        <View style={[styles.circleIconSm, { backgroundColor: p.tintColor }]}>
                          <Image source={p.image} style={styles.circleImgSm} resizeMode="contain" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.resultTitle, { color: tk.text }]} numberOfLines={2}>{p.caption}</Text>
                          <Text style={[styles.resultMeta, { color: tk.textMuted }]}>{p.pet} · {p.tags.map((t) => `#${t}`).join(" ")}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ResultSection>
                )}

                {/* TAGS */}
                {(activeFilter === "all" || activeFilter === "tags") && searchResults!.tags.length > 0 && (
                  <ResultSection
                    label="#TAGS"
                    count={searchResults!.tags.length}
                    showSeeAll={activeFilter === "all" && searchResults!.tags.length > 5}
                    onSeeAll={() => setActiveFilter("tags")}
                    tk={tk}
                  >
                    <View style={styles.tagsWrap}>
                      {(activeFilter === "all" ? searchResults!.tags.slice(0, 5) : searchResults!.tags).map((tag) => {
                        const postCount = posts.filter((p) => p.tags.includes(tag)).length;
                        return (
                          <TouchableOpacity key={tag} onPress={() => setSearchQuery(tag)} style={[styles.tagChip, { backgroundColor: tk.card, borderColor: tk.border }]} activeOpacity={0.8}>
                            <Hash size={12} color={colors.primary} />
                            <Text style={[styles.tagLabel, { color: tk.text }]}>{tag}</Text>
                            <Text style={[styles.tagCount, { color: tk.textMuted }]}>{postCount}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ResultSection>
                )}
              </View>
            )}
          </>
        ) : (
          /* NORMAL COMMUNITY CONTENT */
          <>
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
          </>
        )}
      </ScrollView>

      {!isSearchActive && (
        <TouchableOpacity onPress={() => setCreateOpen(true)} style={styles.fab} activeOpacity={0.85}>
          <Plus size={28} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>
      )}

      <CreateCircleSheet open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateCircle} tk={tk} />
    </View>
    </PageContainer>
  );
}

function ResultSection({ label, count, showSeeAll, onSeeAll, tk, children }: {
  label: string;
  count: number;
  showSeeAll: boolean;
  onSeeAll: () => void;
  tk: any;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.sectionLabelRow}>
        <Text style={[styles.sectionLabel, { color: tk.textMuted }]}>{label}</Text>
        {showSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all {count} →</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
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

  // Filter chips
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  chipBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  chipBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },

  // Result sections
  sectionLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionLabel: { fontFamily: "Poppins_700Bold", fontSize: 11, letterSpacing: 1.2 },
  seeAll: { fontFamily: "Inter_400Regular", fontSize: 12 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  resultIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  resultTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, lineHeight: 20 },
  resultMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  circleIconSm: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  circleImgSm: { width: "80%", height: "80%" },

  // Tags
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  tagLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tagCount: { fontFamily: "Inter_400Regular", fontSize: 11 },

  // Empty states
  emptyState: { alignItems: "center", paddingTop: 48, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, marginBottom: 8, textAlign: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },

  // Normal community content
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
