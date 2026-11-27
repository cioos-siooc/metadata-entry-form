/**
 * Design tokens.
 *
 * The direction is CIOOS brand-forward: continuity with the web app's teal, an
 * institutional register, and nothing decorative. The accent is not fixed here
 * — it comes from the active region at runtime and is tone-mapped by
 * @cioos/shared/theme/accent.js, because the six regional brand colours range
 * from near-black to saturated yellow and half of them are illegible used raw.
 *
 * Three themes. Night mode is not "dark mode, darker": it suppresses the blue
 * channel to preserve dark adaptation on a bridge at night, which is a real
 * convention for this audience rather than a styling flourish.
 */

/** Cool-leaning neutrals. Not pure grey — this is an ocean product. */
export const neutral = {
  ink: "#0B1418",
  slate: "#3A4A52",
  mist: "#8FA0A8",
  fog: "#E3E9EB",
  paper: "#F7F9FA",
  white: "#FFFFFF",
} as const;

export interface SemanticColors {
  complete: string;
  incomplete: string;
  error: string;
  queued: string;
}

/**
 * Semantic colours, used for completeness and sync state. These are the
 * vocabulary of the completeness ledger, so they carry meaning and must stay
 * distinguishable from the region accent.
 */
export const semantic: SemanticColors = {
  complete: "#2E7D5B",
  incomplete: "#C77A16",
  error: "#B3362C",
  queued: "#5B6BA8",
};

/**
 * Night-mode semantics collapse to a warm pair. Green and blue are the first
 * things to destroy dark adaptation, so "complete" becomes a dim amber and
 * everything else a red.
 */
export const semanticNight: SemanticColors = {
  complete: "#8A6B2F",
  incomplete: "#B4711A",
  error: "#C2413A",
  queued: "#8A5A3C",
};

export type ThemeName = "light" | "dark" | "night";

export interface ThemeSurfaces {
  /** Page background. */
  surface: string;
  /** Raised surface: cards, sheets, list rows. */
  surfaceRaised: string;
  /** Hairlines and dividers. */
  border: string;
  /** Primary body text. */
  text: string;
  /** Secondary text: captions, metadata, helper copy. */
  textMuted: string;
  /** Text placed on top of a filled accent. */
  onAccent: string;
}

export const surfaces: Record<ThemeName, ThemeSurfaces> = {
  light: {
    surface: neutral.paper,
    surfaceRaised: neutral.white,
    border: neutral.fog,
    text: neutral.ink,
    textMuted: neutral.slate,
    onAccent: neutral.white,
  },
  dark: {
    surface: neutral.ink,
    surfaceRaised: "#141F25",
    border: "#22313A",
    text: "#E8EEF0",
    textMuted: neutral.mist,
    // Filled accents in dark mode are light, so their text is the dark ground.
    onAccent: neutral.ink,
  },
  night: {
    // Near-black with a red cast rather than a blue one.
    surface: "#0A0506",
    surfaceRaised: "#150B0C",
    border: "#2A1618",
    text: "#E8C4BC",
    textMuted: "#9A6E68",
    onAccent: "#0A0506",
  },
};

/** 4pt base. Named rather than numbered so intent survives refactors. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

/**
 * IBM Plex. One family, three roles.
 *
 * The mono role is not decoration: this app is full of values that must align
 * and be compared — latitudes, depths, EPSG codes, DOIs, uuids, timestamps —
 * and Plex Mono has true tabular figures. Plex was drawn for technical
 * contexts and has the Latin-Extended coverage French demands.
 */
export const fontFamily = {
  sans: "IBMPlexSans_400Regular",
  sansMedium: "IBMPlexSans_500Medium",
  sansSemibold: "IBMPlexSans_600SemiBold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
} as const;

export const type = {
  display: { fontFamily: fontFamily.sansSemibold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  title: { fontFamily: fontFamily.sansSemibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  heading: { fontFamily: fontFamily.sansMedium, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.sans, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: fontFamily.sans, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fontFamily.sansMedium, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  caption: { fontFamily: fontFamily.sans, fontSize: 12, lineHeight: 16 },
  /** Coordinates, identifiers, dates — anything that should align in a column. */
  data: { fontFamily: fontFamily.mono, fontSize: 14, lineHeight: 20 },
  dataSmall: { fontFamily: fontFamily.mono, fontSize: 12, lineHeight: 16 },
} as const;

/**
 * Minimum touch target. 44pt is Apple's floor and Android's 48dp is close
 * enough that one number serves both — and the audience is wearing gloves.
 */
export const MIN_TOUCH_TARGET = 44;
