const { query } = require("../db");

async function meRoutes(app) {
  // Global profile — who am I?
  app.get("/me", { preHandler: [app.authenticate] }, async (request) => {
    const { id, email, display_name: displayName } = request.user;
    return { userID: id, email, displayName };
  });

  // Region-scoped session bootstrap: everything UserProvider needs on load.
  app.get(
    "/regions/:region/me",
    { preHandler: [app.authenticate, app.regionContext] },
    async (request) => {
      const { id, email, display_name: displayName } = request.user;

      const shares = await query(
        "SELECT 1 FROM record_shares s JOIN records r ON r.id = s.record_id WHERE s.user_id = $1 AND r.region = $2 LIMIT 1",
        [id, request.region],
      );

      const datacite = await query(
        "SELECT config FROM region_credentials WHERE region = $1 AND kind = 'datacite'",
        [request.region],
      );

      return {
        userID: id,
        email,
        displayName,
        ...request.roles,
        hasSharedRecords: shares.rows.length > 0,
        datacitePrefix: datacite.rows[0]?.config?.prefix ?? null,
      };
    },
  );
}

module.exports = { meRoutes };
