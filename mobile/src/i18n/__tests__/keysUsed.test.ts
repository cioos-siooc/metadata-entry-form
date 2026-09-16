import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import en from "../locales/en.json";
import fr from "../locales/fr.json";

/**
 * Every key the code asks for must exist.
 *
 * i18next renders a missing key as the key itself, so the failure mode is a
 * screen heading that reads "library.title" — visible to a user, invisible to a
 * type-checker, and shipped without a test like this one. Plural suffixes are
 * counted as present when their base has _one/_other, which is how i18next
 * resolves `t("sync.pending", { count })`.
 *
 * Dynamic keys — t(`sections.${id}`) — are outside what a regex can verify, so
 * their enumerations are asserted explicitly at the bottom.
 */

type Catalogue = Record<string, unknown>;

const SOURCE_ROOT = join(__dirname, "..", "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return entry === "__tests__" ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

function has(catalogue: Catalogue, key: string): boolean {
  const read = (k: string) =>
    k.split(".").reduce<unknown>((acc, part) => (acc as Catalogue)?.[part], catalogue);
  const value = read(key);
  if (typeof value === "string") return true;
  // Pluralised keys live as `${key}_one` / `${key}_other`.
  return typeof read(`${key}_other`) === "string";
}

/**
 * Keys passed as plain strings to `t`.
 *
 * Anchored on `t(` preceded by a non-identifier character so `post("…")` and
 * `getItem("…")` do not masquerade as translation calls.
 */
function usedKeys(): { key: string; file: string }[] {
  const pattern = /(?<![A-Za-z0-9_$])t\(\s*"([^"]+)"/g;
  return sourceFiles(SOURCE_ROOT).flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return [...source.matchAll(pattern)].map((match) => ({
      key: match[1],
      file: file.slice(SOURCE_ROOT.length + 1),
    }));
  });
}

describe("translation keys the app actually asks for", () => {
  const used = usedKeys();

  test("the scan finds a realistic number of keys", () => {
    // Guards the regex itself: a broken pattern would make every other
    // assertion here vacuously pass.
    expect(used.length).toBeGreaterThan(100);
  });

  test("every literal key exists in English", () => {
    const missing = used.filter(({ key }) => !has(en, key));
    expect(missing.map((m) => `${m.key} (${m.file})`)).toEqual([]);
  });

  test("every literal key exists in French", () => {
    const missing = used.filter(({ key }) => !has(fr, key));
    expect(missing.map((m) => `${m.key} (${m.file})`)).toEqual([]);
  });
});

describe("keys built from a template", () => {
  const enumerations: Record<string, string[]> = {
    "sections.": [
      "identification",
      "about",
      "when",
      "where",
      "who",
      "platform",
      "species",
      "resources",
    ],
    "ledger.state.": ["empty", "attention", "complete", "filled"],
    "records.status.": ["draft", "submitted", "published"],
    "records.": ["mine", "shared", "published"],
    "reviewQueue.": ["submitted", "published", "drafts", "all"],
    "appearance.": ["light", "dark", "night"],
    "library.": ["contacts", "platforms", "instruments"],
    "library.addFrom.": ["contacts", "platforms", "instruments"],
    "library.addOne.": ["contacts", "platforms", "instruments"],
    "verify.": ["working", "done", "invalid"],
    "github.step.": ["config", "converting", "publishing"],
    "export.format.": [
      "iso19115-3_xml",
      "erddap",
      "yaml",
      "json",
      "datacite_json",
      "datacite_xml",
    ],
  };

  for (const [prefix, values] of Object.entries(enumerations)) {
    test(`${prefix}* is complete in both catalogues`, () => {
      for (const value of values) {
        expect(has(en, `${prefix}${value}`), `en:${prefix}${value}`).toBe(true);
        expect(has(fr, `${prefix}${value}`), `fr:${prefix}${value}`).toBe(true);
      }
    });
  }

  test("the review pseudo-section has its own title, not sections.review", () => {
    // The editor screen special-cases it; if that ever changes, the heading
    // would render as the raw key.
    expect(has(en, "review.title")).toBe(true);
    expect(has(en, "sections.review")).toBe(false);
  });
});
