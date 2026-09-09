/**
 * Backend-neutral form engine logic.
 *
 * Everything here is pure and dependency-free so it can be imported by the
 * browser app today and by the Fastify API once the Postgres migration lands.
 * Nothing in this directory may import firebase, react, or a store adapter.
 */

export {
  SLUG_PATTERN,
  FORM_TYPE_KINDS,
  FORM_TYPE_STATUSES,
  SUBMISSION_STATUSES,
  validateFormTypeInput,
} from "./FormStore";

export {
  deepMerge,
  resolveVersion,
  resolveFormType,
  resolveCatalogForRegion,
  formTypeLabel,
} from "./resolveFormType";

export { schemaDiff, schemaHash, ADDITIVE, BREAKING } from "./schemaDiff";

export { evaluate, referencedFields } from "./predicate";

export {
  deriveColumns,
  formatCell,
  csvEscape,
  buildExportTable,
  toCsv,
  toJson,
  exportFilename,
  METADATA_COLUMNS,
  summaryColumns,
  summaryHeader,
  summaryValue,
} from "./exportSubmissions";

export { pickSchemaProperties, resolveSteps, stepLabel } from "./steps";
