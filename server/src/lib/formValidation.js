const Ajv = require("ajv");
const addFormats = require("ajv-formats");

// Validates form-type schemas and submission data. Fastify's internal ajv
// instance only handles route schemas, so the form engine keeps its own.
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Compiled validators cached per form type version; a schema edit bumps the
// version, which naturally invalidates the cache entry.
const cache = new Map();

// Throws (ajv's message) when the schema itself doesn't compile — used by
// form-type writes to reject broken schemas with a 422.
function compileFormSchema(schema) {
  return ajv.compile(schema);
}

function validateSubmissionData(formTypeRow, data) {
  const key = `${formTypeRow.id}:${formTypeRow.version}`;
  let validate = cache.get(key);
  if (!validate) {
    validate = compileFormSchema(formTypeRow.json_schema);
    cache.set(key, validate);
  }
  const valid = validate(data);
  return {
    valid,
    errors: valid
      ? []
      : validate.errors.map((e) => ({ instancePath: e.instancePath, message: e.message })),
  };
}

module.exports = { compileFormSchema, validateSubmissionData };
