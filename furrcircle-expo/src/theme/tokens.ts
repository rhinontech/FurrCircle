/**
 * FurrCircle design tokens.
 *
 * The palette is sampled from the brand mark (assets/logo.png): a circular
 * emblem of a dog, cat, rabbit and bird around a paw print, drawn in three
 * blues on white. Those three blues are brand.800 / brand.500 / brand.400.
 */

export const palette = {
  brand: {
    50: "#EEF4FD",
    100: "#DCE8F9",
    200: "#B3CDEF",
    300: "#7FA9DE",
    400: "#548ACB", // logo — sky blue (cat, bird highlight)
    500: "#4576B9", // logo — royal blue (mid swirl)
    600: "#2C63AE",
    700: "#1A4B8D", // logo — deep blue
    800: "#163D7D", // logo — navy (dog, outer ring)
    900: "#0E2A5C",
    950: "#081A3B",
  },
  /** Warm counterpoint: care reminders, streaks, "due" states. */
  amber: { 300: "#FBD38D", 400: "#F5B963", 500: "#E89B3C", 600: "#C97C22" },
  /** Health-positive: caught up, completed doses, verified availability. */
  mint: { 300: "#7EE0B8", 400: "#3FC492", 500: "#22A06B", 600: "#178055" },
  /** Clinical trust: verified vets, teleconsult. */
  teal: { 300: "#7BDCDC", 400: "#2CBFBF", 500: "#0EA5A5", 600: "#08807F" },
  /** Urgency: overdue, emergency. Used sparingly and never as panic language. */
  coral: { 300: "#FFAFA8", 400: "#F87A72", 500: "#E5484D", 600: "#BF2E36" },
  /** Community / social surfaces. */
  violet: { 300: "#C6B6F7", 400: "#A48AF0", 500: "#8367E3", 600: "#6647C4" },
  white: "#FFFFFF",
  black: "#000000",
} as const;

export type Tokens = {
  scheme: "light" | "dark";

  // Ground
  bg: string;
  bgElevated: string;
  /** Ambient gradient stops painted behind every screen. */
  ambient: [string, string, string];
  /** Colour blobs floating in the ambient backdrop. */
  blobs: { color: string; opacity: number }[];

  // Glass
  /** Cheap faux-glass fill for list rows and cards (no blur). */
  glass: string;
  /** Heavier fill for sheets, tab bars and anything over busy content. */
  glassStrong: string;
  /** Small interactive surfaces: chips, icon buttons, segmented controls. */
  glassChip: string;
  glassBorder: string;
  /** Scrim behind modals. */
  scrim: string;

  // Ink
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Accents
  primary: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  verified: string;
  verifiedSoft: string;
  community: string;
  communitySoft: string;

  border: string;
  separator: string;
  shadow: string;
};

export const lightTokens: Tokens = {
  scheme: "light",

  bg: "#DFEBF9",
  bgElevated: "#FFFFFF",
  ambient: ["#ECF4FE", "#D0E3F8", "#B5D0F0"],
  // Blue-dominant. A warm blob under a translucent white panel turns it brassy,
  // so the only non-blue here is a cool teal for depth.
  blobs: [
    { color: palette.brand[400], opacity: 0.32 },
    { color: palette.brand[600], opacity: 0.22 },
    { color: palette.teal[300], opacity: 0.2 },
    { color: palette.brand[300], opacity: 0.3 },
  ],

  // Translucent enough that the blue ground reads through the panel — that is
  // what makes it glass. Push these opacities up and it goes grey.
  glass: "rgba(247,251,255,0.55)",
  glassStrong: "rgba(250,253,255,0.76)",
  glassChip: "rgba(247,251,255,0.40)",
  glassBorder: "rgba(255,255,255,0.62)",
  scrim: "rgba(14,27,51,0.35)",

  text: "#0E1B33",
  textSecondary: "#3F5273",
  textMuted: "#4D6184",
  textInverse: "#FFFFFF",

  primary: palette.brand[700],
  primarySoft: "rgba(69,118,185,0.14)",
  onPrimary: "#FFFFFF",
  success: palette.mint[500],
  successSoft: "rgba(34,160,107,0.14)",
  warning: palette.amber[600],
  warningSoft: "rgba(232,155,60,0.16)",
  danger: palette.coral[500],
  dangerSoft: "rgba(229,72,77,0.13)",
  verified: palette.teal[500],
  verifiedSoft: "rgba(14,165,165,0.14)",
  community: palette.violet[500],
  communitySoft: "rgba(131,103,227,0.14)",

  border: "rgba(22,61,125,0.10)",
  separator: "rgba(22,61,125,0.08)",
  shadow: "#0E2A5C",
};

export const darkTokens: Tokens = {
  scheme: "dark",

  bg: "#060B16",
  bgElevated: "#0D1728",
  ambient: ["#0A1326", "#070D1B", "#04070E"],
  blobs: [
    { color: palette.brand[500], opacity: 0.3 },
    { color: palette.brand[400], opacity: 0.22 },
    { color: palette.teal[500], opacity: 0.18 },
    { color: palette.brand[700], opacity: 0.28 },
  ],

  // Tinted blue rather than plain white-on-black, which renders as flat grey.
  glass: "rgba(126,174,238,0.10)",
  glassStrong: "rgba(15,27,50,0.76)",
  glassChip: "rgba(126,174,238,0.13)",
  glassBorder: "rgba(152,196,246,0.16)",
  scrim: "rgba(3,6,14,0.6)",

  text: "#EAF0FA",
  textSecondary: "#A3B4D0",
  textMuted: "#9CADCA",
  textInverse: "#0E1B33",

  primary: "#93B6E8",
  primarySoft: "rgba(127,169,222,0.16)",
  onPrimary: "#081A3B",
  success: palette.mint[400],
  successSoft: "rgba(63,196,146,0.16)",
  warning: palette.amber[400],
  warningSoft: "rgba(245,185,99,0.16)",
  danger: palette.coral[400],
  dangerSoft: "rgba(248,122,114,0.16)",
  verified: palette.teal[400],
  verifiedSoft: "rgba(44,191,191,0.16)",
  community: palette.violet[400],
  communitySoft: "rgba(164,138,240,0.16)",

  border: "rgba(255,255,255,0.10)",
  separator: "rgba(255,255,255,0.07)",
  shadow: "#000000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  "2xl": 32,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: "800" as const, letterSpacing: -0.7 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "800" as const, letterSpacing: -0.5 },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: "700" as const, letterSpacing: -0.3 },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: "700" as const, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: "500" as const },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: "700" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  micro: { fontSize: 11, lineHeight: 15, fontWeight: "700" as const, letterSpacing: 0.4 },
} as const;

/** Bottom padding that clears the floating glass tab bar. */
export const TAB_BAR_CLEARANCE = 108;
