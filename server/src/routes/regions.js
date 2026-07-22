const { query } = require("../db");

// Runtime region (tenant) management. The public GET feeds the region
// selector pre-login; writes are superadmin-only. Regions are never deleted
// (FKs from records/permissions everywhere) — hide one by setting
// showInRegionSelector: false in its config.

const REGION_ID_PATTERN = /^[a-z0-9-]+$/;

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function regionRoutes(app) {
  const superadminGuard = { preHandler: [app.authenticate, app.requireSuperadmin] };

  // Public: display config only, never record_generator_url or credentials.
  app.get("/regions", async () => {
    const result = await query("SELECT id, config FROM regions ORDER BY id");
    return {
      regions: Object.fromEntries(result.rows.map((r) => [r.id, r.config])),
    };
  });

  app.post("/regions", superadminGuard, async (request, reply) => {
    const { id, config } = request.body || {};
    if (typeof id !== "string" || !REGION_ID_PATTERN.test(id)) {
      return reply
        .code(422)
        .send({ error: "id must contain only lowercase letters, digits, and hyphens" });
    }
    if (!isPlainObject(config)) {
      return reply.code(422).send({ error: "config object required" });
    }

    const inserted = await query(
      "INSERT INTO regions (id, config) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id",
      [id, config],
    );
    if (!inserted.rows.length) {
      return reply.code(409).send({ error: `Region ${id} already exists` });
    }
    return reply.code(201).send({ id, config });
  });

  app.put("/regions/:id", superadminGuard, async (request, reply) => {
    const { id } = request.params;
    const config = request.body?.config;
    if (!isPlainObject(config)) {
      return reply.code(422).send({ error: "config object required" });
    }

    const updated = await query("UPDATE regions SET config = $2 WHERE id = $1 RETURNING id", [
      id,
      config,
    ]);
    if (!updated.rows.length) {
      return reply.code(404).send({ error: `Unknown region: ${id}` });
    }
    return { id, config };
  });
}

module.exports = { regionRoutes };
