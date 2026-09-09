/**
 * The record schema version, kept in its own module so that blankRecord.js can
 * stamp it without pulling the whole schema (and its vocabulary imports) into
 * every module that seeds a record.
 *
 * Semver policy is in schema/README.md §4. In short: PATCH for text, MINOR for
 * relaxations and for tightening the submission schema alone, MAJOR for a new
 * required structural property or any narrowing.
 */
export const SCHEMA_VERSION = "1.0.0";

/** Major version, used in the $id path and the schema/ directory name. */
export const SCHEMA_MAJOR = "v1";

export default SCHEMA_VERSION;
