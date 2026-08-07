/**
 * ajv custom keywords for the three record rules JSON Schema cannot express:
 * bbox ordering, coordinate ranges on string-typed values, and polygon closure.
 * See schema/README.md §7.
 *
 * They are `x-` prefixed so that consumers without these implementations —
 * json-schema-for-humans, Python jsonschema, ajv with strict:false — ignore
 * them rather than erroring. Those consumers degrade to "validates everything
 * except these three rules", which is why each rule is also restated in the
 * affected field's `description`.
 *
 * A Python twin lives at schema/tools/cioos_keywords.py. Both iterate the
 * shared case table in schema/tools/keyword_cases.json so neither can drift
 * without turning a test red.
 */

import {
  bboxIsOrdered,
  bboxInRange,
  polygonIsClosed,
  polygonCoordinatesInRange,
} from "./predicates";

/**
 * Each keyword is declared on an object (the map extent) or a string (the
 * polygon), takes a boolean schema value, and is a no-op when that value is
 * false — so a subschema can opt out without removing the annotation.
 */
export const cioosKeywords = [
  {
    keyword: "x-cioos-bbox-ordered",
    schemaType: "boolean",
    errors: true,
    validate: function validateBboxOrdered(schemaValue, data) {
      if (!schemaValue) return true;
      if (!data || typeof data !== "object") return true;
      if (bboxIsOrdered(data)) return true;

      validateBboxOrdered.errors = [
        {
          keyword: "x-cioos-bbox-ordered",
          message: "north must be >= south and east must be >= west",
          params: { north: data.north, south: data.south, east: data.east, west: data.west },
        },
      ];
      return false;
    },
  },
  {
    keyword: "x-cioos-coordinate-ranges",
    schemaType: "boolean",
    errors: true,
    validate: function validateCoordinateRanges(schemaValue, data) {
      if (!schemaValue) return true;
      if (!data || typeof data !== "object") return true;
      if (bboxInRange(data)) return true;

      validateCoordinateRanges.errors = [
        {
          keyword: "x-cioos-coordinate-ranges",
          message:
            "latitudes must be between -90 and 90, longitudes between -360 and 360",
          params: { north: data.north, south: data.south, east: data.east, west: data.west },
        },
      ];
      return false;
    },
  },
  {
    keyword: "x-cioos-polygon-closed",
    schemaType: "boolean",
    errors: true,
    validate: function validatePolygonClosed(schemaValue, data) {
      if (!schemaValue) return true;
      // An empty polygon means "not provided" — the requirement that a polygon
      // exist at all is expressed separately, in the submission conditionals.
      if (typeof data !== "string" || data === "") return true;

      if (!polygonIsClosed(data)) {
        validatePolygonClosed.errors = [
          {
            keyword: "x-cioos-polygon-closed",
            message:
              "polygon must have at least two points and the first must equal the last",
            params: { polygon: data },
          },
        ];
        return false;
      }

      if (!polygonCoordinatesInRange(data)) {
        validatePolygonClosed.errors = [
          {
            keyword: "x-cioos-polygon-closed",
            message:
              "every polygon coordinate must be a valid latitude and longitude",
            params: { polygon: data },
          },
        ];
        return false;
      }

      return true;
    },
  },
];

/** Registers all CIOOS keywords on an ajv instance. Returns the instance. */
export function addCioosKeywords(ajv) {
  cioosKeywords.forEach((keyword) => ajv.addKeyword(keyword));
  return ajv;
}

export default addCioosKeywords;
