// Search over CKAN-shaped packages for the Collection link typeahead.
// No React and no network: the caller passes the packages to search.

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const doiPattern = /^10\.\d{4,9}\/\S+$/i;

// Strips "https://doi.org/", "doi.org/" and "doi:" prefixes from a DOI
export const normalizeDoi = (q) =>
  q
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");

export const detectQueryType = (q = "") => {
  const trimmed = q.trim();
  if (uuidPattern.test(trimmed)) return "uuid";
  if (doiPattern.test(normalizeDoi(trimmed))) return "doi";
  return "name";
};

// Case- and accent-insensitive text for name matching
const fold = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Returns packages matching the query. A UUID or DOI is an exact match;
// anything else matches when every word appears in the EN or FR title.
export const searchPackages = (packages, query, { type } = {}) => {
  const q = (query || "").trim();
  if (!q) return [];
  const pool = type ? packages.filter((p) => p.type === type) : packages;

  switch (detectQueryType(q)) {
    case "uuid":
      return pool.filter((p) => p.id.toLowerCase() === q.toLowerCase());
    case "doi": {
      const doi = normalizeDoi(q).toLowerCase();
      return pool.filter((p) => p.doi && p.doi.toLowerCase() === doi);
    }
    default: {
      const words = fold(q).split(/\s+/);
      return pool.filter((p) => {
        const titles = fold(
          `${p.title_translated.en} ${p.title_translated.fr}`,
        );
        return words.every((w) => titles.includes(w));
      });
    }
  }
};

// The related-work identifier for a package: its DOI URL, or its catalogue URL
export const packageIdentifier = (p) =>
  p.doi
    ? { authority: "DOI", code: `https://doi.org/${p.doi}` }
    : { authority: "URL", code: p.url };
