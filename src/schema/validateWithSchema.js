/**
 * ajv factory for the record schemas.
 *
 * Used by the tests today. When validate.js eventually becomes a thin adapter
 * over the schema (plan Phase 9), it will use this too — which is why the
 * per-field validator support is here rather than in a test helper.
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";

import { addCioosKeywords } from "./keywords";
import { buildStructuralSchema, buildSubmissionSchema } from "./index";

/**
 * @param {object} [options]
 * @param {boolean} [options.validateFormats] Set false for legacy conformance
 *   passes: ajv's `format: "uri"` rejects scheme-less URLs like
 *   "www.example.ca" that the app's validator.isURL accepts, which would swamp
 *   a report with hundreds of non-issues. See schema/README.md §6.
 */
export function createAjv({ validateFormats = true } = {}) {
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats,
  });
  addFormats(ajv);
  addCioosKeywords(ajv);
  return ajv;
}

let structuralValidator;
let submissionValidator;

export function getStructuralValidator(options) {
  if (options || !structuralValidator) {
    const validate = createAjv(options).compile(buildStructuralSchema());
    if (options) return validate;
    structuralValidator = validate;
  }
  return structuralValidator;
}

export function getSubmissionValidator(options) {
  if (options || !submissionValidator) {
    const validate = createAjv(options).compile(buildSubmissionSchema());
    if (options) return validate;
    submissionValidator = validate;
  }
  return submissionValidator;
}

function run(validate, record) {
  const valid = validate(record);
  return {
    valid,
    errors: valid
      ? []
      : validate.errors.map((e) => ({
          instancePath: e.instancePath,
          keyword: e.keyword,
          message: e.message,
          params: e.params,
        })),
  };
}

/** Does this look like a CIOOS record at all? */
export const validateStructural = (record) =>
  run(getStructuralValidator(), record);

/** Is this record complete enough to submit? */
export const validateSubmission = (record) =>
  run(getSubmissionValidator(), record);
