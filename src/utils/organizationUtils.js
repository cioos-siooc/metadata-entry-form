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

/**
 * Identify likely organization matches for a free-form or unrecognized name.
 *
 * This uses a heuristic, token-based scoring approach rather than traditional
 * string distance. It extracts:
 *   - Acronyms (e.g. "DFO", "CSA") as strong identity signals
 *   - Content words with stopwords and domain-generic terms removed
 *
 * Each registry organization is scored based on:
 *   - Shared acronyms (highest weight)
 *   - Overlap of meaningful content words across English, French, and aliases
 *
 * Results are ranked by score and the top candidates are returned with a brief,
 * human-readable explanation of the strongest matching signal.
 *
 * Note: This is not edit-distance fuzzy matching; it is designed for
 * explainable, domain-aware matching of organization names.
 */
export function findFuzzyCandidates(name, organizations) {
  if (!name || !organizations) return [];

  const STOPWORDS = new Set([
    'of', 'and', 'the', 'for', 'in', 'a', 'an', 'du', 'de', 'le', 'la', 'les', 'des', 'et', 'un', 'une', 'en', 'or',
  ]);

  const FILLER = new Set([
    'canada', 'department', 'ministry', 'office', 'government', 'region', 'regional', 'national', 'federal',
    'provincial', 'institute', 'foundation', 'centre', 'center', 'society', 'association', 'organization',
    'organisation', 'agency', 'bureau', 'division', 'branch', 'section', 'program', 'programme', 'project',
    'network', 'committee', 'council', 'board', 'authority', 'commission', 'service', 'services', 'science',
    'sciences', 'research', 'laboratory', 'lab', 'group', 'unit', 'team',
  ]);

  const normalize = (s) =>
    s.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const contentWords = (s) =>
    normalize(s)
      .split(' ')
      .filter(t => t.length > 1 && !STOPWORDS.has(t) && !FILLER.has(t));

  const extractAcronyms = (s) => {
    const set = new Set();

    const parenRe = /\(([A-Z]{2,})\)/g;
    let m;
    while ((m = parenRe.exec(s)) !== null) set.add(m[1].toLowerCase());

    for (const token of s.match(/\b[A-Z]{2,}\b/g) || []) {
      set.add(token.toLowerCase());
    }

    const words = contentWords(s);
    if (words.length >= 3) {
      const derived = words.map(w => w[0]).join('');
      if (derived.length >= 3) set.add(derived);
    }

    return set;
  };

  const jaccard = (a, b) => {
    const intersection = [...a].filter(x => b.has(x)).length;
    const union = new Set([...a, ...b]).size;
    return union ? intersection / union : 0;
  };

  const nameWords = new Set(contentWords(name));
  const nameAcronyms = extractAcronyms(name);
  const candidates = [];

  for (const org of Object.values(organizations)) {
    const orgTexts = [org.orgNameEn, org.orgNameFr, ...(org.orgAcceptedNames || [])].filter(Boolean);

    let score = 0;
    const reasons = [];

    const orgAcronyms = new Set();
    const orgWordUnion = new Set();

    for (const text of orgTexts) {
      for (const a of extractAcronyms(text)) orgAcronyms.add(a);
      for (const w of contentWords(text)) orgWordUnion.add(w);
    }

    const sharedAcronyms = [...nameAcronyms].filter(a => orgAcronyms.has(a));
    if (sharedAcronyms.length) {
      score += sharedAcronyms.length * 10;
      reasons.push(`shared acronym: ${sharedAcronyms.map(a => a.toUpperCase()).join(', ')}`);
    }

    const sharedWords = [...nameWords].filter(w => orgWordUnion.has(w));
    if (sharedWords.length >= 2) {
      score += sharedWords.length * 3;
      reasons.push(`${sharedWords.length} content words in common`);
      // Jaccard as a tiebreaker only when meaningful word overlap already exists
      score += jaccard(nameWords, orgWordUnion) * 5;
    }

    if (score > 0) {
      candidates.push({
        org,
        score,
        reasons,
      });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(c => ({
      ...c,
      reason: c.reasons.join('; '),
    }));
}