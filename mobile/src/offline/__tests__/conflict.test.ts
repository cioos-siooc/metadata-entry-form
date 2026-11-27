import { describe, expect, test } from "vitest";

import type { MetadataRecord } from "@/api/records";

import { analyseConflict, autoMerge, contestedByTab } from "../conflict";

const doc = (fields: Record<string, unknown>): MetadataRecord =>
  ({
    recordID: "r-1",
    status: "",
    title: { en: "Base title", fr: "" },
    ...fields,
  }) as MetadataRecord;

describe("analyseConflict", () => {
  test("attributes each change to the side that made it", () => {
    const base = doc({ progress: "onGoing", license: "" });
    const mine = doc({ progress: "onGoing", license: "CC-BY-4.0" });
    const theirs = doc({ progress: "completed", license: "" });

    const analysis = analyseConflict(base, mine, theirs);

    expect(analysis.localOnly.map((f) => f.field)).toEqual(["license"]);
    expect(analysis.remoteOnly.map((f) => f.field)).toEqual(["progress"]);
    expect(analysis.contested).toEqual([]);
    expect(analysis.autoMergeable).toBe(true);
  });

  test("flags a field both sides changed differently", () => {
    const base = doc({ progress: "onGoing" });
    const mine = doc({ progress: "completed" });
    const theirs = doc({ progress: "historicalArchive" });

    const analysis = analyseConflict(base, mine, theirs);
    expect(analysis.contested.map((f) => f.field)).toEqual(["progress"]);
    expect(analysis.autoMergeable).toBe(false);
  });

  test("ignores fields both sides changed identically", () => {
    const base = doc({ progress: "onGoing" });
    const same = doc({ progress: "completed" });
    expect(analyseConflict(base, same, same).fields).toEqual([]);
  });

  test("ignores server-managed fields", () => {
    // updatedAt always differs after a remote write; treating it as a conflict
    // would make every 409 look contested.
    const base = doc({ updatedAt: "2026-01-01T00:00:00Z" });
    const mine = doc({ updatedAt: "2026-01-01T00:00:00Z" });
    const theirs = doc({ updatedAt: "2026-02-02T00:00:00Z", lastEditedBy: { email: "x" } });

    expect(analyseConflict(base, mine, theirs).fields).toEqual([]);
  });

  test("compares nested bilingual values structurally", () => {
    const base = doc({ title: { en: "A", fr: "" } });
    const mine = doc({ title: { en: "A", fr: "Ajouté" } });
    const theirs = doc({ title: { en: "A", fr: "" } });

    const analysis = analyseConflict(base, mine, theirs);
    expect(analysis.localOnly.map((f) => f.field)).toEqual(["title"]);
  });

  test("treats arrays by value, not identity", () => {
    const base = doc({ eov: ["oxygen"] });
    const mine = doc({ eov: ["oxygen"] });
    const theirs = doc({ eov: ["oxygen"] });
    expect(analyseConflict(base, mine, theirs).fields).toEqual([]);

    const changed = analyseConflict(base, doc({ eov: ["oxygen", "nitrate"] }), theirs);
    expect(changed.localOnly.map((f) => f.field)).toEqual(["eov"]);
  });

  test("without a base, everything differing is contested", () => {
    // We cannot attribute changes, so nothing may be merged silently. This is
    // the honest fallback, not a degraded guess.
    const mine = doc({ progress: "completed" });
    const theirs = doc({ progress: "onGoing" });

    const analysis = analyseConflict(null, mine, theirs);
    expect(analysis.contested.map((f) => f.field)).toEqual(["progress"]);
    expect(analysis.autoMergeable).toBe(false);
  });

  test("a field added on one side only is attributed to that side", () => {
    const base = doc({});
    const mine = doc({ edition: "1.1" });
    const theirs = doc({});

    expect(analyseConflict(base, mine, theirs).localOnly.map((f) => f.field)).toEqual([
      "edition",
    ]);
  });

  test("identical documents produce no conflict and are not auto-mergeable", () => {
    // Nothing to merge is not the same as a merge being available.
    const same = doc({ progress: "onGoing" });
    const analysis = analyseConflict(same, same, same);
    expect(analysis.fields).toEqual([]);
    expect(analysis.autoMergeable).toBe(false);
  });

  test("tags fields with their validator tab so the UI matches the ledger", () => {
    const base = doc({ license: "", dateStart: null });
    const mine = doc({ license: "CC-BY-4.0", dateStart: "2026-05-01T12:00:00Z" });
    const theirs = doc({ license: "", dateStart: null });

    const byField = Object.fromEntries(
      analyseConflict(base, mine, theirs).fields.map((f) => [f.field, f.tab]),
    );
    expect(byField.license).toBe("dataID");
    // Dates have no validator at all, so no tab — the UI groups these as other.
    expect(byField.dateStart).toBeNull();
  });
});

describe("autoMerge", () => {
  test("keeps remote changes and layers local ones on top", () => {
    const base = doc({ progress: "onGoing", license: "" });
    const mine = doc({ progress: "onGoing", license: "CC-BY-4.0" });
    const theirs = doc({ progress: "completed", license: "" });

    const analysis = analyseConflict(base, mine, theirs);
    const merged = autoMerge(analysis, theirs);

    expect(merged.progress).toBe("completed");
    expect(merged.license).toBe("CC-BY-4.0");
  });

  test("leaves contested fields as theirs rather than guessing", () => {
    const base = doc({ progress: "onGoing" });
    const mine = doc({ progress: "completed" });
    const theirs = doc({ progress: "historicalArchive" });

    const merged = autoMerge(analyseConflict(base, mine, theirs), theirs);
    expect(merged.progress).toBe("historicalArchive");
  });
});

describe("contestedByTab", () => {
  test("groups by section, with a bucket for untagged fields", () => {
    const base = doc({ license: "", edition: "1.0" });
    const mine = doc({ license: "CC-BY-4.0", edition: "2.0" });
    const theirs = doc({ license: "CC-BY-SA-4.0", edition: "3.0" });

    const grouped = contestedByTab(analyseConflict(base, mine, theirs));
    expect(grouped.dataID.map((f) => f.field)).toEqual(["license"]);
    expect(grouped.other.map((f) => f.field)).toEqual(["edition"]);
  });
});
