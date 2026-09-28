// Design tokens — region-independent values that feed the MUI theme factory.
// Pure JS, no MUI imports, so these can be referenced from anywhere.

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
};

export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};

// Dual-layer soft shadows — ambient + key light. 6 curated steps; MUI needs
// an array of 25 so we interpolate the tail with the max shadow.
const shadowRamp = [
  "none",
  "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
  "0 1px 3px rgba(16,24,40,0.08), 0 2px 6px rgba(16,24,40,0.08)",
  "0 4px 8px -2px rgba(16,24,40,0.08), 0 2px 4px -2px rgba(16,24,40,0.06)",
  "0 8px 16px -4px rgba(16,24,40,0.10), 0 4px 8px -4px rgba(16,24,40,0.06)",
  "0 12px 24px -6px rgba(16,24,40,0.12), 0 6px 12px -6px rgba(16,24,40,0.08)",
  "0 20px 32px -8px rgba(16,24,40,0.14), 0 8px 16px -8px rgba(16,24,40,0.10)",
];

export const shadows = [
  ...shadowRamp,
  ...Array(25 - shadowRamp.length).fill(shadowRamp[shadowRamp.length - 1]),
];

// Neutral gray scale — brand independent, drives text/dividers/surfaces.
export const neutrals = {
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
  950: "#020617",
};

// Semantic colors are fixed across regions — errors are always clearly red,
// regardless of whatever unusual hue a region picked as its brand primary.
export const semantic = {
  success: {
    main: "#16a34a",
    light: "#22c55e",
    dark: "#15803d",
    contrastText: "#ffffff",
    surface: "#f0fdf4",
    border: "#bbf7d0",
  },
  warning: {
    main: "#d97706",
    light: "#f59e0b",
    dark: "#b45309",
    contrastText: "#ffffff",
    surface: "#fffbeb",
    border: "#fde68a",
  },
  error: {
    main: "#dc2626",
    light: "#ef4444",
    dark: "#b91c1c",
    contrastText: "#ffffff",
    surface: "#fef2f2",
    border: "#fecaca",
  },
  info: {
    main: "#2563eb",
    light: "#3b82f6",
    dark: "#1d4ed8",
    contrastText: "#ffffff",
    surface: "#eff6ff",
    border: "#bfdbfe",
  },
};

export const motion = {
  duration: {
    fast: 120,
    base: 200,
    slow: 320,
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.3, 0, 0, 1)",
    decelerate: "cubic-bezier(0, 0, 0, 1)",
    accelerate: "cubic-bezier(0.3, 0, 1, 1)",
  },
};

export const typographyTokens = {
  fontFamily: [
    '"Inter"',
    '"Inter Variable"',
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
  ].join(", "),
  monoFontFamily: [
    '"JetBrains Mono"',
    '"SF Mono"',
    "Menlo",
    "Monaco",
    "Consolas",
    "monospace",
  ].join(", "),
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  size: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },
};

// Used when a region defines no primary colour of its own.
export const FALLBACK_PRIMARY = "#52a79b"; // CIOOS national teal
export const FALLBACK_SECONDARY = "#1976d2";
