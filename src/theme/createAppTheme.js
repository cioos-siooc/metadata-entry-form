import {
  createTheme,
  alpha,
  lighten,
  darken,
  getLuminance,
  getContrastRatio,
} from "@mui/material/styles";
import regions from "../regions";
import {
  radii,
  shadows,
  neutrals,
  motion,
  semantic,
  FALLBACK_PRIMARY,
  FALLBACK_SECONDARY,
} from "./tokens";
import typography from "./typography";
import buildComponents from "./components";

export function pickContrastText(hex) {
  try {
    return getContrastRatio(hex, "#ffffff") >= 4.0 ? "#ffffff" : neutrals[900];
  } catch {
    return "#ffffff";
  }
}

// Region brand colours are chosen for white backgrounds and run the whole
// range -- one region is near-black (#19222b), another a saturated yellow
// (#fcba03). On a dark page the first disappears and the second glares as a
// full-width app bar, so nudge both into a mid-luminance band. Steps are small
// and hue-preserving, so the result still reads as the region's colour.
const DARK_MIN_LUMINANCE = 0.18;
const DARK_MAX_LUMINANCE = 0.45;

function forDarkSurface(hex) {
  try {
    let out = hex;
    for (let i = 0; i < 12 && getLuminance(out) < DARK_MIN_LUMINANCE; i += 1) {
      out = lighten(out, 0.08);
    }
    for (let i = 0; i < 12 && getLuminance(out) > DARK_MAX_LUMINANCE; i += 1) {
      out = darken(out, 0.08);
    }
    return out;
  } catch {
    return hex;
  }
}

function resolveRegionColors(regionKey) {
  const region = regionKey && regions[regionKey];
  if (region && region.colors) {
    return {
      primary: region.colors.primary || FALLBACK_PRIMARY,
      secondary: region.colors.secondary || FALLBACK_SECONDARY,
    };
  }
  return { primary: FALLBACK_PRIMARY, secondary: FALLBACK_SECONDARY };
}

// One palette shape, two sets of values. Brand hues carry across both schemes;
// only the neutrals (surfaces, text, dividers) invert.
function buildPalette(mode, primaryHex, secondaryHex) {
  const dark = mode === "dark";
  const defaultBg = dark ? neutrals[950] : neutrals[50];
  const paperBg = dark ? neutrals[900] : "#ffffff";

  const primary = dark ? forDarkSurface(primaryHex) : primaryHex;
  const secondary = dark ? forDarkSurface(secondaryHex) : secondaryHex;

  return {
    mode,
    primary: { main: primary, contrastText: pickContrastText(primary) },
    secondary: { main: secondary, contrastText: pickContrastText(secondary) },
    success: semantic.success,
    warning: semantic.warning,
    error: semantic.error,
    info: semantic.info,
    grey: neutrals,
    divider: dark ? neutrals[800] : neutrals[200],
    background: {
      default: defaultBg,
      paper: paperBg,
      subtle: dark ? neutrals[800] : neutrals[100],
      brandSubtle: alpha(primary, dark ? 0.12 : 0.06),
      // Dropdowns and menus. A step LIGHTER than `subtle`, so a floating panel
      // reads as above the card it overlaps — `paper` is darker than `subtle`
      // on dark, which made popovers look punched into the surface. The shadow
      // ramp is dark ink, so on dark this lift is what does the separating.
      floating: dark ? neutrals[700] : paperBg,
    },
    text: {
      primary: dark ? neutrals[50] : neutrals[900],
      secondary: dark ? neutrals[400] : neutrals[600],
      disabled: dark ? neutrals[600] : neutrals[400],
    },
    action: {
      // Overlays need more opacity on dark to read at all.
      hover: alpha(primary, dark ? 0.12 : 0.06),
      selected: alpha(primary, dark ? 0.2 : 0.1),
      focus: alpha(primary, dark ? 0.24 : 0.12),
      disabled: dark ? neutrals[700] : neutrals[300],
      disabledBackground: dark ? neutrals[800] : neutrals[100],
    },
    // Brand surface & border tokens used by FormSection / chips / rails.
    primarySurface: alpha(primary, dark ? 0.16 : 0.08),
    primarySurfaceHover: alpha(primary, dark ? 0.24 : 0.14),
    primaryBorder: alpha(primary, dark ? 0.4 : 0.28),
  };
}

const themeCache = new Map();

export function createAppTheme({ regionKey } = {}) {
  const { primary: primaryHex, secondary: secondaryHex } =
    resolveRegionColors(regionKey);

  const shared = {
    shape: { borderRadius: radii.md },
    shadows,
    typography,
    transitions: {
      duration: {
        shortest: motion.duration.fast,
        shorter: motion.duration.fast,
        short: motion.duration.base,
        standard: motion.duration.base,
        complex: motion.duration.slow,
        enteringScreen: motion.duration.base,
        leavingScreen: motion.duration.fast,
      },
      easing: {
        easeInOut: motion.easing.standard,
        easeOut: motion.easing.decelerate,
        easeIn: motion.easing.accelerate,
        sharp: motion.easing.emphasized,
      },
    },
  };

  // Step 1: both schemes, as CSS variables so a scheme switch is a class swap
  // rather than a re-render of every styled component.
  const base = createTheme({
    cssVariables: { colorSchemeSelector: "class" },
    colorSchemes: {
      light: { palette: buildPalette("light", primaryHex, secondaryHex) },
      dark: { palette: buildPalette("dark", primaryHex, secondaryHex) },
    },
    ...shared,
  });

  // Step 2: re-create with component overrides that reference theme.vars, so
  // they follow whichever scheme is active.
  return createTheme(base, { components: buildComponents(base) });
}

export function getAppTheme(regionKey) {
  const key = regionKey || "__default__";
  if (!themeCache.has(key)) {
    themeCache.set(key, createAppTheme({ regionKey }));
  }
  return themeCache.get(key);
}

export default getAppTheme;
