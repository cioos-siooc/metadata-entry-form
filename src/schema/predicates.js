/**
 * Cross-field record predicates that JSON Schema cannot express.
 *
 * These were lifted out of src/utils/validate.js so that the hand-written
 * validators and the schema's ajv custom keywords (src/schema/keywords.js)
 * share one implementation. validate.js imports them back — do not
 * reintroduce copies there.
 *
 * Behaviour is intentionally identical to the original validate.js versions,
 * including their tolerance of string inputs: bbox and vertical extent values
 * are stored as strings in the database (e.g. "east": "-160"), so every
 * numeric predicate here parses rather than assuming a number.
 */

export const validateLatitude = (num) => num >= -90 && num <= 90;

export const validateLongitude = (num) => num >= -360 && num <= 360;

/**
 * Splits a polygon string into [lat, lon] string pairs.
 * Format: "48,-128 56,-133 56,-147 48,-128" — space-separated, comma-joined.
 */
function polygonCoordinates(polygon) {
  return polygon.split(" ").map((c) => c.split(","));
}

/**
 * A polygon must have at least two points and be closed (first point equals
 * last), and every coordinate must be in range.
 *
 * The original used a deepCompare helper that round-tripped a boolean through
 * JSON.parse; that reduced to plain string equality, so it is written directly
 * here. Behaviour is unchanged.
 */
export const polygonIsValid = (polygon) => {
  const coordinates = polygonCoordinates(polygon);
  if (coordinates.length < 2) return false;
  if (
    JSON.stringify(coordinates[0]) !==
    JSON.stringify(coordinates[coordinates.length - 1])
  )
    return false;

  return (
    coordinates.filter(
      ([lat, lon]) =>
        validateLongitude(parseFloat(lon)) && validateLatitude(parseFloat(lat))
    ).length === coordinates.length
  );
};

/** True when the polygon's first and last coordinate pairs match. */
export const polygonIsClosed = (polygon) => {
  const coordinates = polygonCoordinates(polygon);
  if (coordinates.length < 2) return false;
  return (
    JSON.stringify(coordinates[0]) ===
    JSON.stringify(coordinates[coordinates.length - 1])
  );
};

/** True when every coordinate pair in the polygon is within valid ranges. */
export const polygonCoordinatesInRange = (polygon) =>
  polygonCoordinates(polygon).every(
    ([lat, lon]) =>
      validateLongitude(parseFloat(lon)) && validateLatitude(parseFloat(lat))
  );

const bboxNumbers = (map) => ({
  north: parseFloat(map.north),
  south: parseFloat(map.south),
  east: parseFloat(map.east),
  west: parseFloat(map.west),
});

/** True when all four bbox edges parse as numbers. */
export const bboxIsComplete = (map) => {
  if (!map) return false;
  return Object.values(bboxNumbers(map)).every((n) => !Number.isNaN(n));
};

/** True when north >= south and east >= west. Incomplete bboxes pass. */
export const bboxIsOrdered = (map) => {
  if (!bboxIsComplete(map)) return true;
  const { north, south, east, west } = bboxNumbers(map);
  return north >= south && east >= west;
};

/** True when all four bbox edges are within valid lat/lon ranges. */
export const bboxInRange = (map) => {
  if (!bboxIsComplete(map)) return true;
  const { north, south, east, west } = bboxNumbers(map);
  return (
    validateLatitude(north) &&
    validateLatitude(south) &&
    validateLongitude(east) &&
    validateLongitude(west)
  );
};

/** The full bbox check used by the map validator. */
export const bboxIsValid = (map) =>
  bboxIsComplete(map) && bboxIsOrdered(map) && bboxInRange(map);
