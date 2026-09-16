import { validateField } from "@cioos/shared/validate.js";
import { describe, expect, test } from "vitest";

import {
  boundsFromCorners,
  boundsFromMap,
  boundsFromPoints,
  boundsToCorners,
  formatPolygon,
  limitDecimals,
  openRing,
  parsePolygon,
  polygonPatch,
  rectanglePatch,
  regionForBounds,
  type LatLng,
} from "../mapValue";

const point = (latitude: number, longitude: number): LatLng => ({ latitude, longitude });

// The record shape the spatial validator needs to see. A theme must be set or
// `map` short-circuits to valid and the assertions below prove nothing.
const spatialRecord = (map: unknown) => ({
  resourceType: ["oceanographic"],
  map,
  verticalExtentMin: "0",
  verticalExtentMax: "10",
  verticalExtentDirection: "depthPositive",
});

describe("limitDecimals", () => {
  test("rounds to 4 places and returns a number", () => {
    expect(limitDecimals(48.123456789)).toBe(48.1235);
    expect(typeof limitDecimals(1)).toBe("number");
  });

  test("drops trailing zeros rather than keeping a fixed string", () => {
    expect(limitDecimals(48.10000)).toBe(48.1);
  });
});

describe("parsePolygon", () => {
  test("parses the documented format", () => {
    // The example from the validator's own comment.
    const points = parsePolygon("48,-128 56,-133 56,-147 48,-128");
    expect(points).toHaveLength(4);
    expect(points[0]).toEqual(point(48, -128));
    expect(points[2]).toEqual(point(56, -147));
  });

  test("tolerates extra whitespace", () => {
    expect(parsePolygon("  48,-128   56,-133  ")).toHaveLength(2);
  });

  test.each([null, undefined, "", "   ", 42, "garbage", "48 -128", "48,"])(
    "returns [] for %p rather than partial points",
    (input) => {
      expect(parsePolygon(input)).toEqual([]);
    },
  );
});

describe("formatPolygon", () => {
  test("closes the ring by re-appending the first point", () => {
    // Not closing it makes polygonIsValid reject the polygon outright, which
    // surfaces as "Spatial information is missing" pointing nowhere.
    const formatted = formatPolygon([point(48, -128), point(56, -133), point(56, -147)]);
    expect(formatted).toBe("48,-128 56,-133 56,-147 48,-128");
  });

  test("round-trips through parsePolygon", () => {
    const points = [point(48.1234, -128.5678), point(56, -133), point(56, -147)];
    const reparsed = openRing(parsePolygon(formatPolygon(points)));
    expect(reparsed).toEqual(points);
  });

  test("produces a polygon the shared validator accepts", () => {
    // The assertion that actually matters: the string we write must satisfy the
    // same validator that gates submission.
    const polygon = formatPolygon([point(48, -128), point(56, -133), point(56, -147)]);
    expect(validateField(spatialRecord({ polygon }), "map")).toBeTruthy();
  });

  test("an unclosed ring is rejected by the validator — proving why we close it", () => {
    expect(validateField(spatialRecord({ polygon: "48,-128 56,-133 56,-147" }), "map")).toBeFalsy();
  });

  test("returns an empty string for no points", () => {
    expect(formatPolygon([])).toBe("");
  });
});

describe("openRing", () => {
  test("strips the duplicated closing point", () => {
    const closed = [point(48, -128), point(56, -133), point(48, -128)];
    expect(openRing(closed)).toHaveLength(2);
  });

  test("leaves an already-open ring alone", () => {
    const open = [point(48, -128), point(56, -133)];
    expect(openRing(open)).toHaveLength(2);
  });

  test("does not mangle a single point", () => {
    expect(openRing([point(1, 2)])).toHaveLength(1);
  });
});

describe("bounds", () => {
  test("derived from points regardless of winding order", () => {
    const bounds = boundsFromPoints([point(48, -128), point(56, -147), point(50, -133)]);
    expect(bounds).toEqual({ north: 56, south: 48, east: -128, west: -147 });
  });

  test("from two corners in any order", () => {
    const a = boundsFromCorners(point(48, -147), point(56, -128));
    const b = boundsFromCorners(point(56, -128), point(48, -147));
    expect(a).toEqual(b);
    expect(a).toEqual({ north: 56, south: 48, east: -128, west: -147 });
  });

  test("read from a stored map, accepting strings", () => {
    // The numeric fields accept typed text, so a stored bbox can be strings.
    expect(boundsFromMap({ north: "56", south: "48", east: "-128", west: "-147" })).toEqual({
      north: 56,
      south: 48,
      east: -128,
      west: -147,
    });
  });

  test("an incomplete stored bbox reads as null, not as zeros", () => {
    expect(boundsFromMap({ north: "56", south: "48" })).toBeNull();
    expect(boundsFromMap({})).toBeNull();
    expect(boundsFromMap(undefined)).toBeNull();
  });

  test("corners close the box for drawing", () => {
    const corners = boundsToCorners({ north: 56, south: 48, east: -128, west: -147 });
    expect(corners).toHaveLength(4);
    expect(corners[0]).toEqual(point(56, -147));
  });
});

describe("rectanglePatch", () => {
  test("writes the bbox and clears any polygon", () => {
    // Mutually exclusive: a stale polygon would make the map show one shape
    // while the record described another.
    const patch = rectanglePatch(
      { polygon: "48,-128 56,-133 48,-128" },
      { north: 56, south: 48, east: -128, west: -147 },
    );
    expect(patch.polygon).toBe("");
    expect(patch.north).toBe(56);
  });

  test("preserves unrelated fields such as the description", () => {
    const patch = rectanglePatch(
      { description: { en: "Off Hartley Bay", fr: "" } },
      { north: 1, south: 0, east: 1, west: 0 },
    );
    expect(patch.description).toEqual({ en: "Off Hartley Bay", fr: "" });
  });

  test("produces a bbox the shared validator accepts", () => {
    const patch = rectanglePatch({}, boundsFromCorners(point(48, -147), point(56, -128)));
    expect(validateField(spatialRecord(patch), "map")).toBeTruthy();
  });
});

describe("polygonPatch", () => {
  test("writes the string AND the derived bbox", () => {
    // Both, because the record carries a bbox even when a polygon is set — the
    // web app derives it from the drawn layer's bounds.
    const patch = polygonPatch({}, [point(48, -128), point(56, -133), point(56, -147)]);
    expect(patch.polygon).toBe("48,-128 56,-133 56,-147 48,-128");
    expect(patch.north).toBe(56);
    expect(patch.south).toBe(48);
    expect(patch.east).toBe(-128);
    expect(patch.west).toBe(-147);
  });

  test("accepts an already-closed ring without double-closing it", () => {
    const patch = polygonPatch({}, [
      point(48, -128),
      point(56, -133),
      point(56, -147),
      point(48, -128),
    ]);
    expect(patch.polygon).toBe("48,-128 56,-133 56,-147 48,-128");
  });

  test("fewer than three points is not a polygon", () => {
    expect(polygonPatch({}, [point(48, -128), point(56, -133)]).polygon).toBe("");
    expect(polygonPatch({}, []).polygon).toBe("");
  });

  test("produces a polygon the shared validator accepts", () => {
    const patch = polygonPatch({}, [point(48, -128), point(56, -133), point(56, -147)]);
    expect(validateField(spatialRecord(patch), "map")).toBeTruthy();
  });
});

describe("regionForBounds", () => {
  test("centres on the box with room around it", () => {
    const region = regionForBounds({ north: 56, south: 48, east: -128, west: -147 });
    expect(region.latitude).toBe(52);
    expect(region.longitude).toBe(-137.5);
    expect(region.latitudeDelta).toBeGreaterThan(8);
  });

  test("a degenerate box still yields a usable viewport", () => {
    // A single point has zero extent; a zero delta would zoom to nothing.
    const region = regionForBounds({ north: 50, south: 50, east: -130, west: -130 });
    expect(region.latitudeDelta).toBeGreaterThan(0);
    expect(region.longitudeDelta).toBeGreaterThan(0);
  });
});
