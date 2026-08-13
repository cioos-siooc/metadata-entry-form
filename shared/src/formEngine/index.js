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

export {
  UI_WIDGETS,
  UI_WIDGETS_BY_NAME,
  UI_OPTIONS,
  PREDICATE_OPERATORS,
  PREDICATE_OPERATOR_NAMES,
  PREDICATE_COMBINATORS,
  PREDICATE_CONTEXT_FLAGS,
  RESERVED_STRING_KEYS,
  ENGINE_ROOT_KEYS,
  widgetsForProperty,
  isScalarProperty,
} from "./uiVocabulary";

export {
  validateUiSchema,
  countBySeverity,
  ERROR,
  WARNING,
  INFO,
} from "./validateUiSchema";

export {
  moveItem,
  setFieldI18n,
  setFieldWidget,
  getFieldWidget,
  setFieldOption,
  setFieldVisibleIf,
  addStep,
  updateStep,
  setStepVisibleIf,
  removeStep,
  moveStep,
  assignFieldToStep,
  moveFieldWithinStep,
  assignedFields,
  setSummaryFields,
} from "./uiSchemaOps";
