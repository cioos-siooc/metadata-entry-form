/**
 * Language helpers for the builder.
 *
 * The builder takes `language` as a prop and resolves strings itself rather than
 * using the app's <I18n> component, for one reason: <I18n> reads the language
 * from `useParams`, so every component using it needs a Router in scope. The
 * builder is a leaf editing surface worth testing without one, and half its
 * bilingual strings are `label`/`aria-label` props that need to be plain strings
 * anyway.
 */

/** Picks the active side of a bilingual pair. */
export const pick = (language, en, fr) => (language === "fr" ? fr : en);

/** Picks from an {en, fr} object, tolerating a plain string or a missing value. */
export function localized(value, language, fallback = "") {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") return value;
  return value[language] || value.en || value.fr || fallback;
}

/** The two language codes, in the order their inputs are laid out. */
export const LANGUAGES = ["en", "fr"];

/**
 * "1 field" / "2 fields", in either language.
 *
 * Both languages happen to pluralise on n !== 1 here, so one rule covers them.
 * Worth a helper rather than an inline template because these counts appear as
 * BOTH visible chip text and an `aria-label`, and the two drifting apart is how a
 * badge ends up announcing something different from what it reads.
 */
export function plural(language, count, one, many, oneFr, manyFr) {
  if (language === "fr") return `${count} ${count === 1 ? oneFr : manyFr}`;
  return `${count} ${count === 1 ? one : many}`;
}
