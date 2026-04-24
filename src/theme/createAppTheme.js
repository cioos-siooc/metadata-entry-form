import { createTheme, alpha, getContrastRatio } from "@mui/material/styles";
import regions from "../regions";
import {
  radii,
  shadows,
  neutrals,
  motion,
  semantic,
} from "./tokens";
import typography from "./typography";
import buildComponents from "./components";

const FALLBACK_PRIMARY = "#52a79b"; // CIOOS national teal
const FALLBACK_SECONDARY = "#1976d2";

function pickContrastText(hex) {
  try {
    return getContrastRatio(hex, "#ffffff") >= 4.0 ? "#ffffff" : neutrals[900];
  } catch {
    return "#ffffff";
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

const themeCache = new Map();

export function createAppTheme({ regionKey } = {}) {
  const { primary: primaryHex, secondary: secondaryHex } =
    resolveRegionColors(regionKey);

  // Step 1: base theme with palette only so we can call augmentColor.
  const base = createTheme({
    palette: {
      mode: "light",
      primary: { main: primaryHex, contrastText: pickContrastText(primaryHex) },
      secondary: {
        main: secondaryHex,
        contrastText: pickContrastText(secondaryHex),
      },
      success: semantic.success,
      warning: semantic.warning,
      error: semantic.error,
      info: semantic.info,
      grey: neutrals,
      divider: neutrals[200],
      background: {
        default: neutrals[50],
        paper: "#ffffff",
        subtle: neutrals[100],
        brandSubtle: alpha(primaryHex, 0.06),
      },
      text: {
        primary: neutrals[900],
        secondary: neutrals[600],
        disabled: neutrals[400],
      },
      action: {
        hover: alpha(primaryHex, 0.06),
        selected: alpha(primaryHex, 0.1),
        focus: alpha(primaryHex, 0.12),
        disabled: neutrals[300],
        disabledBackground: neutrals[100],
      },
      // Brand surface & border tokens used by FormSection / chips / rails.
      primarySurface: alpha(primaryHex, 0.08),
      primarySurfaceHover: alpha(primaryHex, 0.14),
      primaryBorder: alpha(primaryHex, 0.28),
    },
    shape: {
      borderRadius: radii.md,
    },
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
  });

  // Step 2: re-create with component overrides that reference base palette.
  const finalTheme = createTheme(base, {
    components: buildComponents(base),
  });

  return finalTheme;
}

export function getAppTheme(regionKey) {
  const key = regionKey || "__default__";
  if (!themeCache.has(key)) {
    themeCache.set(key, createAppTheme({ regionKey }));
  }
  return themeCache.get(key);
}

export default getAppTheme;
