import { describe, expect, test } from "vitest";

import en from "../locales/en.json";
import fr from "../locales/fr.json";

// Bilingual en/fr is non-negotiable for this audience, so a key that exists in
// one catalogue and not the other is a bug, not a TODO. i18next would silently
// fall back to English and a francophone user would see a mixed interface.

type Catalogue = Record<string, unknown>;

function flatten(obj: Catalogue, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object"
      ? flatten(value as Catalogue, path)
      : [path];
  });
}

const enKeys = flatten(en).sort();
const frKeys = flatten(fr).sort();

describe("translation catalogues", () => {
  test("every English key has a French counterpart", () => {
    expect(enKeys.filter((k) => !frKeys.includes(k))).toEqual([]);
  });

  test("no orphaned French keys", () => {
    expect(frKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
  });

  test("no empty strings — an empty value renders as a blank label", () => {
    for (const [lang, cat] of [
      ["en", en],
      ["fr", fr],
    ] as const) {
      for (const key of flatten(cat)) {
        const value = key
          .split(".")
          .reduce<unknown>((acc, k) => (acc as Catalogue)?.[k], cat);
        expect(String(value).trim(), `${lang}:${key}`).not.toBe("");
      }
    }
  });

  test("interpolation placeholders match across languages", () => {
    const placeholders = (s: string) =>
      (s.match(/\{\{(\w+)\}\}/g) ?? []).sort();

    for (const key of enKeys) {
      const read = (cat: Catalogue) =>
        key.split(".").reduce<unknown>((acc, k) => (acc as Catalogue)?.[k], cat);
      const enValue = String(read(en));
      const frValue = String(read(fr));
      expect(placeholders(frValue), key).toEqual(placeholders(enValue));
    }
  });

  test("plural forms are complete on both sides", () => {
    // i18next needs _one and _other for every pluralised key.
    const pluralBases = new Set(
      enKeys
        .filter((k) => k.endsWith("_one") || k.endsWith("_other"))
        .map((k) => k.replace(/_(one|other)$/, "")),
    );
    expect(pluralBases.size).toBeGreaterThan(0);

    for (const base of pluralBases) {
      for (const keys of [enKeys, frKeys]) {
        expect(keys, `${base}_one`).toContain(`${base}_one`);
        expect(keys, `${base}_other`).toContain(`${base}_other`);
      }
    }
  });
});
