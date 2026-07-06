const fp = require("fastify-plugin");
const { query } = require("../db");

// Validates the :region param, loads the caller's region roles, and records
// region membership (replaces the userinfo write UserProvider did on login).
async function regionContextPlugin(app) {
  app.decorateRequest("region", null);
  app.decorateRequest("roles", null);

  app.decorate("regionContext", async (request, reply) => {
    const { region } = request.params;

    const regionRow = await query("SELECT id FROM regions WHERE id = $1", [region]);
    if (!regionRow.rows.length) {
      return reply.code(404).send({ error: `Unknown region: ${region}` });
    }

    await query(
      `INSERT INTO region_users (region, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [region, request.user.id],
    );

    const roleRows = await query(
      "SELECT role FROM region_permissions WHERE region = $1 AND email = $2",
      [region, request.user.email],
    );
    const roles = roleRows.rows.map((r) => r.role);

    request.region = region;
    request.roles = {
      isAdmin: request.isSuperadmin || roles.includes("admin"),
      isReviewer: request.isSuperadmin || roles.includes("reviewer"),
    };
    return undefined;
  });

  app.decorate("requireAdmin", async (request, reply) => {
    if (!request.roles?.isAdmin) {
      return reply.code(403).send({ error: "Admin access required" });
    }
    return undefined;
  });

  app.decorate("requireReviewerOrAdmin", async (request, reply) => {
    if (!request.roles?.isAdmin && !request.roles?.isReviewer) {
      return reply.code(403).send({ error: "Reviewer or admin access required" });
    }
    return undefined;
  });
}

module.exports = { regionContextPlugin: fp(regionContextPlugin) };
