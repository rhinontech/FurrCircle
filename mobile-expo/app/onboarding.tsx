import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Path,
  Ellipse,
  G,
  Rect,
  Line,
  Polygon,
  Defs,
  RadialGradient,
  Stop,
} from "react-native-svg";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "@/components/ui/IconCompat";

const { width } = Dimensions.get("window");

// ─── Theme-aware token builder ─────────────────────────────────────────────────
function buildTokens(isDark: boolean) {
  const shared = {
    blue950: "#172554", blue900: "#1e3a8a", blue800: "#1e40af",
    blue700: "#1d4ed8", blue600: "#2563eb", blue500: "#3b82f6",
    blue400: "#60a5fa", blue300: "#93c5fd", blue200: "#bfdbfe",
    blue100: "#dbeafe",
    gray100: "#f1f5f9", gray300: "#cbd5e1", gray400: "#94a3b8",
    gray600: "#475569", gray700: "#334155", gray800: "#1e293b",
    gray900: "#0f172a",
    // Character illustration fills (same both modes — rich deep blue on any bg)
    charEarOuter: "#091a33", charEarInner: "#0e2244",
    charHead: "#163268", charMuzzle: "#1a3d7c",
  };

  if (isDark) {
    return {
      ...shared,
      bg: "#06101e", surface: "#0b1a30", card: "#0f2040",
      white: "#f8fafc",
      textPrimary: "#f8fafc", textMuted: "#94a3b8",
      badgeBg: "#172554", badgeBorder: "#1e40af", badgeText: "#60a5fa",
      skipBorder: "#334155", skipBg: "transparent", skipText: "#94a3b8",
      dotInactive: "#334155",
      signInText: "#94a3b8", signInLink: "#60a5fa",
      illGlowStart: "#1e40af", illGlowOpacity: "0.35",
      illRing: "#1e3a8a", illRingOuter: "#1e40af",
      illBg: "#0b1a30", illBgOpacity: 0.75,
      illCard: "#0f2040", illInner: "#0b1f3e",
    };
  }
  return {
    ...shared,
    bg: "#f0f6ff", surface: "#e0edff", card: "#dbeafe",
    white: "#ffffff",
    textPrimary: "#0f172a", textMuted: "#64748b",
    badgeBg: "#dbeafe", badgeBorder: "#bfdbfe", badgeText: "#1d4ed8",
    skipBorder: "#e2e8f0", skipBg: "#ffffff", skipText: "#475569",
    dotInactive: "#cbd5e1",
    signInText: "#64748b", signInLink: "#1d4ed8",
    illGlowStart: "#93c5fd", illGlowOpacity: "0.55",
    illRing: "#bfdbfe", illRingOuter: "#bfdbfe",
    illBg: "#e8f2ff", illBgOpacity: 0.75,
    illCard: "#dbeafe", illInner: "#eff6ff",
  };
}

type C = ReturnType<typeof buildTokens>;

// ─── SVG Helpers ───────────────────────────────────────────────────────────────
function PawPrint({ cx, cy, size = 1, color, opacity = 1 }: { cx: number; cy: number; size?: number; color: string; opacity?: number }) {
  return (
    <G opacity={opacity}>
      <Ellipse cx={cx} cy={cy + 7 * size} rx={12 * size} ry={10 * size} fill={color} />
      <Ellipse cx={cx - 11 * size} cy={cy - 2 * size} rx={6 * size} ry={5.5 * size} fill={color} />
      <Ellipse cx={cx - 4 * size} cy={cy - 9 * size} rx={5.5 * size} ry={5 * size} fill={color} />
      <Ellipse cx={cx + 4 * size} cy={cy - 9 * size} rx={5.5 * size} ry={5 * size} fill={color} />
      <Ellipse cx={cx + 11 * size} cy={cy - 2 * size} rx={6 * size} ry={5.5 * size} fill={color} />
    </G>
  );
}

function Sparkle({ x, y, size = 1, color, opacity = 0.85 }: { x: number; y: number; size?: number; color: string; opacity?: number }) {
  const s = size * 7;
  return (
    <G opacity={opacity}>
      <Line x1={x} y1={y - s} x2={x} y2={y + s} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={x - s} y1={y} x2={x + s} y2={y} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={x - s * 0.58} y1={y - s * 0.58} x2={x + s * 0.58} y2={y + s * 0.58} stroke={color} strokeWidth={1.1} strokeLinecap="round" opacity={0.5} />
      <Line x1={x + s * 0.58} y1={y - s * 0.58} x2={x - s * 0.58} y2={y + s * 0.58} stroke={color} strokeWidth={1.1} strokeLinecap="round" opacity={0.5} />
    </G>
  );
}

function Star({ cx, cy, R = 8, r = 4, color, opacity = 1 }: { cx: number; cy: number; R?: number; r?: number; color: string; opacity?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * 36 - 90) * (Math.PI / 180);
    const radius = i % 2 === 0 ? R : r;
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return <Polygon points={pts.join(" ")} fill={color} opacity={opacity} />;
}

// ─── Illustrations ─────────────────────────────────────────────────────────────

function DogIllustration({ c }: { c: C }) {
  return (
    <Svg width={270} height={270} viewBox="0 0 280 280">
      <Defs>
        <RadialGradient id="dog_glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={c.illGlowStart} stopOpacity={c.illGlowOpacity} />
          <Stop offset="100%" stopColor={c.bg} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="140" cy="140" r="130" fill="url(#dog_glow)" />
      <Circle cx="140" cy="140" r="120" stroke={c.illRing} strokeWidth="1.2" fill="none" opacity={0.8} />
      <Circle cx="140" cy="140" r="100" stroke={c.illRingOuter} strokeWidth="0.8" fill="none" opacity={0.5} />
      <Circle cx="140" cy="148" r="88" fill={c.illBg} opacity={c.illBgOpacity} />

      {/* Left Ear */}
      <Path d="M 72 122 C 42 108 30 165 48 198 C 58 218 90 215 102 190 C 114 166 104 130 84 122 Z" fill={c.charEarOuter} />
      <Path d="M 76 127 C 52 115 42 165 57 194 C 65 210 90 208 100 187 C 110 166 102 134 84 127 Z" fill={c.charEarInner} />
      {/* Right Ear */}
      <Path d="M 208 122 C 238 108 250 165 232 198 C 222 218 190 215 178 190 C 166 166 176 130 196 122 Z" fill={c.charEarOuter} />
      <Path d="M 204 127 C 228 115 238 165 223 194 C 215 210 190 208 180 187 C 170 166 178 134 196 127 Z" fill={c.charEarInner} />

      {/* Head */}
      <Circle cx="140" cy="154" r="84" fill={c.charHead} />
      <Ellipse cx="140" cy="105" rx="52" ry="22" fill="white" opacity={0.06} />

      {/* Muzzle */}
      <Ellipse cx="140" cy="194" rx="42" ry="34" fill={c.charMuzzle} />

      {/* Left Eye */}
      <Circle cx="112" cy="152" r="18" fill={c.gray100} />
      <Circle cx="116" cy="154" r="11" fill={c.gray900} />
      <Circle cx="121" cy="148" r="4.5" fill="white" />
      {/* Right Eye */}
      <Circle cx="168" cy="152" r="18" fill={c.gray100} />
      <Circle cx="172" cy="154" r="11" fill={c.gray900} />
      <Circle cx="177" cy="148" r="4.5" fill="white" />

      {/* Eyebrows */}
      <Path d="M 97 130 Q 112 121 127 129" stroke={c.blue200} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M 153 129 Q 168 121 183 130" stroke={c.blue200} strokeWidth="2.8" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <Ellipse cx="140" cy="188" rx="16" ry="11" fill={c.gray900} />
      <Ellipse cx="133" cy="183" rx="6" ry="3.8" fill="#2e3a4a" opacity={0.7} />

      {/* Mouth */}
      <Path d="M 125 200 Q 140 214 155 200" stroke={c.blue200} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M 140 194 L 140 200" stroke={c.gray900} strokeWidth="2.2" strokeLinecap="round" />

      {/* Cheek blush */}
      <Circle cx="96" cy="176" r="14" fill={c.blue500} opacity={0.1} />
      <Circle cx="184" cy="176" r="14" fill={c.blue500} opacity={0.1} />

      {/* Collar */}
      <Rect x="106" y="228" width="68" height="15" rx="7.5" fill={c.blue600} />
      <Circle cx="140" cy="247" r="10" fill={c.blue400} />
      <PawPrint cx={140} cy={246} size={0.42} color={c.blue900} opacity={1} />
      <Ellipse cx="134" cy="242" rx="3" ry="2" fill="white" opacity={0.28} />

      <PawPrint cx={218} cy={55} size={0.88} color={c.blue500} opacity={0.65} />
      <PawPrint cx={45} cy={205} size={0.6} color={c.blue400} opacity={0.35} />
      <Sparkle x={44} y={72} size={0.95} color={c.blue400} />
      <Sparkle x={240} y={165} size={0.75} color={c.blue400} opacity={0.7} />
      <Sparkle x={250} y={88} size={0.65} color={c.blue300} opacity={0.65} />
      <Circle cx="248" cy="200" r="3" fill={c.blue400} opacity={0.5} />
      <Circle cx="33" cy="140" r="2.5" fill={c.blue400} opacity={0.45} />
      <Circle cx="40" cy="108" r="2" fill={c.blue300} opacity={0.6} />
    </Svg>
  );
}

function HealthIllustration({ c }: { c: C }) {
  return (
    <Svg width={270} height={270} viewBox="0 0 280 280">
      <Defs>
        <RadialGradient id="health_glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={c.illGlowStart} stopOpacity={c.illGlowOpacity} />
          <Stop offset="100%" stopColor={c.bg} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="140" cy="140" r="130" fill="url(#health_glow)" />
      <Circle cx="140" cy="140" r="120" stroke={c.illRing} strokeWidth="1.2" fill="none" opacity={0.8} />
      <Circle cx="140" cy="140" r="100" stroke={c.illRingOuter} strokeWidth="0.8" fill="none" opacity={0.5} />

      <Path d="M 140 42 L 236 78 L 236 158 C 236 210 140 248 140 248 C 140 248 44 210 44 158 L 44 78 Z" fill={c.blue200} opacity={0.22} />
      <Path d="M 140 50 L 228 84 L 228 158 C 228 206 140 240 140 240 C 140 240 52 206 52 158 L 52 84 Z" fill={c.illCard} stroke={c.blue400} strokeWidth="1.8" />
      <Path d="M 140 66 L 212 96 L 212 158 C 212 196 140 224 140 224 C 140 224 68 196 68 158 L 68 96 Z" fill={c.illInner} opacity={0.9} />

      <PawPrint cx={140} cy={118} size={1.55} color={c.blue600} opacity={0.95} />

      <Path d="M 68 165 L 95 165 L 107 135 L 120 193 L 133 145 L 141 168 L 150 165 L 212 165" stroke={c.blue500} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M 68 165 L 95 165 L 107 135 L 120 193 L 133 145 L 141 168 L 150 165 L 212 165" stroke={c.blue300} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.45} />

      <Rect x="132" y="70" width="16" height="5.5" rx="2.5" fill={c.blue500} opacity={0.55} />
      <Rect x="136.5" y="64" width="5.5" height="16" rx="2.5" fill={c.blue500} opacity={0.55} />

      <Circle cx="197" cy="84" r="14" fill={c.blue700} stroke={c.blue500} strokeWidth="1.2" />
      <Star cx={197} cy={84} R={8} r={4} color={c.blue200} opacity={0.95} />

      <PawPrint cx={40} cy={82} size={0.72} color={c.blue500} opacity={0.45} />
      <PawPrint cx={245} cy={198} size={0.65} color={c.blue400} opacity={0.4} />
      <Sparkle x={248} y={70} size={0.88} color={c.blue400} />
      <Sparkle x={36} y={200} size={0.7} color={c.blue400} opacity={0.65} />
      <Circle cx="244" cy="130" r="3" fill={c.blue400} opacity={0.55} />
      <Circle cx="35" cy="148" r="2.5" fill={c.blue400} opacity={0.45} />
      <Circle cx="40" cy="112" r="2" fill={c.blue300} opacity={0.6} />
    </Svg>
  );
}

function VetIllustration({ c }: { c: C }) {
  return (
    <Svg width={270} height={270} viewBox="0 0 280 280">
      <Defs>
        <RadialGradient id="vet_glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={c.illGlowStart} stopOpacity={c.illGlowOpacity} />
          <Stop offset="100%" stopColor={c.bg} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="140" cy="140" r="130" fill="url(#vet_glow)" />
      <Circle cx="140" cy="140" r="120" stroke={c.illRing} strokeWidth="1.2" fill="none" opacity={0.8} />
      <Circle cx="140" cy="140" r="100" stroke={c.illRingOuter} strokeWidth="0.8" fill="none" opacity={0.5} />
      <Circle cx="140" cy="148" r="88" fill={c.illBg} opacity={0.65} />

      <Path d="M 84 86 C 84 48 196 48 196 86 L 196 150 C 196 192 168 218 140 226 C 112 218 84 192 84 150 Z" stroke={c.blue300} strokeWidth="18" fill="none" strokeLinecap="round" opacity={0.28} />
      <Path d="M 84 86 C 84 48 196 48 196 86 L 196 150 C 196 192 168 218 140 226 C 112 218 84 192 84 150 Z" stroke={c.blue600} strokeWidth="13" fill="none" strokeLinecap="round" />
      <Path d="M 84 86 C 84 48 196 48 196 86 L 196 150 C 196 192 168 218 140 226 C 112 218 84 192 84 150 Z" stroke={c.blue300} strokeWidth="5" fill="none" strokeLinecap="round" opacity={0.38} />

      <Path d="M 68 68 L 84 84" stroke={c.blue600} strokeWidth="11" strokeLinecap="round" />
      <Path d="M 212 68 L 196 84" stroke={c.blue600} strokeWidth="11" strokeLinecap="round" />
      <Circle cx="68" cy="68" r="9" fill={c.blue700} />
      <Circle cx="68" cy="68" r="4.5" fill={c.blue300} />
      <Circle cx="212" cy="68" r="9" fill={c.blue700} />
      <Circle cx="212" cy="68" r="4.5" fill={c.blue300} />
      <Circle cx="84" cy="86" r="10" fill={c.blue700} />
      <Circle cx="196" cy="86" r="10" fill={c.blue700} />

      <Circle cx="140" cy="226" r="30" fill={c.blue700} stroke={c.blue400} strokeWidth="2.2" />
      <Circle cx="140" cy="226" r="23" fill={c.illCard} />
      <PawPrint cx={140} cy={224} size={0.95} color={c.blue600} opacity={0.95} />
      <Ellipse cx="130" cy="217" rx="9" ry="5.5" fill="white" opacity={0.09} />

      <Circle cx="206" cy="85" r="22" fill={c.blue800} stroke={c.blue500} strokeWidth="1.5" />
      <Circle cx="206" cy="85" r="15" fill={c.illCard} />
      <Rect x="200" y="80" width="12" height="4" rx="2" fill={c.blue600} />
      <Rect x="204" y="76" width="4" height="12" rx="2" fill={c.blue600} />

      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} cx={95 + i * 22} cy={50} R={7} r={3.5} color={c.blue500} opacity={0.85} />
      ))}

      <PawPrint cx={38} cy={186} size={0.68} color={c.blue500} opacity={0.4} />
      <PawPrint cx={247} cy={78} size={0.6} color={c.blue400} opacity={0.35} />
      <Sparkle x={42} y={82} size={0.85} color={c.blue400} />
      <Sparkle x={248} y={188} size={0.72} color={c.blue400} opacity={0.65} />
      <Circle cx="253" cy="138" r="3" fill={c.blue400} opacity={0.5} />
      <Circle cx="30" cy="130" r="2.5" fill={c.blue400} opacity={0.45} />
    </Svg>
  );
}

function CommunityIllustration({ c }: { c: C }) {
  return (
    <Svg width={270} height={270} viewBox="0 0 280 280">
      <Defs>
        <RadialGradient id="comm_glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={c.illGlowStart} stopOpacity={c.illGlowOpacity} />
          <Stop offset="100%" stopColor={c.bg} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="140" cy="140" r="130" fill="url(#comm_glow)" />
      <Circle cx="140" cy="140" r="120" stroke={c.illRing} strokeWidth="1.2" fill="none" opacity={0.8} />
      <Circle cx="140" cy="140" r="100" stroke={c.illRingOuter} strokeWidth="0.8" fill="none" opacity={0.5} />

      <Path d="M 140 234 C 46 192 36 130 36 106 C 36 72 62 52 88 52 C 110 52 130 66 140 82 C 150 66 170 52 192 52 C 218 52 244 72 244 106 C 244 130 234 192 140 234 Z" fill={c.blue200} opacity={0.25} />
      <Path d="M 140 226 C 50 186 44 128 44 108 C 44 78 68 60 92 60 C 112 60 130 72 140 88 C 150 72 168 60 188 60 C 212 60 236 78 236 108 C 236 128 230 186 140 226 Z" fill={c.illCard} stroke={c.blue400} strokeWidth="1.8" />
      <Path d="M 140 212 C 62 176 60 128 60 110 C 60 86 78 72 96 72 C 114 72 130 82 140 96 C 150 82 166 72 184 72 C 202 72 220 86 220 110 C 220 128 218 176 140 212 Z" fill={c.illInner} opacity={0.9} />

      <PawPrint cx={140} cy={148} size={1.5} color={c.blue600} opacity={0.95} />
      <PawPrint cx={98} cy={142} size={0.85} color={c.blue500} opacity={0.6} />
      <PawPrint cx={182} cy={142} size={0.85} color={c.blue500} opacity={0.6} />
      <PawPrint cx={118} cy={182} size={0.78} color={c.blue400} opacity={0.5} />
      <PawPrint cx={162} cy={182} size={0.78} color={c.blue400} opacity={0.5} />

      <Path d="M 80 112 Q 100 96 120 112" stroke={c.blue400} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.45} />
      <Path d="M 160 112 Q 180 96 200 112" stroke={c.blue400} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.45} />

      <Circle cx="76" cy="80" r="22" fill={c.blue800} stroke={c.blue600} strokeWidth="1.5" />
      <PawPrint cx={76} cy={79} size={0.72} color={c.blue200} opacity={0.95} />
      <Circle cx="140" cy="68" r="24" fill={c.blue700} stroke={c.blue400} strokeWidth="1.8" />
      <PawPrint cx={140} cy={67} size={0.78} color={c.white} opacity={0.9} />
      <Circle cx="204" cy="80" r="22" fill={c.blue800} stroke={c.blue600} strokeWidth="1.5" />
      <PawPrint cx={204} cy={79} size={0.72} color={c.blue200} opacity={0.95} />

      <Circle cx="106" cy="74" r="4" fill={c.blue500} opacity={0.6} />
      <Circle cx="174" cy="74" r="4" fill={c.blue500} opacity={0.6} />

      <Sparkle x={38} y={158} size={0.9} color={c.blue400} />
      <Sparkle x={245} y={148} size={0.75} color={c.blue400} opacity={0.7} />
      <Sparkle x={248} y={74} size={0.82} color={c.blue300} />
      <Circle cx="36" cy="98" r="3" fill={c.blue400} opacity={0.5} />
      <Circle cx="252" cy="210" r="2.5" fill={c.blue300} opacity={0.45} />
    </Svg>
  );
}

// ─── Slide Data ────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: "1",
    Illustration: DogIllustration,
    badge: "WELCOME",
    title: "Welcome to\nFurrCircle",
    description: "Your all-in-one companion for your pet's health, happiness, and professional care.",
  },
  {
    id: "2",
    Illustration: HealthIllustration,
    badge: "HEALTH",
    title: "Track Every\nMilestone",
    description: "Smart reminders keep vaccines, checkups, and health records perfectly up to date.",
  },
  {
    id: "3",
    Illustration: VetIllustration,
    badge: "VETS",
    title: "Expert Vet\nNetwork",
    description: "Connect instantly with certified veterinarians for consultations and professional advice.",
  },
  {
    id: "4",
    Illustration: CommunityIllustration,
    badge: "COMMUNITY",
    title: "Join the\nCircle",
    description: "Share stories, get advice, and connect with thousands of passionate pet owners.",
  },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const { isDark } = useTheme();
  const c = buildTokens(isDark);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatY.value, [0, 1], [0, -13]) }],
  }));

  const fadeIn = useSharedValue(1);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [14, 0]) }],
  }));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / width);
    if (idx !== activeIndex) {
      fadeIn.value = 0;
      fadeIn.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) });
      setActiveIndex(idx);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace("/login");
  };

  const nextSlide = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      handleComplete();
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />

      {/* Header */}
      <View style={{ height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24 }}>
        <Image
          source={isDark
            ? require("../assets/furrcircle_dark_logo.png")
            : require("../assets/furrcircle_light_logo.png")
          }
          style={{ height: 45, width: 140 }}
          resizeMode="contain"
        />
        {!isLast && (
          <Pressable
            onPress={handleComplete}
            style={({ pressed }) => ({
              opacity: pressed ? 0.55 : 1,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: c.skipBorder,
              backgroundColor: c.skipBg,
            })}
          >
            <Text style={{ color: c.skipText, fontSize: 13, fontWeight: "600", letterSpacing: 0.4 }}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        bounces={false}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={{ width, flex: 1, alignItems: "center", paddingTop: 8 }}>
            <Reanimated.View style={floatStyle}>
              <slide.Illustration c={c} />
            </Reanimated.View>

            <Reanimated.View style={[contentStyle, { alignItems: "center", paddingHorizontal: 32, marginTop: 28 }]}>
              <View style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: c.badgeBg, borderWidth: 1, borderColor: c.badgeBorder, marginBottom: 18 }}>
                <Text style={{ color: c.badgeText, fontSize: 11, fontWeight: "700", letterSpacing: 2 }}>{slide.badge}</Text>
              </View>
              <Text style={{ fontSize: 32, fontWeight: "800", color: c.textPrimary, textAlign: "center", lineHeight: 40, letterSpacing: -0.5, marginBottom: 14 }}>
                {slide.title}
              </Text>
              <Text style={{ fontSize: 16, color: c.textMuted, textAlign: "center", lineHeight: 25, maxWidth: 300 }}>
                {slide.description}
              </Text>
            </Reanimated.View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 38 }}>
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, marginBottom: 26 }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 26 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === activeIndex ? c.blue600 : c.dotInactive,
              }}
            />
          ))}
        </View>

        <Pressable onPress={nextSlide} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
          <LinearGradient
            colors={[c.blue600, c.blue800]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 62,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              shadowColor: c.blue600,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.45 : 0.3,
              shadowRadius: 18,
              elevation: 12,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#ffffff", letterSpacing: 0.3 }}>
              {isLast ? "Get Started" : "Continue"}
            </Text>
            <ArrowRight size={20} color="#ffffff" strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>

        {isLast && (
          <Pressable onPress={handleComplete} style={{ marginTop: 18, alignItems: "center" }}>
            <Text style={{ color: c.signInText, fontSize: 14 }}>
              Already have an account?{" "}
              <Text style={{ color: c.signInLink, fontWeight: "600" }}>Sign in</Text>
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
