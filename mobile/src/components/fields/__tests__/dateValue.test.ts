import { describe, expect, test } from "vitest";

import { formatRecordDate, fromRecordDate, toRecordDate } from "../dateValue";

describe("toRecordDate", () => {
  test("normalises to noon local, not midnight", () => {
    // The whole reason this function exists. Midnight local converts to the
    // previous day anywhere west of UTC, silently shifting every date in the
    // record by one — invisible until someone checks a cruise date against the
    // ship's log.
    const picked = new Date(2026, 6, 30, 0, 0, 0, 0); // 30 July, local midnight
    const stored = toRecordDate(picked)!;
    expect(new Date(stored).getHours()).toBe(12);
  });

  test("preserves the calendar date the user actually picked", () => {
    const picked = new Date(2026, 0, 1, 23, 59, 0, 0);
    const round = fromRecordDate(toRecordDate(picked));
    expect(round?.getFullYear()).toBe(2026);
    expect(round?.getMonth()).toBe(0);
    expect(round?.getDate()).toBe(1);
  });

  test("round-trips every day of a year without drifting", () => {
    // Cheap insurance against an off-by-one at a DST boundary.
    for (let day = 0; day < 365; day += 1) {
      const source = new Date(2026, 0, 1 + day, 9, 30, 0, 0);
      const round = fromRecordDate(toRecordDate(source))!;
      expect(round.getDate(), source.toDateString()).toBe(source.getDate());
      expect(round.getMonth(), source.toDateString()).toBe(source.getMonth());
    }
  });

  test("returns null for an invalid date rather than throwing", () => {
    expect(toRecordDate(new Date("nonsense"))).toBeNull();
  });
});

describe("fromRecordDate", () => {
  test.each([null, undefined, "", "not-a-date", 42])("rejects %p", (input) => {
    expect(fromRecordDate(input)).toBeNull();
  });

  test("parses a stored value", () => {
    expect(fromRecordDate("2026-07-30T12:00:00.000Z")).toBeInstanceOf(Date);
  });
});

describe("formatRecordDate", () => {
  test("formats per language", () => {
    const stored = toRecordDate(new Date(2026, 6, 30))!;
    expect(formatRecordDate(stored, "en")).toMatch(/2026/);
    expect(formatRecordDate(stored, "fr")).toMatch(/2026/);
  });

  test("returns null when there is nothing to show", () => {
    expect(formatRecordDate(null, "en")).toBeNull();
  });
});
