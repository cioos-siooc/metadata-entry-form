import { useMemo, useState } from "react";

import { localized } from "./language";

/**
 * Finding one property among many.
 *
 * The shipped eDNA field sheet has 22 properties across five steps; the metadata
 * record has around fifty. Without a filter the only way to find one is to open
 * every card and read, which is the single biggest reason the canvas felt
 * unusable at real scale.
 *
 * The matcher is pure and exported on its own so the matching RULES — which
 * haystacks, which language, what counts as a match — are testable without
 * rendering a panel that re-renders every row on every keystroke.
 */

/**
 * Whether a property matches a query.
 *
 * Searches the property NAME and both halves of its bilingual label, not just the
 * active language: an author working in French still knows fields by the English
 * names in the JSON Schema, and a bilingual pair is often half-filled, so
 * matching only the current language would hide fields that plainly match.
 *
 * Also searches the schema's own `title`, which is what the renderer falls back
 * to when there is no `ui:options.i18n.title`.
 */
export function matchesQuery(name, uiSchema, jsonSchema, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return true;

  const i18nTitle = uiSchema?.[name]?.["ui:options"]?.i18n?.title;
  const haystacks = [
    name,
    localized(i18nTitle, "en", ""),
    localized(i18nTitle, "fr", ""),
    jsonSchema?.properties?.[name]?.title || "",
  ];

  return haystacks.some((text) => String(text).toLowerCase().includes(needle));
}

/**
 * The filter's state and its result.
 *
 * `visibleFields` is null — not a Set of everything — when no query is active.
 * That distinction is load-bearing downstream: a null means "not filtering", and
 * the canvas uses it to decide whether reordering is safe (nudging a row past a
 * hidden sibling is a move an author cannot see) and whether to draw a
 * no-matches empty state.
 */
export default function useFieldFilter(jsonSchema, uiSchema) {
  const [query, setQuery] = useState("");

  const allFields = useMemo(
    () => Object.keys(jsonSchema?.properties || {}),
    [jsonSchema]
  );

  const active = query.trim().length > 0;

  const visibleFields = useMemo(() => {
    if (!active) return null;
    return new Set(
      allFields.filter((name) => matchesQuery(name, uiSchema, jsonSchema, query))
    );
  }, [active, allFields, uiSchema, jsonSchema, query]);

  return {
    query,
    setQuery,
    clear: () => setQuery(""),
    active,
    visibleFields,
    matchCount: visibleFields ? visibleFields.size : allFields.length,
    totalCount: allFields.length,
  };
}
