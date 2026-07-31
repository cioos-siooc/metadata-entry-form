import validator from "validator";

/**
 * Guessing an identifier's type from the identifier itself.
 *
 * Related works and lineage sources both ask for a code and its authority, and
 * in practice people paste a DOI or a URL and have no idea what "authority"
 * means. Both clients infer the same way, so the same paste produces the same
 * record wherever it happens.
 *
 * Only the two cases the web app infers are inferred here — the rest of the
 * twenty identifier types stay a deliberate choice, because guessing an ISBN
 * from a bare number would be worse than leaving it blank.
 */
export function inferIdentifierAuthority(code) {
  const value = String(code ?? "").trim();
  if (!value) return "";
  if (!validator.isURL(value)) return "";
  return /^https?:\/\/(?:dx\.)?doi\.org\//i.test(value) ? "DOI" : "URL";
}

/** A code is acceptable when it is not a URL, or is a valid one. */
export function identifierCodeIsValid(code) {
  const value = String(code ?? "").trim();
  if (!value) return false;
  return !/^https?:\/\//i.test(value) || validator.isURL(value);
}
