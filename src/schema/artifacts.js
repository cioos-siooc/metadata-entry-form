/**
 * Builds the set of files that get committed under schema/v1/.
 *
 * Kept separate from scripts/buildSchema.mjs so the drift-guard test can
 * rebuild them in memory without triggering a write.
 */

import { buildStructuralSchema, buildSubmissionSchema } from "./index";
import { extractI18n, toMonolingual } from "./annotations";

/** Filenames in emit order, so the script and the test agree on the set. */
export const ARTIFACT_FILES = {
  structural: "record.schema.json",
  submission: "record.submission.schema.json",
  en: "record.en.schema.json",
  fr: "record.fr.schema.json",
  i18n: "i18n.json",
};

export function buildArtifacts() {
  const structural = buildStructuralSchema();
  const submission = buildSubmissionSchema();

  const fallbacks = [];

  return {
    structural,
    submission,
    en: toMonolingual(structural, "en"),
    fr: toMonolingual(structural, "fr", (info) => fallbacks.push(info)),
    i18n: extractI18n(structural),
    fallbacks,
  };
}

/** Stable formatting, so diffs stay reviewable. */
export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export default buildArtifacts;
