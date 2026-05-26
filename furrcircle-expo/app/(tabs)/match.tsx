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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Heart, X, Star, ArrowLeft, ArrowRight } from "lucide-react-native";
import { useState, useRef, useCallback, useEffect } from "react";
import { colors } from "../../src/lib/theme";
import { useTokens } from "../../src/lib/theme-store";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const SWIPE_THRESHOLD = width * 0.3;

type Mode = "Playdate" | "Adoption" |  "Breed" | "Owner";
const modes: Mode[] = ["Playdate", "Adoption", "Breed", "Owner"];

type Card = { id: string; img: any; name: string; meta: string; tag: string; tintColor: string; badge?: string };

const cardsByMode: Record<Mode, Card[]> = {
  Adoption: [
    { id: "biscuit", img: require("../../src/assets/doodle-puppy.png"), name: "Biscuit", meta: "Beagle · 4 mo · 0.8 km", tag: "Looking for a forever home", tintColor: "#FFF3CD", badge: "NEW" },
    { id: "coco", img: require("../../src/assets/doodle-rescue.png"), name: "Coco", meta: "Indie · 1 yr · 2.1 km", tag: "Rescued · vaccinated · neutered", tintColor: "#E8F5E9" },
    { id: "mochi", img: require("../../src/assets/doodle-cat.png"), name: "Mochi", meta: "Persian Mix · 1 yr · 1.2 km", tag: "Loves cuddles & windows", tintColor: "#FCE4EC" },
  ],
  Playdate: [
    { id: "moona", img: require("../../src/assets/doodle-boy-dog.png"), name: "Moona", meta: "Border Collie · 2 y · 0.4 km", tag: "Free this Sunday at Joggers Park", tintColor: "#FFEBEE", badge: "ONLINE" },
    { id: "rio", img: require("../../src/assets/doodle-walk.png"), name: "Rio", meta: "Labrador · 3 y · 1.1 km", tag: "Loves long beach walks", tintColor: "#E3F2FD" },
    { id: "toffee", img: require("../../src/assets/doodle-puppy.png"), name: "Toffee", meta: "Cocker Spaniel · 8 mo · 0.9 km", tag: "Puppy energy, needs friends", tintColor: "#FFFDE7" },
  ],
  Breed: [
    { id: "max", img: require("../../src/assets/doodle-puppy.png"), name: "Max", meta: "Beagle · ♂ · 2 y · KCI", tag: "Stud · all health clearances", tintColor: "#FFFDE7", badge: "VERIFIED" },
    { id: "skye", img: require("../../src/assets/doodle-boy-dog.png"), name: "Skye", meta: "Border Collie · ♀ · 3 y", tag: "Champion bloodline · DNA tested", tintColor: "#E3F2FD" },
    { id: "pearl", img: require("../../src/assets/doodle-cat.png"), name: "Pearl", meta: "Persian · ♀ · 2 y", tag: "Show grade · CFA registered", tintColor: "#FCE4EC" },
  ],
  Owner: [
    { id: "aanya", img: require("../../src/assets/doodle-group.png"), name: "Aanya, 27", meta: "Mumbai · 2 cats · vegetarian home", tag: "Looking for cat-friendly playdates", tintColor: "#FCE4EC", badge: "NEW" },
    { id: "rohan", img: require("../../src/assets/doodle-walk.png"), name: "Rohan, 31", meta: "Bandra · 1 lab · morning runner", tag: "Weekend hike buddy wanted 🐾", tintColor: "#E3F2FD" },
    { id: "priya", img: require("../../src/assets/doodle-boy-dog.png"), name: "Priya, 24", meta: "Powai · 1 indie · trainer in training", tag: "Want to swap training tips", tintColor: "#FFEBEE" },
  ],
};

export default function MatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tk = useTokens();
  const [mode, setMode] = useState<Mode>("Playdate");
  const [index, setIndex] = useState(0);
  const [dragDir, setDragDir] = useState<"next" | "prev">("next");

  const cards = cardsByMode[mode];
  const top = cards[index % cards.length];
  const next = cards[(index + 1) % cards.length];
  const prev = cards[(index - 1 + cards.length) % cards.length];
  const bgCard = mode === "Playdate" ? next : (dragDir === "next" ? next : prev);

  const swipeAnim = useRef(new Animated.ValueXY()).current;
  const rotateAnim = swipeAnim.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ["-8deg", "0deg", "8deg"],
    extrapolate: "clamp",
  });
  const likeOpacity = swipeAnim.x.interpolate({ inputRange: [0, width * 0.2], outputRange: [0, 1], extrapolate: "clamp" });
  const nopeOpacity = swipeAnim.x.interpolate({ inputRange: [-width * 0.2, 0], outputRange: [1, 0], extrapolate: "clamp" });

  const advance = useCallback(() => {
    setIndex((i) => i + 1);
    swipeAnim.setValue({ x: 0, y: 0 });
  }, [swipeAnim]);

  const swipeTo = useCallback((direction: "left" | "right") => {
    Animated.timing(swipeAnim, {
      toValue: { x: direction === "right" ? width * 1.5 : -width * 1.5, y: 0 },
      duration: 280,
      useNativeDriver: true,
    }).start(advance);
  }, [swipeAnim, advance]);

  const animatePagination = useCallback((dir: "next" | "prev") => {
    Animated.timing(swipeAnim, {
      toValue: { x: dir === "next" ? -width * 1.5 : width * 1.5, y: 0 },
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setIndex((i) => {
        if (dir === "next") {
          return (i + 1) % cards.length;
        } else {
          return (i - 1 + cards.length) % cards.length;
        }
      });
      swipeAnim.setValue({ x: 0, y: 0 });
    });
  }, [swipeAnim, cards.length]);

  const handlePrev = () => {
    animatePagination("prev");
  };

  const handleNext = () => {
    animatePagination("next");
  };

  useEffect(() => {
    setDragDir("next");
  }, [index, mode]);

  useEffect(() => {
    const id = swipeAnim.x.addListener(({ value }) => {
      if (value > 5 && dragDir !== "prev") {
        setDragDir("prev");
      } else if (value < -5 && dragDir !== "next") {
        setDragDir("next");
      }
    });
    return () => swipeAnim.x.removeListener(id);
  }, [dragDir]);

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const topIdRef = useRef(top.id);
  topIdRef.current = top.id;

  const handlersRef = useRef({ swipeTo, animatePagination });
  handlersRef.current = { swipeTo, animatePagination };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        swipeAnim.setValue({
          x: gs.dx,
          y: modeRef.current === "Playdate" ? gs.dy : gs.dy * 0.2
        });
      },
      onPanResponderRelease: (_, gs) => {
        const currentMode = modeRef.current;
        const currentTopId = topIdRef.current;
        const { swipeTo: currentSwipeTo, animatePagination: currentAnimatePagination } = handlersRef.current;

        const isTap = Math.abs(gs.dx) < 8 && Math.abs(gs.dy) < 8;
        if (isTap) {
          if (currentMode !== "Playdate") {
            router.push(`/p/${currentTopId}`);
          }
          return;
        }

        if (gs.dx > SWIPE_THRESHOLD) {
          if (currentMode === "Playdate") {
            currentSwipeTo("right");
          } else {
            currentAnimatePagination("prev");
          }
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          if (currentMode === "Playdate") {
            currentSwipeTo("left");
          } else {
            currentAnimatePagination("next");
          }
        } else {
          Animated.spring(swipeAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const changeMode = (m: Mode) => {
    setMode(m);
    setIndex(0);
    swipeAnim.setValue({ x: 0, y: 0 });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tk.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: tk.text }]}>Match</Text>
        <TouchableOpacity onPress={() => router.push("/discover")}>
          <Text style={styles.filtersLink}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Mode pills — fixed height row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.modePillsScroll}
        contentContainerStyle={styles.modePillsContent}
      >
        {modes.map((m) => {
          const isActive = mode === m;
          return (
            <TouchableOpacity
              key={m}
              onPress={() => changeMode(m)}
              style={[styles.modePill, { backgroundColor: isActive ? tk.text : tk.card }]}
            >
              <Text style={[styles.modePillText, { color: isActive ? tk.bg : tk.textMuted }]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stacked cards */}
      <View style={styles.cardArea}>
        {/* Background card */}
        <View style={[styles.card, { backgroundColor: bgCard.tintColor, transform: [{ rotate: "2deg" }, { translateX: 4 }], zIndex: 0 }]}>
          <Image source={bgCard.img} style={styles.cardImage} resizeMode="contain" />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{bgCard.name}</Text>
            <Text style={styles.cardMeta}>{bgCard.meta}</Text>
            <Text style={styles.cardTag}>{bgCard.tag}</Text>
          </View>
        </View>

        {/* Top swipeable card */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: top.tintColor,
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
          <Image source={top.img} style={styles.cardImage} resizeMode="contain" />

          {/* Like overlay (Playdate only) */}
          {mode === "Playdate" && (
            <>
              <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]}>
                <Text style={[styles.stampText, { color: colors.success, borderColor: colors.success }]}>LIKE</Text>
              </Animated.View>
              <Animated.View style={[styles.nopeStamp, { opacity: nopeOpacity }]}>
                <Text style={[styles.stampText, { color: colors.coral, borderColor: colors.coral }]}>NOPE</Text>
              </Animated.View>
            </>
          )}

          {top.badge && (
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{top.badge}</Text>
            </View>
          )}

          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{top.name}</Text>
            <Text style={styles.cardMeta}>{top.meta}</Text>
            <Text style={styles.cardTag}>{top.tag}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Action buttons */}
      {mode === "Playdate" ? (
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
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handlePrev} style={[styles.actionBtn, styles.actionBtnLg, { backgroundColor: tk.card }]} activeOpacity={0.8}>
            <ArrowLeft size={28} color={tk.text} strokeWidth={2.4} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={[styles.actionBtn, styles.actionBtnLg, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
            <ArrowRight size={28} color="#fff" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
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
   title: { fontFamily: "Poppins_700Bold", fontSize: 28, color: colors.foreground },
  filtersLink: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.primary },

  // Pill row — key fix: style on the ScrollView itself to not stretch
  modePillsScroll: { flexGrow: 0, flexShrink: 0 },
  modePillsContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
    alignItems: "center",   // ← prevents vertical stretch
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
  modePillActive: { backgroundColor: colors.foreground },
  modePillText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.foreground + "99" },
  modePillTextActive: { color: colors.white },

  // Card area
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
    left: "10%",
    right: "10%",
    top: 24,
    height: "65%",
    width: "80%",
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
    backgroundColor: colors.success,
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

  // Action row
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
});
