import {
  View, Text, ScrollView, TouchableOpacity, Image,
  TextInput, StyleSheet, Modal, Pressable, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Keyboard, RefreshControl,
} from "react-native";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Plus, Flame, Search, X, Hash, HelpCircle, Users, ChevronRight, Camera, Calendar } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { PageContainer } from "../../src/components/PageContainer";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";
import { useAuthStore } from "../../src/lib/auth-store";
import { circleApi } from "../../services/community/circleApi";
import { questionApi } from "../../services/community/questionApi";
import { feedApi } from "../../services/community/feedApi";
import { userApi } from "../../services/user/userApi";
import { AdaptiveSheet } from "../../src/components/AdaptiveSheet";

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
  { id: "dogs", label: "Dogs", color: "rgba(255,107,107,0.15)" },
  { id: "cats", label: "Cats", color: "rgba(255,111,207,0.15)" },
  { id: "rescue", label: "Rescue", color: "rgba(76,175,80,0.15)" },
  { id: "health", label: "Health", color: "rgba(37,99,235,0.1)" },
  { id: "training", label: "Training", color: "rgba(255,217,61,0.3)" },
  { id: "general", label: "General", color: "rgba(120,120,180,0.15)" },
];

export default function CommunityScreen() {
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tk = useTokens();
  const searchInputRef = useRef<TextInput>(null);
  const { user } = useAuthStore();

  const [myCircles, setMyCircles] = useState<any[]>([]);
  const [allCircles, setAllCircles] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [loadingCircles, setLoadingCircles] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search results
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<any>(null);

  const isSearchActive = searchFocused || searchQuery.length > 0;

  const loadCircles = useCallback(async () => {
    try {
      setLoadingCircles(true);
      const [mine, all] = await Promise.all([circleApi.getMyCircles(), circleApi.getAllCircles()]);
      setMyCircles(mine || []);
      setAllCircles(all || []);
    } catch (err) {
      console.error("Failed to load circles:", err);
    } finally {
      setLoadingCircles(false);
    }
  }, []);

  const loadTrending = useCallback(async () => {
    try {
      setLoadingTrending(true);
      const data = await circleApi.getTrending();
      setTrending(data || []);
    } catch (err) {
      console.error("Failed to load trending:", err);
    } finally {
      setLoadingTrending(false);
    }
  }, []);

  useEffect(() => { loadCircles(); loadTrending(); }, [loadCircles, loadTrending, refresh]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCircles(), loadTrending()]);
    setRefreshing(false);
  }, [loadCircles, loadTrending]);

  // Core search executor — extracted so it can be called by debounce AND by focus refresh
  const runSearch = useCallback(async (q: string, silent = false) => {
    if (!q.trim()) { setSearchResults(null); return; }
    if (!silent) setSearching(true);
    try {
      const [circles, questions, posts, people] = await Promise.all([
        circleApi.getAllCircles(),
        questionApi.getQuestions({ q }),
        feedApi.getFeed("for_you", 1, 50),
        userApi.searchAllUsers(q),
      ]);
      const term = q.trim().toLowerCase();
      const filteredCircles = (circles || []).filter((c: any) =>
        c.name?.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term)
      );
      const filteredPosts = (posts?.posts || []).filter((p: any) =>
        p.content?.toLowerCase().includes(term)
      );
      const allTags: string[] = [];
      (posts?.posts || []).forEach((p: any) => { if (p.category) allTags.push(p.category); });
      const uniqueTags = [...new Set(allTags)].filter(t => t.toLowerCase().includes(term));

      setSearchResults({ circles: filteredCircles, questions: questions || [], posts: filteredPosts, tags: uniqueTags, people: people || [], pets: [] });
    } catch { if (!silent) setSearchResults(null); }
    finally { if (!silent) setSearching(false); }
  }, []);

  // Debounced search triggered by query changes
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => runSearch(searchQuery), 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, runSearch]);

  // When screen regains focus (user returns from thread), silently refresh
  // only the questions in current search results to pick up updated upvote/hasVoted state
  useFocusEffect(useCallback(() => {
    if (searchQuery.trim()) {
      questionApi.getQuestions({ q: searchQuery })
        .then((questions: any[]) => {
          if (questions?.length) {
            setSearchResults((prev: any) => prev ? { ...prev, questions } : prev);
          }
        })
        .catch(() => {});
    }
  }, [searchQuery]));

  const handleCreateCircle = async (name: string, description: string, category: string, coverImage?: string) => {
    try {
      const circle = await circleApi.createCircle({ name, description, category, coverImage });
      setMyCircles(prev => [circle, ...prev]);
      setAllCircles(prev => [circle, ...prev]);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to create circle.");
    }
  };

  const handleJoinToggle = async (circleId: string, isJoined: boolean) => {
    try {
      if (isJoined) {
        await circleApi.leaveCircle(circleId);
      } else {
        await circleApi.joinCircle(circleId);
      }
      await loadCircles();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Action failed.");
    }
  };

  const clearSearch = () => { setSearchQuery(""); setActiveFilter("all"); setSearchFocused(false); searchInputRef.current?.blur(); };
  const totalResults = searchResults
    ? (searchResults.circles?.length || 0) + (searchResults.questions?.length || 0) + (searchResults.posts?.length || 0) + (searchResults.tags?.length || 0) + (searchResults.people?.length || 0)
    : 0;
  const getFilterCount = (key: FilterType) => {
    if (!searchResults) return 0;
    if (key === "all") return totalResults;
    return (searchResults[key] || []).length;
  };

  const discoverCircles = allCircles.filter(c => !myCircles.some(m => m.id === c.id));

  return (
    <PageContainer>
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: tk.bg }}>
        <ScrollView
          style={[styles.container, { backgroundColor: tk.bg }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.title, { color: tk.text }]}>Circles</Text>
              {!isSearchActive && <Text style={[styles.subtitle, { color: tk.textMuted }]} numberOfLines={1}>Conversations that bring pet parents together</Text>}
            </View>
            {!isSearchActive && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity onPress={() => router.push("/events")} style={[styles.eventBtn, { backgroundColor: tk.card, borderColor: tk.border, borderWidth: 1 }]} activeOpacity={0.85}>
                  <Calendar size={20} color={tk.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/ask")} style={styles.askBtn} activeOpacity={0.85}>
                  <Plus size={16} color={colors.white} strokeWidth={3} />
                  {/* <Text style={styles.askBtnText}></Text> */}
                </TouchableOpacity>
              </View>
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
              onChangeText={(text) => { setSearchQuery(text); setActiveFilter("all"); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
            />
            {isSearchActive && (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={tk.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* SEARCH ACTIVE */}
          {isSearchActive ? (
            <>
              {/* Filter chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }}>
                {FILTERS.map((f) => {
                  const isActive = activeFilter === f.key;
                  const count = getFilterCount(f.key);
                  return (
                    <TouchableOpacity key={f.key} onPress={() => setActiveFilter(f.key)} style={[styles.chip, { backgroundColor: isActive ? tk.text : tk.card }]} activeOpacity={0.8}>
                      <Text style={[styles.chipLabel, { color: isActive ? tk.bg : tk.textMuted }]}>{f.label}</Text>
                      {searchQuery.trim() && count > 0 && (
                        <View style={[styles.chipBadge, { backgroundColor: isActive ? tk.bg + "33" : tk.text + "22" }]}>
                          <Text style={[styles.chipBadgeText, { color: isActive ? tk.bg : tk.text }]}>{count}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {searching ? (
                <View style={{ paddingTop: 40, alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View>
              ) : !searchQuery.trim() ? (
                <View style={styles.emptyState}><Text style={[styles.emptyText, { color: tk.textMuted }]}>Type to search circles, posts, and questions</Text></View>
              ) : totalResults === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyTitle, { color: tk.text }]}>No results for "{searchQuery}"</Text>
                  <Text style={[styles.emptyText, { color: tk.textMuted }]}>Try a different name or keyword</Text>
                </View>
              ) : (
                <View style={{ paddingHorizontal: 20 }}>
                  {/* PEOPLE */}
                  {(activeFilter === "all" || activeFilter === "people") && (searchResults?.people || []).length > 0 && (
                    <ResultSection label="PEOPLE" count={searchResults.people.length} showSeeAll={activeFilter === "all" && searchResults.people.length > 3} onSeeAll={() => setActiveFilter("people")} tk={tk}>
                      {(activeFilter === "all" ? searchResults.people.slice(0, 3) : searchResults.people).map((p: any) => (
                        <TouchableOpacity key={p.id} onPress={() => router.push(`/u/${p.username}`)} style={[styles.resultRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                          <View style={[styles.resultIcon, { backgroundColor: "rgba(255,107,107,0.12)", overflow: "hidden" }]}>
                            {p.avatar_url
                              ? <Image source={{ uri: p.avatar_url }} style={{ width: 44, height: 44, borderRadius: 12 }} resizeMode="cover" />
                              : <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.coral + "33", alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.coral }}>{(p.name || "?")?.[0]?.toUpperCase()}</Text>
                              </View>}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.resultTitle, { color: tk.text }]}>{p.name}</Text>
                            <Text style={[styles.resultMeta, { color: tk.textMuted }]}>@{p.username}{p.city ? ` · ${p.city}` : ""}</Text>
                          </View>
                          {p.followStatus !== "self" && (
                            <TouchableOpacity
                              onPress={async (e) => {
                                (e as any).stopPropagation?.();
                                try {
                                  if (p.followStatus === "none") {
                                    await userApi.followUser(p.id);
                                    setSearchResults((prev: any) => ({ ...prev, people: prev.people.map((u: any) => u.id === p.id ? { ...u, followStatus: "pending" } : u) }));
                                  } else {
                                    await userApi.unfollowUser(p.id);
                                    setSearchResults((prev: any) => ({ ...prev, people: prev.people.map((u: any) => u.id === p.id ? { ...u, followStatus: "none" } : u) }));
                                  }
                                } catch { }
                              }}
                              style={[styles.joinBtn, { backgroundColor: p.followStatus === "none" ? colors.primary : tk.card, borderColor: p.followStatus === "none" ? colors.primary : tk.border }]}
                            >
                              <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 11, color: p.followStatus === "none" ? colors.white : tk.textMuted }}>
                                {p.followStatus === "none" ? "Follow" : p.followStatus === "pending" ? "Requested" : "Following"}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ResultSection>
                  )}

                  {/* CIRCLES */}
                  {(activeFilter === "all" || activeFilter === "circles") && (searchResults?.circles || []).length > 0 && (
                    <ResultSection label="CIRCLES" count={searchResults.circles.length} showSeeAll={activeFilter === "all" && searchResults.circles.length > 3} onSeeAll={() => setActiveFilter("circles")} tk={tk}>
                      {(activeFilter === "all" ? searchResults.circles.slice(0, 3) : searchResults.circles).map((c: any) => (
                        <TouchableOpacity key={c.id} onPress={() => router.push(`/community/${c.id}`)} style={[styles.resultRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                          <View style={[styles.resultIcon, { backgroundColor: colors.primary + "22", overflow: "hidden" }]}>
                            {c.coverImage
                              ? <Image source={{ uri: c.coverImage }} style={{ width: 44, height: 44, borderRadius: 12 }} resizeMode="cover" />
                              : <Users size={18} color={colors.primary} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.resultTitle, { color: tk.text }]}>{c.name}</Text>
                            <Text style={[styles.resultMeta, { color: tk.textMuted }]}>{c.memberCount} members · {c.category}</Text>
                          </View>
                          <TouchableOpacity onPress={() => handleJoinToggle(c.id, c.isJoined)} style={[styles.joinBtn, { backgroundColor: c.isJoined ? tk.card : colors.primary, borderColor: c.isJoined ? tk.border : colors.primary }]}>
                            <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 11, color: c.isJoined ? tk.textMuted : colors.white }}>{c.isJoined ? "Joined" : "Join"}</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </ResultSection>
                  )}

                  {/* QUESTIONS */}
                  {(activeFilter === "all" || activeFilter === "questions") && (searchResults?.questions || []).length > 0 && (
                    <ResultSection label="QUESTIONS" count={searchResults.questions.length} showSeeAll={activeFilter === "all" && searchResults.questions.length > 3} onSeeAll={() => setActiveFilter("questions")} tk={tk}>
                      {(activeFilter === "all" ? searchResults.questions.slice(0, 3) : searchResults.questions).map((q: any) => (
                        <TouchableOpacity
                          key={q.id}
                          style={[styles.resultRow, { backgroundColor: tk.card }]}
                          activeOpacity={0.8}
                          onPress={() => router.push({
                            pathname: "/thread/[id]",
                            params: {
                              id: q.id,
                              title: q.title,
                              body: q.body || "",
                              tags: q.tags?.[0] || "",
                              askerName: q.author?.name || "Someone",
                              time: q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "",
                              upvotes: q.upvotes || 0,
                              hasVoted: q.hasVoted ? "1" : "0",
                              questionUserId: q.userId || q.author?.id || "",
                            },
                          })}
                        >
                          <View style={[styles.resultIcon, { backgroundColor: q.hasVoted ? colors.primary + "22" : "#FFD93D44" }]}><HelpCircle size={18} color={q.hasVoted ? colors.primary : "#B8860B"} /></View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.resultTitle, { color: tk.text }]} numberOfLines={2}>{q.title}</Text>
                            <Text style={[styles.resultMeta, { color: q.hasVoted ? colors.primary : tk.textMuted }]}>{q.upvotes} upvotes{q.hasVoted ? " · Upvoted ✓" : ""} · {q.answerCount} answers</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ResultSection>
                  )}

                  {/* POSTS */}
                  {(activeFilter === "all" || activeFilter === "posts") && (searchResults?.posts || []).length > 0 && (
                    <ResultSection label="POSTS" count={searchResults.posts.length} showSeeAll={activeFilter === "all" && searchResults.posts.length > 3} onSeeAll={() => setActiveFilter("posts")} tk={tk}>
                      {(activeFilter === "all" ? searchResults.posts.slice(0, 3) : searchResults.posts).map((p: any) => (
                        <TouchableOpacity key={p.id} onPress={() => router.push(`/post/${p.id}`)} style={[styles.resultRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                          <View style={[styles.resultIcon, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
                            {p.imageUrl ? <Image source={{ uri: p.imageUrl }} style={{ width: 44, height: 44, borderRadius: 12 }} /> : <Users size={18} color={colors.primary} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.resultTitle, { color: tk.text }]} numberOfLines={2}>{p.content}</Text>
                            <Text style={[styles.resultMeta, { color: tk.textMuted }]}>{p.author?.name} · {p.category || "General"}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ResultSection>
                  )}

                  {/* TAGS */}
                  {(activeFilter === "all" || activeFilter === "tags") && (searchResults?.tags || []).length > 0 && (
                    <ResultSection label="#TAGS" count={searchResults.tags.length} showSeeAll={false} onSeeAll={() => { }} tk={tk}>
                      <View style={styles.tagsWrap}>
                        {searchResults.tags.map((tag: string) => (
                          <TouchableOpacity key={tag} onPress={() => setSearchQuery(tag)} style={[styles.tagChip, { backgroundColor: tk.card, borderColor: tk.border }]} activeOpacity={0.8}>
                            <Hash size={12} color={colors.primary} />
                            <Text style={[styles.tagLabel, { color: tk.text }]}>{tag}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ResultSection>
                  )}
                </View>
              )}
            </>
          ) : (
            /* NORMAL COMMUNITY CONTENT */
            <>
              {/* Trending Today */}
              <View style={styles.sectionHeader}>
                <Flame size={16} color={colors.coral} />
                <Text style={[styles.sectionTitle, { color: tk.text }]}>Trending today</Text>
              </View>

              {loadingTrending ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}><ActivityIndicator color={colors.primary} /></View>
              ) : trending.length === 0 ? (
                <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: tk.textMuted }}>No trending questions yet. Be the first to ask!</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 8 }}>
                  {trending.map((q: any) => (
                    <TouchableOpacity
                      key={q.id}
                      style={[styles.trendCard, { backgroundColor: tk.card }]}
                      activeOpacity={0.8}
                      onPress={() => router.push({
                        pathname: "/thread/[id]",
                        params: {
                          id: q.id,
                          title: q.title,
                          body: q.body || "",
                          tags: q.tags?.[0] || "",
                          askerName: q.author?.name || "Someone",
                          time: q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "",
                          upvotes: q.upvotes || 0,
                          hasVoted: q.hasVoted ? "1" : "0",
                          questionUserId: q.userId || q.author?.id || "",
                        },
                      })}
                    >
                      <View style={styles.trendTag}>
                        <Text style={styles.trendTagText}>{(q.tags?.[0] || q.circleId ? "CIRCLE" : "GLOBAL").toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.trendCardTitle, { color: tk.text }]} numberOfLines={3}>{q.title}</Text>
                      <Text style={[styles.trendMeta, { color: tk.textMuted }]}>{q.upvotes} upvotes · {q.answerCount} replies</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* My Circles */}
              <Text style={[styles.sectionTitle, { marginTop: 24, paddingHorizontal: 24, marginBottom: 8, color: tk.text }]}>Your circles</Text>
              {loadingCircles ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}><ActivityIndicator color={colors.primary} /></View>
              ) : myCircles.length === 0 ? (
                <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: tk.textMuted }}>You haven't joined any circles yet. Discover some below!</Text>
                </View>
              ) : (
                <View style={styles.circleList}>
                  {myCircles.map((c: any) => (
                    <TouchableOpacity key={c.id} onPress={() => router.push(`/community/${c.id}`)} style={[styles.circleRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                      <View style={[styles.circleIcon, { backgroundColor: CATEGORY_PRESETS.find(p => p.id === c.category)?.color || "rgba(120,120,180,0.15)", overflow: "hidden" }]}>
                        {c.coverImage
                          ? <Image source={{ uri: c.coverImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                          : <Users size={24} color={colors.primary} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.circleName, { color: tk.text }]}>{c.name}</Text>
                        <Text style={[styles.circleMeta, { color: tk.textMuted }]}>{c.memberCount >= 1000 ? `${(c.memberCount / 1000).toFixed(1)}k` : c.memberCount} members</Text>
                      </View>
                      <ChevronRight size={18} color={tk.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Discover Circles */}
              {discoverCircles.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 24, paddingHorizontal: 24, marginBottom: 8, color: tk.text }]}>Discover circles</Text>
                  <View style={styles.circleList}>
                    {discoverCircles.slice(0, 5).map((c: any) => (
                      <TouchableOpacity key={c.id} onPress={() => router.push(`/community/${c.id}`)} style={[styles.circleRow, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                        <View style={[styles.circleIcon, { backgroundColor: CATEGORY_PRESETS.find(p => p.id === c.category)?.color || "rgba(120,120,180,0.15)", overflow: "hidden" }]}>
                          {c.coverImage
                            ? <Image source={{ uri: c.coverImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                            : <Users size={24} color={colors.primary} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.circleName, { color: tk.text }]}>{c.name}</Text>
                          <Text style={[styles.circleMeta, { color: tk.textMuted }]}>{c.memberCount >= 1000 ? `${(c.memberCount / 1000).toFixed(1)}k` : c.memberCount} members</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleJoinToggle(c.id, false)} style={[styles.joinBtn, { backgroundColor: colors.primary }]}>
                          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 11, color: colors.white }}>Join</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
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

function ResultSection({ label, count, showSeeAll, onSeeAll, tk, children }: { label: string; count: number; showSeeAll: boolean; onSeeAll: () => void; tk: any; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.sectionLabelRow}>
        <Text style={[styles.sectionLabel, { color: tk.textMuted }]}>{label}</Text>
        {showSeeAll && <TouchableOpacity onPress={onSeeAll}><Text style={[styles.seeAll, { color: colors.primary }]}>See all {count} →</Text></TouchableOpacity>}
      </View>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

function CreateCircleSheet({ open, onClose, onCreate, tk }: any) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission", "Gallery access required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8, allowsEditing: true, aspect: [16, 9] });
    if (!result.canceled && result.assets?.[0]?.uri) setCoverUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert("Required", "Please enter a circle name."); return; }
    setLoading(true);
    try {
      let coverImage: string | undefined;
      if (coverUri) {
        const uploadRes = await userApi.uploadImage(coverUri, "circles");
        coverImage = uploadRes.url;
      }
      await onCreate(name.trim(), description.trim(), category, coverImage);
      setName(""); setDescription(""); setCategory("general"); setCoverUri(null);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <AdaptiveSheet visible={open} onClose={onClose} maxWidth={520} maxHeight="85%">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable onPress={Keyboard.dismiss} style={{ padding: 24, paddingBottom: 40 }}>
          <Text style={[styles.sheetTitle, { color: tk.text }]}>Create new Circle</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Pressable onPress={Keyboard.dismiss}>
              {/* Cover image */}
              <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Cover Image</Text>
              <TouchableOpacity onPress={pickCover} style={[styles.coverPicker, { backgroundColor: tk.inputBg, borderColor: tk.border }]} activeOpacity={0.8}>
                {coverUri ? (
                  <Image source={{ uri: coverUri }} style={{ width: "100%", height: "100%", borderRadius: 12 }} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: "center", gap: 6 }}>
                    <Camera size={24} color={tk.textMuted} />
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: tk.textMuted }}>Tap to add cover photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Beagle Buddies" placeholderTextColor={tk.textMuted} style={[styles.modalInput, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border }]} />

              <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Description</Text>
              <TextInput value={description} onChangeText={setDescription} placeholder="What is this circle about?" placeholderTextColor={tk.textMuted} style={[styles.modalInput, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border, height: 80, textAlignVertical: "top" }]} multiline />

              <Text style={[styles.inputLabel, { color: tk.textMuted }]}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORY_PRESETS.map((cat) => (
                  <TouchableOpacity key={cat.id} onPress={() => setCategory(cat.id)} style={[styles.categoryBtn, { backgroundColor: category === cat.id ? tk.text : tk.bg }]} activeOpacity={0.8}>
                    <Text style={[styles.categoryBtnText, { color: category === cat.id ? tk.bg : tk.textMuted }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[styles.createBtn, loading && { opacity: 0.6 }]} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.createBtnText}>Create Circle</Text>}
              </TouchableOpacity>
            </Pressable>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </AdaptiveSheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  askBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  askBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
  eventBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 20, marginBottom: 4 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  chipBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  chipBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionLabel: { fontFamily: "Poppins_700Bold", fontSize: 11, letterSpacing: 1.2 },
  seeAll: { fontFamily: "Inter_400Regular", fontSize: 12 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 12 },
  resultIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  resultTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, lineHeight: 20 },
  resultMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  joinBtn: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  tagLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  emptyState: { alignItems: "center", paddingTop: 48, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, marginBottom: 8, textAlign: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  trendCard: { width: 256, borderRadius: 24, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  trendTag: { backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  trendTagText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: colors.coral },
  trendCardTitle: { fontFamily: "Poppins_700Bold", fontSize: 14, marginTop: 8, lineHeight: 20 },
  trendMeta: { marginTop: 12, fontSize: 11, fontFamily: "Inter_400Regular" },
  circleList: { gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  circleRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 12 },
  circleIcon: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  circleName: { fontFamily: "Poppins_700Bold", fontSize: 15, lineHeight: 20 },
  circleMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  fab: { position: "absolute", bottom: 16, right: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 16, opacity: 0.2 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, marginBottom: 20 },
  inputLabel: { fontFamily: "Poppins_700Bold", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8, marginTop: 16 },
  modalInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  categoryBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  categoryBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  createBtn: { marginTop: 28, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  createBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  coverPicker: { height: 100, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginBottom: 4, overflow: "hidden" },
});
