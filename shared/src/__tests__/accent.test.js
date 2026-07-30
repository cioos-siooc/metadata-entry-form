import { describe, expect, test } from "vitest";
import regions from "../regions.js";
import {
  buildAccentRamp,
  pickAccentStep,
  resolveAccent,
  RAMP_STEPS,
} from "../theme/accent.js";
import {
  parseHex,
  toHex,
  rgbToOklch,
  oklchToHex,
  contrastRatio,
  relativeLuminance,
} from "../theme/color.js";

// The surfaces each theme puts an accent on. Kept here rather than imported so
// this test fails loudly if the theme changes its surfaces without re-checking
// contrast.
const THEMES = {
  light: { surface: "#F7F9FA", onAccent: "#FFFFFF" },
  dark: { surface: "#0B1418", onAccent: "#0B1418" },
  night: { surface: "#0A0506", onAccent: "#0A0506" },
};

const BRAND_COLOURS = Object.entries(regions)
  .filter(([, r]) => r.colors?.primary)
  .map(([id, r]) => [id, r.colors.primary]);

describe("colour maths", () => {
  test("hex round-trips", () => {
    for (const hex of ["#52a79b", "#006e90", "#19222b", "#fcba03", "#ffffff", "#000000"]) {
      expect(toHex(parseHex(hex))).toBe(hex.toLowerCase());
    }
  });

  test("shorthand hex and missing # are accepted", () => {
    expect(toHex(parseHex("fff"))).toBe("#ffffff");
    expect(toHex(parseHex("#ABC"))).toBe("#aabbcc");
  });

  test("rejects nonsense rather than silently producing black", () => {
    for (const bad of ["", "#12345", "not-a-colour", "#gggggg"]) {
      expect(() => parseHex(bad)).toThrow();
    }
  });

  test("OKLCH survives a round trip", () => {
    for (const hex of ["#52a79b", "#fcba03", "#19222b", "#385e9d"]) {
      const back = oklchToHex(rgbToOklch(parseHex(hex)));
      // Allow a channel of rounding drift.
      const a = parseHex(hex);
      const b = parseHex(back);
      expect(Math.abs(a.r - b.r)).toBeLessThan(0.01);
      expect(Math.abs(a.g - b.g)).toBeLessThan(0.01);
      expect(Math.abs(a.b - b.b)).toBeLessThan(0.01);
    }
  });

  test("OKLCH lightness is perceptual, unlike HSL", () => {
    // The premise of using OKLab at all: HSL puts both of these at L=50%.
    const yellow = rgbToOklch(parseHex("#fcba03"));
    const navy = rgbToOklch(parseHex("#19222b"));
    expect(yellow.L).toBeGreaterThan(0.7);
    expect(navy.L).toBeLessThan(0.3);
  });

  test("contrast ratio matches known WCAG values", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    // Order must not matter.
    expect(contrastRatio("#52a79b", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#52a79b"),
      10,
    );
  });

  test("out-of-gamut chroma reduces instead of clipping channels", () => {
    // An absurd chroma must still yield a valid hex of roughly the right hue.
    const hex = oklchToHex({ L: 0.6, C: 0.9, h: 145 });
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    const { h } = rgbToOklch(parseHex(hex));
    expect(Math.abs(h - 145)).toBeLessThan(12);
  });
});

describe("buildAccentRamp", () => {
  test("produces all nine steps as valid hex", () => {
    const ramp = buildAccentRamp("#52a79b");
    expect(Object.keys(ramp).map(Number).sort((a, b) => a - b)).toEqual(RAMP_STEPS);
    for (const step of RAMP_STEPS) {
      expect(ramp[step]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  test("ramp is monotonically darkening", () => {
    for (const [, brand] of BRAND_COLOURS) {
      const ramp = buildAccentRamp(brand);
      const luminances = RAMP_STEPS.map((s) => relativeLuminance(ramp[s]));
      for (let i = 1; i < luminances.length; i += 1) {
        expect(luminances[i], `${brand} step ${RAMP_STEPS[i]}`).toBeLessThan(
          luminances[i - 1],
        );
      }
    }
  });

  test("preserves the brand hue", () => {
    for (const [id, brand] of BRAND_COLOURS) {
      const brandHue = rgbToOklch(parseHex(brand)).C < 0.02
        ? null // near-grey: hue is not meaningful, skip
        : rgbToOklch(parseHex(brand)).h;
      if (brandHue === null) continue;

      const midHue = rgbToOklch(parseHex(buildAccentRamp(brand)[500])).h;
      const delta = Math.min(
        Math.abs(midHue - brandHue),
        360 - Math.abs(midHue - brandHue),
      );
      expect(delta, `${id} hue drift`).toBeLessThan(10);
    }
  });

  test("a near-grey brand still yields a coloured ramp", () => {
    // Atlantic is #19222b. Without the chroma floor its ramp would be greys,
    // which reads as a broken theme rather than a dark brand.
    const ramp = buildAccentRamp("#19222b");
    const midChroma = rgbToOklch(parseHex(ramp[500])).C;
    expect(midChroma).toBeGreaterThan(0.04);
  });

  test("a neon brand is calmed down", () => {
    // Test region is #fcba03, whose chroma is far above the usable band.
    const sourceChroma = rgbToOklch(parseHex("#fcba03")).C;
    const rampChroma = rgbToOklch(parseHex(buildAccentRamp("#fcba03")[500])).C;
    expect(rampChroma).toBeLessThan(sourceChroma);
  });
});

describe("contrast floor across every region and theme", () => {
  // The reason this module exists. If any of these fail, some region's users
  // are looking at an accent they cannot read.
  test.each(BRAND_COLOURS)("%s clears AA in all three themes", (id, brand) => {
    for (const [themeName, surfaces] of Object.entries(THEMES)) {
      const accent = resolveAccent(brand, surfaces);

      expect(
        accent.textContrast,
        `${id} / ${themeName}: accent text on surface`,
      ).toBeGreaterThanOrEqual(4.5);

      expect(
        accent.fillContrast,
        `${id} / ${themeName}: onAccent text on accent fill`,
      ).toBeGreaterThanOrEqual(4.5);

      expect(accent.meetsFloor, `${id} / ${themeName}`).toBe(true);
    }
  });

  test("the raw brand colour would have failed, proving this is load-bearing", () => {
    // Atlantic against a dark surface, and Test under white text — the two
    // cases that motivated tone-mapping.
    expect(contrastRatio("#19222b", THEMES.dark.surface)).toBeLessThan(4.5);
    expect(contrastRatio("#fcba03", "#FFFFFF")).toBeLessThan(4.5);
  });

  test("every region resolves to a usable pair, not a fallback", () => {
    for (const [id, brand] of BRAND_COLOURS) {
      const accent = resolveAccent(brand, THEMES.light);
      expect(accent.text, id).toMatch(/^#[0-9a-f]{6}$/);
      expect(accent.fill, id).toMatch(/^#[0-9a-f]{6}$/);
      expect(RAMP_STEPS).toContain(accent.textStep);
    }
  });
});

describe("pickAccentStep", () => {
  test("goes darker on a light surface and lighter on a dark one", () => {
    const ramp = buildAccentRamp("#52a79b");
    const onLight = pickAccentStep(ramp, "#F7F9FA");
    const onDark = pickAccentStep(ramp, "#0B1418");
    expect(onLight.step).toBeGreaterThan(onDark.step);
  });

  test("reports honestly when no step can clear the floor", () => {
    // A mid-grey surface leaves nowhere to go at a 21:1 demand.
    const result = pickAccentStep(buildAccentRamp("#52a79b"), "#808080", 21);
    expect(result.meetsFloor).toBe(false);
    expect(result.hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});
