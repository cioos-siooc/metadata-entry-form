import { legacyThemeMapping } from "./themes";

/**
 * Maps legacy resourceType values to their ISO equivalents.
 * e.g. ["oceanographic", "biological"] → ["oceans", "biota"]
 */
export function normalizeResourceType(resourceType) {
  if (!Array.isArray(resourceType)) return resourceType;
  return resourceType.map((val) => legacyThemeMapping[val] || val);
}

/**
 * Checks whether a resourceType array includes a given ISO category,
 * accounting for legacy value names.
 */
export function resourceTypeIncludes(resourceType, category) {
  if (!Array.isArray(resourceType)) return false;
  return normalizeResourceType(resourceType).includes(category);
}

/**
 * Checks whether the resourceType is exclusively "other"
 * (legacy or ISO — both are "other").
 */
export function isOnlyOther(resourceType) {
  if (!Array.isArray(resourceType)) return false;
  const normalized = normalizeResourceType(resourceType);
  return normalized.length === 1 && normalized.includes("other");
}
