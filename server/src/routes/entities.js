const { query } = require("../db");

// Per-user reusable entities: saved contacts, platforms, instruments.
// Replaces src/utils/firebase{Contact,Platform,Instrument}Functions.js and the
// save-to-profile handlers in MetadataForm.jsx.
//
// Reads are open to region members (reviewers load the record editor's saved
// entities); writes are self-or-reviewer.

const KINDS = {
  contacts: "saved_contacts",
  platforms: "saved_platforms",
  instruments: "saved_instruments",
};

function canWrite(request, ownerId) {
  return (
    request.user.id === ownerId || request.roles.isReviewer || request.roles.isAdmin
  );
}

async function entityRoutes(app) {
  const guarded = { preHandler: [app.authenticate, app.regionContext] };

  Object.entries(KINDS).forEach(([kind, table]) => {
    const base = `/regions/:region/users/:userId/${kind}`;

    // Keyed object {id: entity}, the shape the frontend components expect.
    app.get(base, guarded, async (request) => {
      const result = await query(
        `SELECT id, data FROM ${table} WHERE region = $1 AND user_id = $2 ORDER BY updated_at`,
        [request.region, request.params.userId],
      );
      return Object.fromEntries(result.rows.map((r) => [r.id, r.data]));
    });

    app.get(`${base}/:id`, guarded, async (request, reply) => {
      const result = await query(
        `SELECT id, data FROM ${table} WHERE region = $1 AND user_id = $2 AND id = $3`,
        [request.region, request.params.userId, request.params.id],
      );
      if (!result.rows.length) return reply.code(404).send({ error: "Not found" });
      return result.rows[0].data;
    });

    app.post(base, guarded, async (request, reply) => {
      if (!canWrite(request, request.params.userId)) {
        return reply.code(403).send({ error: "Not allowed" });
      }
      const result = await query(
        `INSERT INTO ${table} (region, user_id, data) VALUES ($1, $2, $3) RETURNING id`,
        [request.region, request.params.userId, JSON.stringify(request.body || {})],
      );
      return reply.code(201).send({ id: result.rows[0].id });
    });

    app.put(`${base}/:id`, guarded, async (request, reply) => {
      if (!canWrite(request, request.params.userId)) {
        return reply.code(403).send({ error: "Not allowed" });
      }
      const result = await query(
        `UPDATE ${table} SET data = $4, updated_at = now()
         WHERE region = $1 AND user_id = $2 AND id = $3 RETURNING id`,
        [
          request.region,
          request.params.userId,
          request.params.id,
          JSON.stringify(request.body || {}),
        ],
      );
      if (!result.rows.length) return reply.code(404).send({ error: "Not found" });
      return { id: result.rows[0].id };
    });

    app.delete(`${base}/:id`, guarded, async (request, reply) => {
      if (!canWrite(request, request.params.userId)) {
        return reply.code(403).send({ error: "Not allowed" });
      }
      const result = await query(
        `DELETE FROM ${table} WHERE region = $1 AND user_id = $2 AND id = $3 RETURNING id`,
        [request.region, request.params.userId, request.params.id],
      );
      if (!result.rows.length) return reply.code(404).send({ error: "Not found" });
      return { deleted: true };
    });

    // cloneContact / clonePlatform / cloneInstrument replacement.
    app.post(`${base}/:id/clone`, guarded, async (request, reply) => {
      if (!canWrite(request, request.params.userId)) {
        return reply.code(403).send({ error: "Not allowed" });
      }
      const result = await query(
        `INSERT INTO ${table} (region, user_id, data)
         SELECT region, user_id, data FROM ${table}
         WHERE region = $1 AND user_id = $2 AND id = $3
         RETURNING id`,
        [request.region, request.params.userId, request.params.id],
      );
      if (!result.rows.length) return reply.code(404).send({ error: "Not found" });
      return reply.code(201).send({ id: result.rows[0].id });
    });
  });

  // Region user directory (share/transfer pickers). Replaces loadRegionUsers
  // without leaking whole user record trees.
  app.get("/regions/:region/users", guarded, async (request) => {
    const result = await query(
      `SELECT u.id, u.email, u.display_name FROM users u
       JOIN region_users ru ON ru.user_id = u.id
       WHERE ru.region = $1 ORDER BY u.display_name`,
      [request.region],
    );
    return result.rows.map((r) => ({
      userID: r.id,
      email: r.email,
      displayName: r.display_name,
    }));
  });

  // Region project list (getRegionProjects replacement; write side is admin).
  app.get("/regions/:region/projects", guarded, async (request) => {
    const result = await query(
      "SELECT name FROM region_projects WHERE region = $1 ORDER BY name",
      [request.region],
    );
    return result.rows.map((r) => r.name);
  });
}

module.exports = { entityRoutes };
