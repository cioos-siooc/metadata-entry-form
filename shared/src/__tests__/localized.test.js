import { describe, expect, test } from "vitest";
import { localized, hasLanguage } from "../localized.js";
import { eovs, eovCategories } from "../eovs.js";
import platforms from "../platforms.json";
import { roleCodes, progressCodes } from "../isoCodeLists.js";
import licenses from "../licenses.js";
import tabs from "../tabs.js";

describe("localized()", () => {
  describe("reads all three real-world shapes", () => {
    test("nested { en, fr } pair", () => {
      expect(localized({ en: "Oxygen", fr: "Oxygène" }, "fr")).toBe("Oxygène");
      expect(localized(eovCategories.Biogeochemical, "fr")).toBe("Biogéochimie");
    });

    test("snake suffix — platforms.json", () => {
      const iceIsland = platforms.find((p) => p.label_en === "ice island");
      expect(localized(iceIsland, "fr", "label")).toBe("île de glace");
      expect(localized(iceIsland, "en", "label")).toBe("ice island");
      expect(localized(iceIsland, "fr", "definition")).toMatch(/glace/);
    });

    test("spaced caps suffix — data/eovs.json", () => {
      const oxygen = eovs.find((e) => e.value === "oxygen");
      expect(localized(oxygen, "fr", "label")).toBe("Oxygène");
      expect(localized(oxygen, "en", "label")).toBe("Oxygen");
      expect(localized(oxygen, "fr", "definition")).toMatch(/oxygène dissous/);
    });

    test("field holding a nested pair — isoCodeLists", () => {
      expect(localized(roleCodes.author, "fr", "title")).toBeTruthy();
      expect(localized(progressCodes.onGoing, "en", "title")).toBeTruthy();
    });
  });

  describe("fallback", () => {
    test("falls back to the other language by default", () => {
      expect(localized({ en: "Only English" }, "fr")).toBe("Only English");
      expect(localized({ en: "Only English", fr: "" }, "fr")).toBe("Only English");
      expect(localized({ label_en: "Only English" }, "fr", "label")).toBe("Only English");
    });

    test("real case: most licenses have no French title", () => {
      // 3 of 15 carry `fr`; the SPA compensates with `title[lang] || title.en`.
      const entries = Object.entries(licenses);
      expect(entries.length).toBeGreaterThan(0);

      for (const [code, license] of entries) {
        expect(localized(license.title, "fr"), code).toBeTruthy();
      }

      // Prove the fallback is load-bearing here, not incidental.
      const withoutFrench = entries.filter(
        ([, l]) => !hasLanguage(l.title, "fr"),
      );
      expect(withoutFrench.length).toBeGreaterThan(0);
    });

    test("fallback can be turned off for user-authored content", () => {
      const recordTitle = { en: "Hakai nearshore CTD", fr: "" };
      expect(localized(recordTitle, "fr", undefined, { fallback: false })).toBe("");
      expect(localized(recordTitle, "fr")).toBe("Hakai nearshore CTD");
    });

    test("returns undefined when neither language is present", () => {
      expect(localized({}, "fr")).toBeUndefined();
      expect(localized({ other: 1 }, "en", "label")).toBeUndefined();
    });
  });

  describe("hostile input", () => {
    test.each([null, undefined, "a string", 42])("tolerates %p", (input) => {
      expect(localized(input, "en")).toBeUndefined();
    });
  });

  test("every tab label resolves in both languages", () => {
    for (const [key, pair] of Object.entries(tabs)) {
      expect(localized(pair, "en"), `${key}.en`).toBeTruthy();
      expect(localized(pair, "fr"), `${key}.fr`).toBeTruthy();
    }
  });
});

describe("hasLanguage()", () => {
  test("reports presence without falling back", () => {
    expect(hasLanguage({ en: "x" }, "en")).toBe(true);
    expect(hasLanguage({ en: "x" }, "fr")).toBe(false);
    expect(hasLanguage({ en: "x", fr: "" }, "fr")).toBe(false);
    expect(hasLanguage({ label_en: "x" }, "en", "label")).toBe(true);
    expect(hasLanguage({ "label EN": "x" }, "en", "label")).toBe(true);
    expect(hasLanguage({ "label EN": "x" }, "fr", "label")).toBe(false);
  });
});
