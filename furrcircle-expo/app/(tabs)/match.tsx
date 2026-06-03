import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Heart, X, Star, ArrowLeft, ArrowRight, MapPin } from "lucide-react-native";
import { useState, useRef, useCallback, useEffect } from "react";
import * as Location from "expo-location";
import { colors } from "../../src/lib/theme";
import { useTokens, useThemeStore } from "../../src/lib/theme-store";
import { useAuthStore } from "../../src/lib/auth-store";
import { matchApi, type Coords } from "../../services/match/matchApi";
import { petApi } from "../../services/pet/petApi";
import { PrivateAxios } from "../../helpers/PrivateAxios";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const SWIPE_THRESHOLD = width * 0.3;

type Mode = "Playdate" | "Adoption" | "Breed" | "Owner";
const modes: Mode[] = ["Playdate", "Adoption", "Breed", "Owner"];

// Tint colours by species / fallback
const TINTS = ["#FFEBEE", "#E3F2FD", "#FFFDE7", "#FCE4EC", "#E8F5E9", "#F3E5F5"];
const tintForIndex = (i: number) => TINTS[i % TINTS.length];

function mapPetToCard(pet: any, index: number) {
  return {
    id: pet.id,
    img: pet.avatar_url ? { uri: pet.avatar_url } : null,
    name: pet.name,
    meta: [pet.breed, pet.age, pet.distanceLabel || pet.city || pet.owner?.city].filter(Boolean).join(" · "),
    tag: pet.description || (pet.isAdoptionOpen ? "Looking for a forever home" : pet.healthStatus || ""),
    tintColor: tintForIndex(index),
    badge: pet.isAdoptionOpen ? "ADOPT" : pet.isFosterOpen ? "FOSTER" : undefined,
    ownerId: pet.ownerId || pet.owner?.id,
    ownerName: pet.owner?.name,
    ownerAvatar: pet.owner?.avatar_url,
    species: pet.species,
    isBreedingOpen: pet.isBreedingOpen,
  };
}

function mapOwnerToCard(owner: any, index: number) {
  const petSummary = owner.pets?.length
    ? owner.pets.map((p: any) => p.name).slice(0, 2).join(", ")
    : "No pets yet";
  const speciesSummary = owner.pets?.length
    ? [...new Set(owner.pets.map((p: any) => p.species))].join(", ")
    : "";
  return {
    id: owner.id,
    img: owner.avatar_url ? { uri: owner.avatar_url } : null,
    name: owner.name,
    meta: [owner.city, speciesSummary, owner.distanceLabel].filter(Boolean).join(" · "),
    tag: owner.bio || `Has: ${petSummary}`,
    tintColor: tintForIndex(index),
    badge: undefined,
    handle: owner.username,
  };
}

export default function MatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tk = useTokens();
  const dark = useThemeStore((s) => s.dark);
  const { user } = useAuthStore();

  const [mode, setMode] = useState<Mode>("Playdate");
  const [index, setIndex] = useState(0);
  const [dragDir, setDragDir] = useState<"next" | "prev">("next");
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [myPets, setMyPets] = useState<any[]>([]);
  const [matchModal, setMatchModal] = useState<{ visible: boolean; conversationId?: string; matchName?: string; matchAvatar?: any }>({ visible: false });
  const [applyingAdoption, setApplyingAdoption] = useState(false);

  const swipeAnim = useRef(new Animated.ValueXY()).current;
  const matchModalAnim = useRef(new Animated.Value(0)).current;

  const rotateAnim = swipeAnim.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ["-8deg", "0deg", "8deg"],
    extrapolate: "clamp",
  });
  const likeOpacity = swipeAnim.x.interpolate({ inputRange: [0, width * 0.2], outputRange: [0, 1], extrapolate: "clamp" });
  const nopeOpacity = swipeAnim.x.interpolate({ inputRange: [-width * 0.2, 0], outputRange: [1, 0], extrapolate: "clamp" });

  // Request location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const c = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setCoords(c);
          // Update user's location on backend (fire-and-forget)
          PrivateAxios.patch("/auth/profile", { latitude: c.lat, longitude: c.lng }).catch(() => {});
        }
      } catch {}
    })();
  }, []);

  // Load user's pets
  useEffect(() => {
    petApi.getMyPets().then(setMyPets).catch(() => {});
  }, []);

  // Load cards whenever mode or coords ready
  useEffect(() => {
    loadCards(mode);
  }, [mode, coords]);

  const loadCards = async (m: Mode) => {
    setLoading(true);
    setCards([]);
    setIndex(0);
    swipeAnim.setValue({ x: 0, y: 0 });
    try {
      if (m === "Playdate") {
        const myPet = myPets[0] || (await petApi.getMyPets().then((p: any[]) => { setMyPets(p); return p[0]; }));
        if (!myPet) { setLoading(false); return; }
        const data = await matchApi.getPlaydateCards(myPet.id, coords || undefined);
        setCards(data.map(mapPetToCard));
      } else if (m === "Adoption") {
        const data = await petApi.discoverPets();
        setCards(data.map(mapPetToCard));
      } else if (m === "Breed") {
        const breedPet = myPets.find((p: any) => p.isBreedingOpen) || myPets[0];
        if (!breedPet || !breedPet.isBreedingOpen) { setLoading(false); return; }
        const data = await matchApi.getBreedCards(breedPet.id);
        setCards(data.map(mapPetToCard));
      } else if (m === "Owner") {
        const data = await matchApi.getOwnerCards(coords || undefined);
        setCards(data.map(mapOwnerToCard));
      }
    } catch {}
    setLoading(false);
  };

  const showMatchModal = (conversationId: string, matchName: string, matchAvatar: any) => {
    setMatchModal({ visible: true, conversationId, matchName, matchAvatar });
    matchModalAnim.setValue(0);
    Animated.timing(matchModalAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    setTimeout(() => dismissMatchModal(conversationId), 3000);
  };

  const dismissMatchModal = (conversationId?: string) => {
    Animated.timing(matchModalAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setMatchModal({ visible: false });
      if (conversationId) router.push(`/chat`);
    });
  };

  const advance = useCallback(() => {
    setIndex((i) => i + 1);
    swipeAnim.setValue({ x: 0, y: 0 });
  }, [swipeAnim]);

  const swipeTo = useCallback((direction: "left" | "right") => {
    Animated.timing(swipeAnim, {
      toValue: { x: direction === "right" ? width * 1.5 : -width * 1.5, y: 0 },
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      // Record swipe on backend (fire-and-forget)
      const card = cards[index % cards.length];
      if (card) {
        const swipeDir = direction === "right" ? "like" : "pass";
        const myPet = myPets[0];
        if (mode === "Playdate" && myPet) {
          matchApi.swipePlaydate(card.id, myPet.id, swipeDir).then((res) => {
            if (res.matched && res.conversationId) {
              showMatchModal(res.conversationId, card.name, card.img);
            }
          }).catch(() => {});
        } else if (mode === "Breed" && myPet) {
          const breedPet = myPets.find((p: any) => p.isBreedingOpen) || myPet;
          matchApi.swipeBreed(card.id, breedPet.id, swipeDir).then((res) => {
            if (res.matched && res.conversationId) {
              showMatchModal(res.conversationId, card.name, card.img);
            }
          }).catch(() => {});
        }
      }
      advance();
    });
  }, [swipeAnim, advance, cards, index, mode, myPets]);

  const animatePagination = useCallback((dir: "next" | "prev") => {
    Animated.timing(swipeAnim, {
      toValue: { x: dir === "next" ? -width * 1.5 : width * 1.5, y: 0 },
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setIndex((i) => {
        if (dir === "next") return (i + 1) % cards.length;
        return (i - 1 + cards.length) % cards.length;
      });
      swipeAnim.setValue({ x: 0, y: 0 });
    });
  }, [swipeAnim, cards.length]);

  // Owner swipe handler
  const ownerSwipeTo = useCallback((direction: "left" | "right") => {
    const card = cards[index % cards.length];
    Animated.timing(swipeAnim, {
      toValue: { x: direction === "right" ? width * 1.5 : -width * 1.5, y: 0 },
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      if (card && direction === "right") {
        matchApi.swipeOwner(card.id, "like").then((res) => {
          if (res.matched && res.conversationId) {
            showMatchModal(res.conversationId, card.name, card.img);
          }
        }).catch(() => {});
      } else if (card && direction === "left") {
        matchApi.swipeOwner(card.id, "pass").catch(() => {});
      }
      advance();
    });
  }, [swipeAnim, advance, cards, index]);

  useEffect(() => {
    setDragDir("next");
  }, [index, mode]);

  useEffect(() => {
    const id = swipeAnim.x.addListener(({ value }) => {
      if (value > 5 && dragDir !== "prev") setDragDir("prev");
      else if (value < -5 && dragDir !== "next") setDragDir("next");
    });
    return () => swipeAnim.x.removeListener(id);
  }, [dragDir]);

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const topCardRef = useRef<any>(null);

  const handlersRef = useRef({ swipeTo, ownerSwipeTo, animatePagination });
  handlersRef.current = { swipeTo, ownerSwipeTo, animatePagination };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const isSwipeMode = modeRef.current === "Playdate" || modeRef.current === "Owner";
        swipeAnim.setValue({ x: gs.dx, y: isSwipeMode ? gs.dy * 0.3 : gs.dy * 0.2 });
      },
      onPanResponderRelease: (_, gs) => {
        const currentMode = modeRef.current;
        const { swipeTo: st, ownerSwipeTo: ost, animatePagination: ap } = handlersRef.current;
        const isTap = Math.abs(gs.dx) < 8 && Math.abs(gs.dy) < 8;

        if (isTap) {
          if (currentMode !== "Playdate" && currentMode !== "Owner" && topCardRef.current) {
            router.push(`/p/${topCardRef.current.id}`);
          } else if (currentMode === "Owner" && topCardRef.current?.handle) {
            router.push(`/u/${topCardRef.current.handle}`);
          }
          return;
        }

        if (gs.dx > SWIPE_THRESHOLD) {
          if (currentMode === "Playdate") st("right");
          else if (currentMode === "Owner") ost("right");
          else ap("prev");
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          if (currentMode === "Playdate") st("left");
          else if (currentMode === "Owner") ost("left");
          else ap("next");
        } else {
          Animated.spring(swipeAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const changeMode = (m: Mode) => {
    setMode(m);
    swipeAnim.setValue({ x: 0, y: 0 });
  };

  const handleAdoptionInterest = async () => {
    const card = cards[index % cards.length];
    if (!card) return;
    setApplyingAdoption(true);
    try {
      await PrivateAxios.post("/adoptions/apply", { petId: card.id, type: "adoption", message: "I'm interested in adopting this pet!" });
      animatePagination("next");
    } catch {
      animatePagination("next");
    } finally {
      setApplyingAdoption(false);
    }
  };

  const safeCards = cards.length > 0;
  const topCard = safeCards ? cards[index % cards.length] : null;
  const nextCard = safeCards ? cards[(index + 1) % cards.length] : null;
  const prevCard = safeCards ? cards[(index - 1 + cards.length) % cards.length] : null;
  const bgCard = (mode === "Playdate" || mode === "Owner") ? nextCard : (dragDir === "next" ? nextCard : prevCard);

  topCardRef.current = topCard;

  const isSwipeMode = mode === "Playdate" || mode === "Owner";
  const myPet = myPets[0];
  const breedPet = myPets.find((p: any) => p.isBreedingOpen);

  // Empty / loading states
  const renderEmpty = () => {
    if (mode === "Breed" && !breedPet) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: tk.text }]}>Enable Breed Mode</Text>
          <Text style={[styles.emptySubtitle, { color: tk.textMuted }]}>Go to your pet's profile and turn on breeding mode to find matches.</Text>
        </View>
      );
    }
    if (mode === "Playdate" && !myPet) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: tk.text }]}>Add a Pet First</Text>
          <Text style={[styles.emptySubtitle, { color: tk.textMuted }]}>Add your pet to start finding playdate partners nearby.</Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/add-pet")}>
            <Text style={styles.emptyBtnText}>Add a Pet</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: tk.text }]}>All caught up!</Text>
        <Text style={[styles.emptySubtitle, { color: tk.textMuted }]}>No more cards right now. Check back later.</Text>
        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: tk.card }]} onPress={() => loadCards(mode)}>
          <Text style={[styles.emptyBtnText, { color: tk.text }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tk.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: tk.text }]}>Match</Text>
        {/* <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {coords && <MapPin size={14} color={colors.primary} />}
          <TouchableOpacity onPress={() => router.push("/discover")}>
            <Text style={styles.filtersLink}>Filters</Text>
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Mode pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modePillsScroll} contentContainerStyle={styles.modePillsContent}>
        {modes.map((m) => {
          const isActive = mode === m;
          return (
            <TouchableOpacity key={m} onPress={() => changeMode(m)} style={[styles.modePill, { backgroundColor: isActive ? tk.text : tk.card }]}>
              <Text style={[styles.modePillText, { color: isActive ? tk.bg : tk.textMuted }]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Card area */}
      <View style={styles.cardArea}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: tk.textMuted }]}>Finding matches nearby...</Text>
          </View>
        ) : !topCard ? (
          renderEmpty()
        ) : (
          <>
            {/* Background card */}
            {bgCard && (
              <View style={[styles.card, { backgroundColor: bgCard.tintColor, transform: [{ rotate: "2deg" }, { translateX: 4 }], zIndex: 0 }]}>
                {bgCard.img ? (
                  <Image source={bgCard.img} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={styles.cardImagePlaceholder} />
                )}
                <View style={[styles.cardInfo, { backgroundColor: dark ? "rgba(28,28,46,0.85)" : "rgba(255,255,255,0.85)", borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)", borderWidth: 1 }]}>
                  <Text style={[styles.cardName, { color: dark ? "#FFFFFF" : colors.foreground }]}>{bgCard.name}</Text>
                  <Text style={[styles.cardMeta, { color: dark ? "rgba(255,255,255,0.7)" : "rgba(26,26,46,0.65)" }]}>{bgCard.meta}</Text>
                </View>
              </View>
            )}

            {/* Top swipeable card */}
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: topCard.tintColor,
                  zIndex: 10,
                  transform: [
                    { translateX: swipeAnim.x },
                    { translateY: swipeAnim.y },
                    { rotate: rotateAnim },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              {topCard.img ? (
                <Image source={topCard.img} style={styles.cardImage} resizeMode="cover" />
              ) : (
                <View style={[styles.cardImagePlaceholder, { backgroundColor: topCard.tintColor }]}>
                  <Text style={{ fontSize: 64 }}>{mode === "Owner" ? "👤" : "🐾"}</Text>
                </View>
              )}

              {/* Like/Nope stamps (Playdate + Owner swipe modes) */}
              {isSwipeMode && (
                <>
                  <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]}>
                    <Text style={[styles.stampText, { color: colors.success, borderColor: colors.success }]}>LIKE</Text>
                  </Animated.View>
                  <Animated.View style={[styles.nopeStamp, { opacity: nopeOpacity }]}>
                    <Text style={[styles.stampText, { color: colors.coral, borderColor: colors.coral }]}>NOPE</Text>
                  </Animated.View>
                </>
              )}

              {topCard.badge && (
                <View style={[styles.badgePill, { backgroundColor: topCard.badge === "ADOPT" ? colors.primary : colors.success }]}>
                  <Text style={styles.badgePillText}>{topCard.badge}</Text>
                </View>
              )}

              <View style={[styles.cardInfo, { backgroundColor: dark ? "rgba(28,28,46,0.85)" : "rgba(255,255,255,0.85)", borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)", borderWidth: 1 }]}>
                <Text style={[styles.cardName, { color: dark ? "#FFFFFF" : colors.foreground }]}>{topCard.name}</Text>
                <Text style={[styles.cardMeta, { color: dark ? "rgba(255,255,255,0.7)" : "rgba(26,26,46,0.65)" }]}>{topCard.meta}</Text>
                <Text style={[styles.cardTag, { color: dark ? "rgba(255,255,255,0.9)" : "rgba(26,26,46,0.85)" }]}>{topCard.tag}</Text>
              </View>
            </Animated.View>
          </>
        )}
      </View>

      {/* Action buttons */}
      {!loading && topCard && (
        <>
          {mode === "Playdate" && (
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => swipeTo("left")} style={[styles.actionBtn, styles.actionBtnSm, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                <X size={26} color={tk.text} strokeWidth={2.6} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => swipeTo("right")} style={[styles.actionBtn, styles.actionBtnLg, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
                <Heart size={30} color="#fff" fill="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => swipeTo("right")} style={[styles.actionBtn, styles.actionBtnSm, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                <Star size={26} color={colors.sunshine} fill={colors.sunshine} />
              </TouchableOpacity>
            </View>
          )}

          {mode === "Owner" && (
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => ownerSwipeTo("left")} style={[styles.actionBtn, styles.actionBtnSm, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                <X size={26} color={tk.text} strokeWidth={2.6} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => ownerSwipeTo("right")} style={[styles.actionBtn, styles.actionBtnLg, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
                <Heart size={30} color="#fff" fill="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {mode === "Adoption" && (
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => animatePagination("prev")} style={[styles.actionBtn, styles.actionBtnSm, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                <ArrowLeft size={26} color={tk.text} strokeWidth={2.4} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdoptionInterest}
                disabled={applyingAdoption}
                style={[styles.actionBtn, styles.adoptBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                {applyingAdoption ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.adoptBtnText}>I'm Interested 🐾</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => animatePagination("next")} style={[styles.actionBtn, styles.actionBtnSm, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                <ArrowRight size={26} color={tk.text} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          )}

          {mode === "Breed" && (
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => swipeTo("left")} style={[styles.actionBtn, styles.actionBtnSm, { backgroundColor: tk.card }]} activeOpacity={0.8}>
                <X size={26} color={tk.text} strokeWidth={2.6} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => swipeTo("right")} style={[styles.actionBtn, styles.actionBtnLg, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
                <Heart size={30} color="#fff" fill="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Match Modal */}
      {matchModal.visible && (
        <Animated.View style={[styles.matchOverlay, { opacity: matchModalAnim }]}>
          <Animated.View style={[styles.matchCard, { transform: [{ scale: matchModalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
            <Text style={styles.matchEmoji}>🐾</Text>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>
              You and {matchModal.matchName} both said yes!
            </Text>
            <TouchableOpacity
              style={styles.matchChatBtn}
              onPress={() => dismissMatchModal(matchModal.conversationId)}
            >
              <Text style={styles.matchChatBtnText}>Start Chatting</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMatchModal({ visible: false })}>
              <Text style={styles.matchSkipText}>Keep Swiping</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  title: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  filtersLink: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.primary },

  modePillsScroll: { flexGrow: 0, flexShrink: 0 },
  modePillsContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
    alignItems: "center",
  },
  modePill: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  modePillText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },

  cardArea: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  card: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    borderRadius: 32,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardImage: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  cardImagePlaceholder: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 16,
  },
  cardName: { fontFamily: "Poppins_700Bold", fontSize: 24, color: colors.foreground, lineHeight: 30 },
  cardMeta: { fontSize: 13, color: colors.foreground + "99", fontFamily: "Inter_400Regular", marginTop: 2 },
  cardTag: { marginTop: 8, fontSize: 14, color: colors.foreground, fontFamily: "Inter_500Medium" },

  badgePill: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgePillText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: "#fff" },

  likeStamp: { position: "absolute", top: 28, left: 20, transform: [{ rotate: "-15deg" }] },
  nopeStamp: { position: "absolute", top: 28, right: 20, transform: [{ rotate: "15deg" }] },
  stampText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    borderWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  actionBtn: {
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  actionBtnSm: { width: 58, height: 58 },
  actionBtnLg: { width: 74, height: 74 },
  adoptBtn: { height: 58, paddingHorizontal: 24, borderRadius: 30 },
  adoptBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#fff" },

  // Loading / empty states
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, textAlign: "center" },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  emptyBtn: { marginTop: 8, borderRadius: 24, paddingHorizontal: 28, paddingVertical: 12 },
  emptyBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" },

  // Match Modal
  matchOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 36,
    alignItems: "center",
    width: width * 0.82,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  matchEmoji: { fontSize: 56 },
  matchTitle: { fontFamily: "Poppins_700Bold", fontSize: 32, color: colors.foreground },
  matchSubtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground + "99", textAlign: "center" },
  matchChatBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  matchChatBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#fff" },
  matchSkipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.foreground + "66", marginTop: 4 },
});
