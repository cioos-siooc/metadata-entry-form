// Region accents, tone-mapped.
//
// Every region ships its own brand colour in regions.js, and they are not
// comparable: CIOOS Pacific is #006e90, Atlantic is #19222b (very nearly
// black), Test is #fcba03 (saturated yellow). Used raw as an accent, Atlantic
// disappears against a dark surface and Test is illegible under white text.
//
// So the brand colour is treated as a *hue and character reference*, not as a
// literal value. We take its hue, clamp its chroma into a usable band, and
// generate a ramp at fixed perceptual lightnesses. The theme then picks the
// step that clears a contrast floor against the surface it sits on.

import { rgbToOklch, oklchToHex, parseHex, contrastRatio } from "./color.js";

// Perceptual lightness targets, light to dark. Nine steps mirrors the usual
// 50..900 convention and gives enough room to satisfy a contrast floor on both
// a near-white and a near-black surface.
const RAMP_LIGHTNESS = [0.97, 0.93, 0.86, 0.77, 0.68, 0.58, 0.48, 0.38, 0.28];
export const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800];

// Chroma band. The floor stops a near-grey brand colour (Atlantic) producing a
// ramp of greys that reads as "the theme failed to load". The ceiling stops a
// neon one (Test) producing steps that vibrate against text. Both are
// deliberate departures from the source colour.
const MIN_CHROMA = 0.055;
const MAX_CHROMA = 0.155;

// Chroma has to fall away at the extremes or the light steps look chalky and
// the dark steps muddy — real ramps are not constant-chroma.
const chromaFalloff = (lightness) => {
  const distanceFromMid = Math.abs(lightness - 0.62) / 0.38;
  return 1 - 0.55 * Math.min(1, distanceFromMid) ** 2;
};

/**
 * Build a nine-step accent ramp from a brand colour.
 *
 * @param {string} brandHex e.g. "#52a79b"
 * @returns {Record<number, string>} keyed by RAMP_STEPS
 */
export function buildAccentRamp(brandHex) {
  const { C, h } = rgbToOklch(parseHex(brandHex));
  const baseChroma = Math.min(MAX_CHROMA, Math.max(MIN_CHROMA, C));

  const ramp = {};
  RAMP_LIGHTNESS.forEach((L, i) => {
    ramp[RAMP_STEPS[i]] = oklchToHex({
      L,
      C: baseChroma * chromaFalloff(L),
      h,
    });
  });
  return ramp;
}

/**
 * Pick the ramp step that best clears a contrast floor against `surface`.
 *
 * Searches from the mid-tones outward in the direction that gains contrast —
 * darker on a light surface, lighter on a dark one — so the accent stays as
 * close to the brand's character as the floor allows. Falls back to the
 * highest-contrast step available rather than returning something unreadable.
 *
 * @param {Record<number, string>} ramp
 * @param {string} surfaceHex
 * @param {number} [minContrast=4.5] WCAG AA for normal text.
 * @returns {{ step: number, hex: string, contrast: number, meetsFloor: boolean }}
 */
export function pickAccentStep(ramp, surfaceHex, minContrast = 4.5) {
  const surfaceIsLight = contrastRatio(surfaceHex, "#000000") >
    contrastRatio(surfaceHex, "#ffffff");

  // Walk from the middle of the ramp toward whichever end adds contrast.
  const ordered = surfaceIsLight
    ? [...RAMP_STEPS].filter((s) => s >= 400)
    : [...RAMP_STEPS].filter((s) => s <= 500).reverse();

  let best = null;
  for (const step of ordered) {
    const hex = ramp[step];
    const contrast = contrastRatio(hex, surfaceHex);
    if (!best || contrast > best.contrast) best = { step, hex, contrast };
    if (contrast >= minContrast) {
      return { step, hex, contrast, meetsFloor: true };
    }
  }

  // Nothing in the preferred direction cleared the floor — take the best of
  // the whole ramp so the UI degrades to "low contrast" rather than "invisible".
  for (const step of RAMP_STEPS) {
    const hex = ramp[step];
    const contrast = contrastRatio(hex, surfaceHex);
    if (contrast > best.contrast) best = { step, hex, contrast };
  }
  return { ...best, meetsFloor: best.contrast >= minContrast };
}

/**
 * Resolve a region's brand colour into the accent values a theme needs.
 *
 * @param {string} brandHex
 * @param {object} surfaces
 * @param {string} surfaces.surface   Page background the accent sits on.
 * @param {string} surfaces.onAccent  Text colour placed *on* the accent fill.
 * @param {number} [minContrast=4.5]
 */
export function resolveAccent(brandHex, { surface, onAccent }, minContrast = 4.5) {
  const ramp = buildAccentRamp(brandHex);
  const text = pickAccentStep(ramp, surface, minContrast);

  // The fill is a separate problem: it must carry `onAccent` text, which is a
  // contrast question against a different pair of colours.
  const fill = pickAccentStep(ramp, onAccent, minContrast);

  return {
    ramp,
    /** Accent used for text, icons and borders against `surface`. */
    text: text.hex,
    textStep: text.step,
    textContrast: text.contrast,
    /** Accent used as a filled background carrying `onAccent` text. */
    fill: fill.hex,
    fillStep: fill.step,
    fillContrast: fill.contrast,
    meetsFloor: text.meetsFloor && fill.meetsFloor,
  };
}
