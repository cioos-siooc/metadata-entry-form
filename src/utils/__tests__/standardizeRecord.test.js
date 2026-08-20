import { describe, expect, it } from "vitest";

import { standardizeRecord } from "../firebaseRecordFunctions";
import { metadataScopeCodes } from "../../isoCodeLists";

/**
 * These three normalizations used to live in `useEffect`s inside StartTab and
 * PlatformTab, so they only ran if you happened to open that tab. Doing them on
 * load means the form engine — and everything else reading a record — sees one
 * consistent shape.
 */
describe("standardizeRecord", () => {
  it("coerces the legacy string booleans RTDB hands back", () => {
    const record = standardizeRecord({
      noPlatform: "false",
      noTaxa: "false",
      noVerticalExtent: "true",
    });

    // Boolean("false") === true, which is the whole point of this test.
    expect(record.noPlatform).toBe(false);
    expect(record.noTaxa).toBe(false);
    expect(record.noVerticalExtent).toBe(true);
  });

  it("leaves real booleans alone", () => {
    const record = standardizeRecord({ noPlatform: true, noTaxa: false });
    expect(record.noPlatform).toBe(true);
    expect(record.noTaxa).toBe(false);
  });

  it("folds a legacy single platform into platforms[]", () => {
    const record = standardizeRecord({
      platformID: "abc",
      platform: "ship",
      platformDescription: "a boat",
      platforms: [{ id: "existing" }],
    });

    expect(record.platforms).toEqual([
      { id: "abc", description: "a boat", type: "ship" },
      { id: "existing" },
    ]);
    expect(record.platformID).toBeNull();
    expect(record.platform).toBeNull();
    expect(record.platformDescription).toBeNull();
  });

  it("folds a legacy platform when platforms is missing entirely", () => {
    const record = standardizeRecord({ platformID: "abc" });
    expect(record.platforms).toHaveLength(1);
    expect(record.platforms[0].id).toBe("abc");
  });

  it("does not invent a platform when there is no legacy one", () => {
    expect(standardizeRecord({}).platforms).toEqual([]);
  });

  it("defaults metadataScope and derives metadataScopeIso", () => {
    const record = standardizeRecord({});
    expect(record.metadataScope).toBe("Dataset");
    expect(record.metadataScopeIso).toBe(metadataScopeCodes.Dataset.isoValue);
  });

  it("backfills metadataScopeIso for a record that predates it", () => {
    const record = standardizeRecord({ metadataScope: "Book" });
    expect(record.metadataScope).toBe("Book");
    expect(record.metadataScopeIso).toBe(metadataScopeCodes.Book.isoValue);
  });

  it("does not overwrite an existing metadataScopeIso", () => {
    const record = standardizeRecord({
      metadataScope: "Dataset",
      metadataScopeIso: "somethingElse",
    });
    expect(record.metadataScopeIso).toBe("somethingElse");
  });

  it("defaults language from the UI language, and only when empty", () => {
    expect(standardizeRecord({}, null, null, null, "fr").language).toBe("fr");
    expect(
      standardizeRecord({ language: "en" }, null, null, null, "fr").language
    ).toBe("en");
    // No UI language available: leave it blank rather than guessing English.
    expect(standardizeRecord({}).language).toBe("");
  });
});
