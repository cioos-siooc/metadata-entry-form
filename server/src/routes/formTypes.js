const { query } = require("../db");
const { compileFormSchema } = require("../lib/formValidation");

// Form type definitions (JSON Schema + UI Schema), region-scoped. Members
// read enabled types; admins manage them.

function toApi(row) {
  return {
    id: row.id,
    region: row.region,
    slug: row.slug,
    title: row.title,
    description: row.description,
    jsonSchema: row.json_schema,
    uiSchema: row.ui_schema,
    version: row.version,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// 422 body when the submitted JSON Schema is unusable, null when fine.
function schemaProblem(jsonSchema, uiSchema) {
  if (!isPlainObject(jsonSchema)) return "jsonSchema object required";
  if (uiSchema !== undefined && !isPlainObject(uiSchema)) return "uiSchema must be an object";
  try {
    compileFormSchema(jsonSchema);
  } catch (err) {
    return `jsonSchema does not compile: ${err.message}`;
  }
  return null;
}

async function formTypeRoutes(app) {
  const memberGuard = { preHandler: [app.authenticate, app.regionContext] };
  const adminGuard = { preHandler: [app.authenticate, app.regionContext, app.requireAdmin] };

  app.get("/regions/:region/form-types", memberGuard, async (request) => {
    const includeDisabled = request.query.includeDisabled === "1" && request.roles.isAdmin;
    const result = await query(
      `SELECT * FROM form_types WHERE region = $1 ${includeDisabled ? "" : "AND enabled"} ORDER BY slug`,
      [request.region],
    );
    return result.rows.map(toApi);
  });

  app.get("/regions/:region/form-types/:id", memberGuard, async (request, reply) => {
    const result = await query("SELECT * FROM form_types WHERE region = $1 AND id = $2", [
      request.region,
      request.params.id,
    ]);
    const row = result.rows[0];
    if (!row || (!row.enabled && !request.roles.isAdmin)) {
      return reply.code(404).send({ error: "Form type not found" });
    }
    return toApi(row);
  });

  app.post("/regions/:region/form-types", adminGuard, async (request, reply) => {
    const { slug, title, description, jsonSchema, uiSchema, enabled } = request.body || {};
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
      return reply
        .code(422)
        .send({ error: "slug must contain only lowercase letters, digits, and hyphens" });
    }
    if (!isPlainObject(title)) return reply.code(422).send({ error: "title object required" });
    const problem = schemaProblem(jsonSchema, uiSchema);
    if (problem) return reply.code(422).send({ error: problem });

    const inserted = await query(
      `INSERT INTO form_types (region, slug, title, description, json_schema, ui_schema, enabled, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING RETURNING *`,
      [
        request.region,
        slug,
        title,
        description || { en: "", fr: "" },
        JSON.stringify(jsonSchema),
        JSON.stringify(uiSchema || {}),
        enabled ?? true,
        request.user.id,
      ],
    );
    if (!inserted.rows.length) {
      return reply.code(409).send({ error: `Form type ${slug} already exists in this region` });
    }
    return reply.code(201).send(toApi(inserted.rows[0]));
  });

  app.put("/regions/:region/form-types/:id", adminGuard, async (request, reply) => {
    const existing = await query("SELECT * FROM form_types WHERE region = $1 AND id = $2", [
      request.region,
      request.params.id,
    ]);
    const row = existing.rows[0];
    if (!row) return reply.code(404).send({ error: "Form type not found" });

    const { title, description, jsonSchema, uiSchema, enabled } = request.body || {};
    const nextSchema = jsonSchema ?? row.json_schema;
    const problem = schemaProblem(nextSchema, uiSchema);
    if (problem) return reply.code(422).send({ error: problem });

    const schemaChanged =
      jsonSchema !== undefined && JSON.stringify(jsonSchema) !== JSON.stringify(row.json_schema);

    const updated = await query(
      `UPDATE form_types SET
         title = $3, description = $4, json_schema = $5, ui_schema = $6, enabled = $7,
         version = version + $8, updated_at = now()
       WHERE region = $1 AND id = $2 RETURNING *`,
      [
        request.region,
        request.params.id,
        title ?? row.title,
        description ?? row.description,
        JSON.stringify(nextSchema),
        JSON.stringify(uiSchema ?? row.ui_schema),
        enabled ?? row.enabled,
        schemaChanged ? 1 : 0,
      ],
    );
    return toApi(updated.rows[0]);
  });

  app.delete("/regions/:region/form-types/:id", adminGuard, async (request, reply) => {
    const used = await query("SELECT 1 FROM form_submissions WHERE form_type_id = $1 LIMIT 1", [
      request.params.id,
    ]);
    if (used.rows.length) {
      return reply
        .code(409)
        .send({ error: "Form type has submissions; disable it instead of deleting" });
    }
    const deleted = await query(
      "DELETE FROM form_types WHERE region = $1 AND id = $2 RETURNING id",
      [request.region, request.params.id],
    );
    if (!deleted.rows.length) return reply.code(404).send({ error: "Form type not found" });
    return { deleted: true };
  });
}

module.exports = { formTypeRoutes };
