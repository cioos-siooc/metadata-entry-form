/**
 * Date normalisation, carried over from the web app verbatim.
 *
 *   new Date(y, m, d, 12, 0, 0, 0).toISOString()
 *
 * Noon local, not midnight. A date picked as midnight local converts to the
 * previous day in any timezone west of UTC, so every date in the record would
 * silently shift by one. The web app already solved this and the comment there
 * says only "to get around the issue of timezones and dates" — worth restating,
 * because the failure is invisible until someone compares a cruise date against
 * the ship's log.
 */

/** Local calendar date → the ISO string stored on the record. */
export function toRecordDate(date: Date): string | null {
  try {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0,
      0,
    ).toISOString();
  } catch {
    return null;
  }
}

/** Stored ISO string → a Date for the picker. */
export function fromRecordDate(value: unknown): Date | null {
  if (typeof value !== "string" || value === "") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Display form. Locale-aware, and stable regardless of the stored offset. */
export function formatRecordDate(value: unknown, locale: string): string | null {
  const date = fromRecordDate(value);
  if (!date) return null;
  return date.toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
