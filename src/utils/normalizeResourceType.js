import { legacyThemeMapping } from "./themes";

/**
 * Coerces a resourceType value to an array. Older records may serialize a
 * single value as a plain string rather than a one-element array.
 */
function toArray(resourceType) {
  if (Array.isArray(resourceType)) return resourceType;
  if (typeof resourceType === "string" && resourceType) return [resourceType];
  return [];
}

/**
 * Maps legacy resourceType values to their ISO equivalents.
 * e.g. ["oceanographic", "biological"] → ["oceans", "biota"]
 * Always returns an array; unset values become [].
 */
export function normalizeResourceType(resourceType) {
  return toArray(resourceType).map((val) => legacyThemeMapping[val] || val);
}

/**
 * Checks whether a resourceType includes a given ISO category,
 * accounting for legacy value names.
 */
export function resourceTypeIncludes(resourceType, category) {
  return normalizeResourceType(resourceType).includes(category);
}

/**
 * Checks whether the resourceType is exclusively "other"
 * (legacy or ISO — both are "other").
 */
export function isOnlyOther(resourceType) {
  const normalized = normalizeResourceType(resourceType);
  return normalized.length === 1 && normalized[0] === "other";
}

/**
 * Checks whether any resourceType has been selected. An empty array is
 * truthy, so callers must not test record.resourceType directly.
 */
export function hasResourceType(resourceType) {
  return toArray(resourceType).length > 0;
}
