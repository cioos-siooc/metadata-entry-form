/**
 * Generate a URL-friendly slug from a string.
 * Ported from standardize_string in firebase_to_xml/firebase_to_xml/organizations.py
 */
export function slugify(text) {
  if (!text) return "";

  return text
    .toString()
    .normalize("NFKD") // Remove accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "-") // Replace non-alphanumeric with '-'
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with '-'
    .replace(/-+/g, "-") // Replace multiple '-' with single '-'
    .toLowerCase()
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing '-'
}

/**
 * Match a free-text organization name against the registry.
 * Searches EN/FR names and accepted name variants.
 */
export function findMatchingOrganization(name, organizations) {
  if (!name || !organizations) return null;

  const searchName = name.toLowerCase().trim();
  const orgs = Object.values(organizations);

  // 1. Exact match on EN or FR name
  let match = orgs.find(
    (o) =>
      o.orgNameEn?.toLowerCase() === searchName ||
      o.orgNameFr?.toLowerCase() === searchName
  );

  if (match) return match;

  // 2. Match in accepted names
  match = orgs.find((o) =>
    o.orgAcceptedNames?.some((variant) => variant.toLowerCase() === searchName)
  );

  if (match) return match;

  // 3. Slug match
  const searchSlug = slugify(name);
  match = orgs.find((o) => o.orgSlug === searchSlug);

  return match || null;
}
