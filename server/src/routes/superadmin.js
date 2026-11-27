const config = require("../config");
const { query, withTransaction } = require("../db");

// Global superadmin management. Emails from the SUPERADMIN_EMAILS env var are
// reported separately and cannot be revoked here — unset the env var instead.

async function superadminRoutes(app) {
  const guard = { preHandler: [app.authenticate, app.requireSuperadmin] };

  app.get("/superadmins", guard, async () => {
    const result = await query("SELECT email FROM superadmins ORDER BY email");
    return {
      superadmins: result.rows.map((r) => r.email),
      envSuperadmins: config.superadminEmails,
    };
  });

  // List replace, mirroring the region permissions endpoint.
  app.put("/superadmins", guard, async (request, reply) => {
    const superadmins = request.body?.superadmins;
    if (!Array.isArray(superadmins)) {
      return reply.code(422).send({ error: "superadmins array required" });
    }

    await withTransaction(async (client) => {
      await client.query("DELETE FROM superadmins");
      for (const email of superadmins) {
        await client.query(
          "INSERT INTO superadmins (email, created_by) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [String(email).trim(), request.user.id],
        );
      }
    });

    return { superadmins, envSuperadmins: config.superadminEmails };
  });
}

module.exports = { superadminRoutes };
