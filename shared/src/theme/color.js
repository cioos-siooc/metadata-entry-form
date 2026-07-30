// Colour maths for the accent ramp. OKLab rather than HSL, because HSL's
// "lightness" is not perceptual: #fcba03 and #19222b both sit at L=50% in HSL
// despite one being blinding and the other nearly black. Getting a usable ramp
// out of six wildly different regional brand colours needs a perceptual space.
//
// OKLab per Björn Ottosson (https://bottosson.github.io/posts/oklab/).

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** @typedef {{ r: number, g: number, b: number }} Rgb  channels in 0..1 */
/** @typedef {{ L: number, C: number, h: number }} Oklch  L 0..1, h in degrees */

export function parseHex(hex) {
  const raw = String(hex).trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a hex colour: ${hex}`);
  }
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

export function toHex({ r, g, b }) {
  const channel = (c) =>
    Math.round(clamp(c, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toGamma = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

export function rgbToOklch({ r, g, b }) {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.hypot(a, bb);
  // Hue is meaningless at zero chroma; 0 keeps it deterministic.
  const h = C < 1e-6 ? 0 : (Math.atan2(bb, a) * 180) / Math.PI;
  return { L, C, h: (h + 360) % 360 };
}

export function oklchToRgb({ L, C, h }) {
  const rad = (h * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return {
    r: toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

const inGamut = ({ r, g, b }) =>
  r >= -1e-4 && r <= 1.0001 && g >= -1e-4 && g <= 1.0001 && b >= -1e-4 && b <= 1.0001;

/**
 * Convert to sRGB, reducing chroma until the colour actually fits in the gamut.
 * Naively clamping channels shifts hue — a saturated yellow clipped per-channel
 * drifts visibly green — so bisect on chroma instead and keep the hue.
 */
export function oklchToHex({ L, C, h }) {
  const direct = oklchToRgb({ L, C, h });
  if (inGamut(direct)) return toHex(direct);

  let lo = 0;
  let hi = C;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToRgb({ L, C: mid, h }))) lo = mid;
    else hi = mid;
  }
  return toHex(oklchToRgb({ L, C: lo, h }));
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance(hex) {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2.1 contrast ratio, 1..21. Order-independent. */
export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}
