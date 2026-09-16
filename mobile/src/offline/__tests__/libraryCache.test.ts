import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cacheLibrary, readCachedLibrary } from "../libraryCache";
import { freshDb } from "./testDb";

describe("library cache", () => {
  let db: Awaited<ReturnType<typeof freshDb>>;

  beforeEach(async () => {
    db = await freshDb();
  });
  afterEach(() => db.close());

  it("returns null before anything is cached", async () => {
    expect(await readCachedLibrary(db, "pacific", "contacts")).toBeNull();
  });

  it("round-trips a list", async () => {
    const entries = [{ id: "a", data: { orgName: "DFO" } }];
    await cacheLibrary(db, "pacific", "contacts", entries);
    expect(await readCachedLibrary(db, "pacific", "contacts")).toEqual(entries);
  });

  it("keeps regions and kinds apart", async () => {
    await cacheLibrary(db, "pacific", "contacts", [{ id: "a", data: {} }]);
    expect(await readCachedLibrary(db, "atlantic", "contacts")).toBeNull();
    expect(await readCachedLibrary(db, "pacific", "platforms")).toBeNull();
  });

  it("replaces wholesale rather than merging", async () => {
    await cacheLibrary(db, "pacific", "platforms", [
      { id: "a", data: {} },
      { id: "b", data: {} },
    ]);
    await cacheLibrary(db, "pacific", "platforms", [{ id: "c", data: {} }]);
    expect(await readCachedLibrary(db, "pacific", "platforms")).toEqual([{ id: "c", data: {} }]);
  });

  it("treats a corrupt cache as a missing one", async () => {
    await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", [
      "library:pacific:instruments",
      "{not json",
    ]);
    expect(await readCachedLibrary(db, "pacific", "instruments")).toBeNull();
  });

  it("rejects a cached value that is not a list", async () => {
    await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", [
      "library:pacific:instruments",
      '{"id":"a"}',
    ]);
    expect(await readCachedLibrary(db, "pacific", "instruments")).toBeNull();
  });
});
