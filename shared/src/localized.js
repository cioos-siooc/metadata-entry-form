// One way to read a bilingual value, because the vocabularies disagree with
// each other. Four conventions grew up across the data files:
//
//   { en, fr }                       isoCodeLists, keywords, regions, tabs,
//                                    licenses, validator errors, eovCategories
//   { label_en, definition_fr }      platforms.json          (snake suffix)
//   { "label EN", "definition FR" }  data/eovs.json          (spaced, caps)
//
// (The quoted-key JSON form is the same as the first at runtime — quoting is
// just JSON syntax — so there are three real shapes, not four.)
//
// Never reach for a language key directly in client code. Go through here, and
// adding a fifth convention or a third language stays a one-file change.

/** @typedef {"en" | "fr"} Lang */

const OTHER_LANG = { en: "fr", fr: "en" };

const isMissing = (v) => v === undefined || v === null || v === "";

// Resolution order matters only in that the three shapes are mutually
// exclusive in practice; checking nested first is cheapest.
function readVariant(source, field, lang) {
  if (field === undefined) {
    return source?.[lang];
  }
  const nested = source?.[field];
  if (nested && typeof nested === "object") return nested[lang];
  const snake = source?.[`${field}_${lang}`];
  if (!isMissing(snake)) return snake;
  return source?.[`${field} ${lang.toUpperCase()}`];
}

/**
 * Read a bilingual value in the requested language.
 *
 * @param {object} source   The bilingual pair, or the record holding one.
 * @param {Lang}   lang     Requested language.
 * @param {string} [field]  Field name when the pair is a property of `source`
 *                          (e.g. "label", "definition", "title"). Omit when
 *                          `source` is itself a pair.
 * @param {object} [options]
 * @param {boolean} [options.fallback=true]
 *        Fall back to the other language when the requested one is missing or
 *        empty. Correct for controlled vocabularies, where a French label is
 *        often absent — `licenses.js` has French for only 3 of 15 entries, and
 *        the SPA already compensates with `l.title[language] || l.title.en`.
 *        Pass false for user-authored record content, where showing English in
 *        place of a deliberately empty French field would be wrong.
 * @returns {string | undefined}
 */
export function localized(source, lang, field, { fallback = true } = {}) {
  if (!source || typeof source !== "object") return undefined;

  const value = readVariant(source, field, lang);
  if (!isMissing(value)) return value;
  if (!fallback) return value;

  return readVariant(source, field, OTHER_LANG[lang] ?? "en");
}

/**
 * True when `source` carries a value in `lang` — without falling back. Useful
 * for "needs translation" affordances.
 *
 * @param {object} source
 * @param {Lang} lang
 * @param {string} [field]
 * @returns {boolean}
 */
export function hasLanguage(source, lang, field) {
  return !isMissing(readVariant(source, field, lang));
}
