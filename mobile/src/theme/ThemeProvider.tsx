import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { resolveAccent } from "@cioos/shared/theme/accent.js";

import {
  neutral,
  radius,
  semantic,
  semanticNight,
  space,
  surfaces,
  type,
  type SemanticColors,
  type ThemeName,
  type ThemeSurfaces,
} from "./tokens";

interface ResolvedAccent {
  ramp: Record<number, string>;
  text: string;
  textStep: number;
  textContrast: number;
  fill: string;
  fillStep: number;
  fillContrast: number;
  meetsFloor: boolean;
}

export interface Theme {
  name: ThemeName;
  colors: ThemeSurfaces & {
    accent: string;
    accentFill: string;
    accentRamp: Record<number, string>;
  };
  semantic: SemanticColors;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
}

/** CIOOS national teal — used until a region is chosen. */
const DEFAULT_BRAND = "#52a79b";

const ThemeContext = createContext<Theme | null>(null);

export function buildTheme(name: ThemeName, brandHex: string): Theme {
  const surface = surfaces[name];
  const accent = resolveAccent(brandHex, {
    surface: surface.surface,
    onAccent: surface.onAccent,
  }) as ResolvedAccent;

  if (__DEV__ && !accent.meetsFloor) {
    // Shouldn't happen for any shipped region — shared/ has a test asserting
    // the floor holds for all six across all three themes — but a region can
    // be created at runtime with an arbitrary colour.
    console.warn(
      `[theme] accent for ${brandHex} falls below WCAG AA on the ${name} ` +
        `surface (text ${accent.textContrast.toFixed(2)}:1, ` +
        `fill ${accent.fillContrast.toFixed(2)}:1)`,
    );
  }

  return {
    name,
    colors: {
      ...surface,
      accent: accent.text,
      accentFill: accent.fill,
      accentRamp: accent.ramp,
    },
    semantic: name === "night" ? semanticNight : semantic,
    space,
    radius,
    type,
  };
}

export function ThemeProvider({
  children,
  brandHex = DEFAULT_BRAND,
  /** Overrides the OS setting. Night mode is always an explicit choice. */
  override,
}: {
  children: React.ReactNode;
  brandHex?: string;
  override?: ThemeName;
}) {
  const scheme = useColorScheme();
  const name: ThemeName = override ?? (scheme === "dark" ? "dark" : "light");

  const theme = useMemo(() => buildTheme(name, brandHex), [name, brandHex]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used inside a ThemeProvider");
  return theme;
}

export { neutral };
