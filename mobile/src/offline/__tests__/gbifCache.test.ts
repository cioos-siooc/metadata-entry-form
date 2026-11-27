import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cacheSuggestions, searchCachedSuggestions } from "../gbifCache";
import { freshDb } from "./testDb";

const calanus = { key: 1, scientificName: "Calanus finmarchicus", canonicalName: "Calanus finmarchicus" };
const gadus = { key: 2, scientificName: "Gadus morhua", canonicalName: "Gadus morhua" };

describe("gbif cache", () => {
  let db: Awaited<ReturnType<typeof freshDb>>;

  beforeEach(async () => {
    db = await freshDb();
  });
  afterEach(() => db.close());

  it("finds nothing before anything is cached", async () => {
    expect(await searchCachedSuggestions(db, "calanus")).toEqual([]);
  });

  it("matches a suggestion cached under a shorter query", async () => {
    // Typing continues after the request that populated the cache, so the
    // fallback has to match on the taxon name, not on the query it arrived under.
    await cacheSuggestions(db, "calan", [calanus]);
    expect(await searchCachedSuggestions(db, "calanus fin")).toEqual([calanus]);
    expect(await searchCachedSuggestions(db, "gadus")).toEqual([]);
  });

  it("deduplicates the same taxon seen under several queries", async () => {
    await cacheSuggestions(db, "cal", [calanus]);
    await cacheSuggestions(db, "calanus", [calanus, gadus]);
    const hits = await searchCachedSuggestions(db, "calanus");
    expect(hits).toEqual([calanus]);
  });

  it("ignores an empty query rather than returning everything", async () => {
    await cacheSuggestions(db, "gadus", [gadus]);
    expect(await searchCachedSuggestions(db, "   ")).toEqual([]);
  });

  it("evicts the least recently used query past the cap", async () => {
    for (let i = 0; i < 65; i += 1) {
      await cacheSuggestions(db, `query${i}`, [{ key: i, scientificName: `Species ${i}` }]);
    }
    // The first few are gone; the most recent survive.
    expect(await searchCachedSuggestions(db, "Species 0")).toEqual([]);
    expect(await searchCachedSuggestions(db, "Species 64")).toHaveLength(1);
  });

  it("re-caching a query keeps it alive", async () => {
    await cacheSuggestions(db, "keep", [calanus]);
    for (let i = 0; i < 59; i += 1) {
      await cacheSuggestions(db, `filler${i}`, []);
    }
    await cacheSuggestions(db, "keep", [calanus]);
    for (let i = 0; i < 5; i += 1) {
      await cacheSuggestions(db, `more${i}`, []);
    }
    expect(await searchCachedSuggestions(db, "calanus")).toEqual([calanus]);
  });

  it("survives a corrupt cache", async () => {
    await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", [
      "gbif:recent",
      "[]not json",
    ]);
    expect(await searchCachedSuggestions(db, "calanus")).toEqual([]);
    await cacheSuggestions(db, "calanus", [calanus]);
    expect(await searchCachedSuggestions(db, "calanus")).toEqual([calanus]);
  });
});
