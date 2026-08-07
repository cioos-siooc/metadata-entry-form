/**
 * Exports form submissions as a flat table — the "study metadata" deliverable.
 *
 * Columns are derived from the form's JSON Schema, not from the data, so:
 *
 *   - every submission gets the same columns in the same order, even when some
 *     left fields blank (a table assembled from observed keys would give each
 *     export a different shape)
 *   - a field nobody filled in still appears, as an empty column, which is what
 *     makes the output usable as a template
 *   - the column order follows the schema's declaration order, which is the
 *     order the form presents them in
 *
 * Nested objects flatten with dotted paths (`site.latitude`). Arrays of scalars
 * join with "; ". Arrays of objects expand to indexed columns
 * (`samples.1.sampleId`) up to what the data actually contains, because a
 * spreadsheet has no way to express repetition — for a form whose real unit of
 * observation is the row (an eDNA sample sheet, say), model it as one submission
 * per sample rather than an array, and the export comes out tidy.
 */

const ARRAY_JOIN = "; ";

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

/** Bilingual `{en, fr}` objects are values, not structure — render one side. */
function isBilingual(schema) {
  const props = schema?.properties;
  return Boolean(props && (props.en || props.fr) && !props.value);
}

/**
 * Walks a schema and returns the ordered column definitions.
 * @param {Object} schema
 * @param {Object[]} rows        submission data, used only to size arrays
 * @param {Object} [options]
 * @param {string} [options.language] which side of a bilingual field to emit
 */
export function deriveColumns(schema, rows = [], { language = "en" } = {}) {
  const columns = [];

  function maxArrayLength(path) {
    return rows.reduce((max, row) => {
      const value = readPath(row, path);
      return Array.isArray(value) ? Math.max(max, value.length) : max;
    }, 0);
  }

  function walk(node, path, labelPath) {
    if (!isObject(node)) return;

    // Follow a $ref only if it has already been resolved onto the node.
    if (node.properties && isBilingual(node)) {
      ["en", "fr"].forEach((lang) => {
        if (!node.properties[lang]) return;
        // Emit the requested language first, then the other, so a reader
        // scanning left to right sees their language.
        const order = lang === language ? 0 : 1;
        columns.push({
          key: [...path, lang].join("."),
          header: `${labelPath.join(" / ")} (${lang})`,
          order,
        });
      });
      return;
    }

    if (node.properties) {
      Object.entries(node.properties).forEach(([name, sub]) => {
        const label = sub.title || name;
        walk(sub, [...path, name], [...labelPath, label]);
      });
      return;
    }

    if (node.type === "array" && isObject(node.items)) {
      const itemSchema = node.items;
      // Arrays of scalars collapse into one delimited cell.
      if (!itemSchema.properties) {
        columns.push({
          key: path.join("."),
          header: labelPath.join(" / "),
          join: true,
        });
        return;
      }
      // Arrays of objects expand to as many indexed groups as the data needs.
      const length = maxArrayLength(path);
      for (let i = 0; i < length; i += 1) {
        walk(itemSchema, [...path, String(i)], [...labelPath, `${i + 1}`]);
      }
      return;
    }

    columns.push({ key: path.join("."), header: labelPath.join(" / ") });
  }

  walk(schema, [], []);

  // Stable sort that keeps the requested language ahead of the other within a
  // bilingual pair, without disturbing overall declaration order.
  return columns
    .map((column, index) => ({ ...column, index }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.index - b.index)
    .map(({ index: _i, order: _o, ...column }) => column);
}

function readPath(data, dotted) {
  return String(dotted)
    .split(".")
    .reduce((node, key) => (node == null ? undefined : node[key]), data);
}

/** Renders one cell as a string. */
export function formatCell(value, column) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) {
    return column?.join === false
      ? String(value.length)
      : value
          .map((v) => (isObject(v) ? JSON.stringify(v) : String(v)))
          .join(ARRAY_JOIN);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (isObject(value)) return JSON.stringify(value);
  return String(value);
}

/**
 * RFC 4180 quoting. A field is quoted when it contains a delimiter, a quote, or
 * any newline; embedded quotes double.
 */
export function csvEscape(value, delimiter = ",") {
  const text = value === undefined || value === null ? "" : String(value);
  const needsQuotes =
    text.includes(delimiter) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r");
  return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Columns describing the submission itself, prepended to every export. */
export const METADATA_COLUMNS = [
  { key: "__submissionId", header: "Submission ID" },
  { key: "__status", header: "Status" },
  { key: "__formTypeVersion", header: "Form version" },
  { key: "__submittedBy", header: "Submitted by" },
  { key: "__createdAt", header: "Created" },
  { key: "__updatedAt", header: "Updated" },
];

function metadataValues(submission) {
  return {
    __submissionId: submission.id,
    __status: submission.status,
    __formTypeVersion: submission.formTypeVersion,
    __submittedBy:
      submission.lastEditedBy?.email || submission.userinfo?.email || submission.userID,
    __createdAt: submission.createdAt,
    __updatedAt: submission.updatedAt,
  };
}

/**
 * Builds the export table.
 *
 * @param {Object} args
 * @param {Object} args.jsonSchema
 * @param {Object[]} args.submissions
 * @param {string} [args.language]
 * @param {boolean} [args.includeMetadata] prepend the submission bookkeeping
 *   columns (default true)
 * @returns {{columns: Object[], headers: string[], rows: string[][]}}
 */
export function buildExportTable({
  jsonSchema,
  submissions = [],
  language = "en",
  includeMetadata = true,
}) {
  const data = submissions.map((s) => s.data || {});
  const schemaColumns = deriveColumns(jsonSchema, data, { language });
  const columns = includeMetadata
    ? [...METADATA_COLUMNS, ...schemaColumns]
    : schemaColumns;

  const rows = submissions.map((submission) => {
    const merged = { ...(submission.data || {}), ...metadataValues(submission) };
    return columns.map((column) =>
      formatCell(readPath(merged, column.key), column)
    );
  });

  return { columns, headers: columns.map((c) => c.header), rows };
}

/**
 * @param {Object} args  same as buildExportTable, plus `delimiter`
 * @returns {string} CSV text, CRLF-terminated per RFC 4180
 */
export function toCsv({ delimiter = ",", ...args }) {
  const { headers, rows } = buildExportTable(args);
  return [headers, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell, delimiter)).join(delimiter))
    .join("\r\n");
}

/**
 * The same data as JSON, for consumers that would rather not parse a
 * spreadsheet. Keeps the nested shape rather than the flattened one.
 */
export function toJson({ formType, submissions = [], region }) {
  return JSON.stringify(
    {
      formType: {
        slug: formType?.slug,
        title: formType?.title,
        version: formType?.resolvedVersion ?? formType?.version,
      },
      region,
      exportedCount: submissions.length,
      submissions: submissions.map((s) => ({
        id: s.id,
        status: s.status,
        formTypeVersion: s.formTypeVersion,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        data: s.data || {},
      })),
    },
    null,
    2
  );
}

/** A filesystem-safe export filename. `stamp` is passed in to stay testable. */
export function exportFilename({ slug, region, stamp, extension }) {
  const safe = String(slug || "form").replace(/[^a-z0-9-]/gi, "-");
  const parts = [safe, region, stamp].filter(Boolean);
  return `${parts.join("_")}.${extension}`;
}

/**
 * The handful of columns worth showing when LISTING submissions.
 *
 * The full export table is the wrong thing to browse: a form with 25 fields
 * makes a 30-column table nobody can read. A form type can name the fields that
 * identify a submission at a glance:
 *
 *   "ui:summaryFields": ["sampleId", "siteName", "collectionDateTime"]
 *
 * Without that, fall back to the fields most likely to identify a row: the
 * required ones first (an author marks a field required precisely because it
 * matters), then declaration order, capped so the table stays scannable.
 */
export function summaryColumns(jsonSchema, uiSchema, { limit = 4 } = {}) {
  const properties = jsonSchema?.properties || {};
  const declared = uiSchema?.["ui:summaryFields"];

  const names = Array.isArray(declared) && declared.length
    ? declared.filter((name) => name in properties)
    : pickIdentifyingFields(jsonSchema, limit);

  return names.map((name) => ({
    key: name,
    header:
      uiSchema?.[name]?.["ui:options"]?.i18n?.title?.en ||
      properties[name]?.title ||
      name,
    i18n: uiSchema?.[name]?.["ui:options"]?.i18n?.title || null,
  }));
}

function pickIdentifyingFields(jsonSchema, limit) {
  const properties = jsonSchema?.properties || {};
  const required = jsonSchema?.required || [];

  // Skip containers: an array or object renders as JSON in a cell, which tells
  // a reader nothing.
  const isScalar = (name) => {
    const type = properties[name]?.type;
    return type !== "object" && type !== "array";
  };

  const ordered = [
    ...required.filter((name) => name in properties && isScalar(name)),
    ...Object.keys(properties).filter(
      (name) => !required.includes(name) && isScalar(name)
    ),
  ];

  return [...new Set(ordered)].slice(0, limit);
}

/** Header for a summary column in the active language. */
export function summaryHeader(column, language = "en") {
  return column.i18n?.[language] || column.i18n?.en || column.header;
}

/** Reads a summary cell out of a submission, formatted for display. */
export function summaryValue(submission, column) {
  return formatCell(
    String(column.key)
      .split(".")
      .reduce((node, key) => (node == null ? undefined : node[key]), submission.data || {}),
    column
  );
}
