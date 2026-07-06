const { query, withTransaction } = require("../db");
const { encryptSecret } = require("../lib/crypto");

// Region admin configuration. Replaces the /admin/{region} RTDB subtree.
// Secrets (DataCite hash, GitHub token) are write-only: GET returns presence
// flags, never values.

async function adminRoutes(app) {
  const memberGuard = { preHandler: [app.authenticate, app.regionContext] };
  const adminGuard = { preHandler: [app.authenticate, app.regionContext, app.requireAdmin] };

  // --- permissions ---------------------------------------------------------

  app.get("/regions/:region/admin/permissions", memberGuard, async (request) => {
    const result = await query(
      "SELECT email, role FROM region_permissions WHERE region = $1 ORDER BY email",
      [request.region],
    );
    return {
      admins: result.rows.filter((r) => r.role === "admin").map((r) => r.email),
      reviewers: result.rows.filter((r) => r.role === "reviewer").map((r) => r.email),
    };
  });

  // Admin-only; superadmins pass everywhere, so they seed a new region's
  // first admins (the old "no admins yet" bootstrap rule is gone — it was a
  // takeover risk once regions became creatable at runtime).
  app.put(
    "/regions/:region/admin/permissions",
    adminGuard,
    async (request, reply) => {
      const admins = request.body?.admins;
      const reviewers = request.body?.reviewers;
      if (!Array.isArray(admins) || !Array.isArray(reviewers)) {
        return reply.code(422).send({ error: "admins and reviewers arrays required" });
      }

      await withTransaction(async (client) => {
        await client.query("DELETE FROM region_permissions WHERE region = $1", [request.region]);
        const insert =
          "INSERT INTO region_permissions (region, email, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING";
        for (const email of admins) {
          await client.query(insert, [request.region, email.trim(), "admin"]);
        }
        for (const email of reviewers) {
          await client.query(insert, [request.region, email.trim(), "reviewer"]);
        }
      });

      return { admins, reviewers };
    },
  );

  // --- projects ------------------------------------------------------------

  app.put("/regions/:region/admin/projects", memberGuard, async (request, reply) => {
    // reviewers or admins may edit projects (matches RTDB rule)
    if (!request.roles.isAdmin && !request.roles.isReviewer) {
      return reply.code(403).send({ error: "Reviewer or admin access required" });
    }
    const projects = request.body?.projects;
    if (!Array.isArray(projects)) return reply.code(422).send({ error: "projects array required" });

    await withTransaction(async (client) => {
      await client.query("DELETE FROM region_projects WHERE region = $1", [request.region]);
      for (const name of projects) {
        await client.query(
          "INSERT INTO region_projects (region, name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [request.region, String(name).trim()],
        );
      }
    });
    return { projects };
  });

  // --- DataCite credentials --------------------------------------------------

  app.get("/regions/:region/admin/datacite-credentials", adminGuard, async (request) => {
    const result = await query(
      "SELECT config, secret_enc IS NOT NULL AS has_credentials FROM region_credentials WHERE region = $1 AND kind = 'datacite'",
      [request.region],
    );
    const row = result.rows[0];
    return {
      prefix: row?.config?.prefix ?? "",
      apiDomain: row?.config?.apiDomain ?? "api.datacite.org",
      hasCredentials: row?.has_credentials ?? false,
    };
  });

  app.put("/regions/:region/admin/datacite-credentials", adminGuard, async (request, reply) => {
    const { prefix, apiDomain, dataciteHash } = request.body || {};
    if (!prefix || !dataciteHash) {
      return reply.code(422).send({ error: "prefix and dataciteHash required" });
    }
    await query(
      `INSERT INTO region_credentials (region, kind, config, secret_enc, updated_at, updated_by)
       VALUES ($1, 'datacite', $2, $3, now(), $4)
       ON CONFLICT (region, kind)
       DO UPDATE SET config = $2, secret_enc = $3, updated_at = now(), updated_by = $4`,
      [
        request.region,
        JSON.stringify({ prefix, apiDomain: apiDomain || "api.datacite.org" }),
        encryptSecret(dataciteHash),
        request.user.id,
      ],
    );
    return { saved: true };
  });

  app.delete("/regions/:region/admin/datacite-credentials", adminGuard, async (request) => {
    await query("DELETE FROM region_credentials WHERE region = $1 AND kind = 'datacite'", [
      request.region,
    ]);
    return { deleted: true };
  });

  // --- GitHub credentials ----------------------------------------------------

  app.get("/regions/:region/admin/github-credentials", memberGuard, async (request, reply) => {
    // reviewers need the target repo info to publish (matches RTDB rule)
    if (!request.roles.isAdmin && !request.roles.isReviewer) {
      return reply.code(403).send({ error: "Reviewer or admin access required" });
    }
    const result = await query(
      "SELECT config, secret_enc IS NOT NULL AS has_token FROM region_credentials WHERE region = $1 AND kind = 'github'",
      [request.region],
    );
    const row = result.rows[0];
    return {
      owner: row?.config?.owner ?? "",
      repo: row?.config?.repo ?? "",
      branch: row?.config?.branch ?? "main",
      environment: row?.config?.environment ?? "",
      fileTemplate: row?.config?.fileTemplate ?? "",
      hasToken: row?.has_token ?? false,
    };
  });

  app.put("/regions/:region/admin/github-credentials", adminGuard, async (request, reply) => {
    const { owner, repo, branch, environment, fileTemplate, token } = request.body || {};
    if (!owner || !repo) return reply.code(422).send({ error: "owner and repo required" });

    // Token optional on update: keep the existing one unless a new one is sent.
    const existing = await query(
      "SELECT secret_enc FROM region_credentials WHERE region = $1 AND kind = 'github'",
      [request.region],
    );
    const secretEnc = token ? encryptSecret(token) : (existing.rows[0]?.secret_enc ?? null);
    if (!secretEnc) return reply.code(422).send({ error: "token required" });

    await query(
      `INSERT INTO region_credentials (region, kind, config, secret_enc, updated_at, updated_by)
       VALUES ($1, 'github', $2, $3, now(), $4)
       ON CONFLICT (region, kind)
       DO UPDATE SET config = $2, secret_enc = $3, updated_at = now(), updated_by = $4`,
      [
        request.region,
        JSON.stringify({
          owner,
          repo,
          branch: branch || "main",
          environment: environment || "",
          fileTemplate: fileTemplate || "",
        }),
        secretEnc,
        request.user.id,
      ],
    );
    return { saved: true };
  });

  app.delete("/regions/:region/admin/github-credentials", adminGuard, async (request) => {
    await query("DELETE FROM region_credentials WHERE region = $1 AND kind = 'github'", [
      request.region,
    ]);
    return { deleted: true };
  });

  // --- record generator URL --------------------------------------------------

  app.get("/regions/:region/admin/record-generator-url", adminGuard, async (request) => {
    const result = await query("SELECT record_generator_url FROM regions WHERE id = $1", [
      request.region,
    ]);
    return { url: result.rows[0]?.record_generator_url ?? null };
  });

  app.put("/regions/:region/admin/record-generator-url", adminGuard, async (request) => {
    await query("UPDATE regions SET record_generator_url = $2 WHERE id = $1", [
      request.region,
      request.body?.url || null,
    ]);
    return { url: request.body?.url || null };
  });
}

module.exports = { adminRoutes };
