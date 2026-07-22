const fastify = require("fastify");
const config = require("./config");
const { pool } = require("./db");
const { authPlugin } = require("./plugins/auth");
const { regionContextPlugin } = require("./plugins/regionContext");
const { authRoutes } = require("./routes/auth");
const { meRoutes } = require("./routes/me");
const { recordRoutes } = require("./routes/records");
const { entityRoutes } = require("./routes/entities");
const { adminRoutes } = require("./routes/admin");
const { superadminRoutes } = require("./routes/superadmin");
const { regionRoutes } = require("./routes/regions");
const { formTypeRoutes } = require("./routes/formTypes");
const { formSubmissionRoutes } = require("./routes/formSubmissions");
const { serviceRoutes } = require("./routes/services");
const { recordExportRoutes } = require("./routes/recordExport");

// Builds the Fastify app. Options let tests inject overrides (e.g. a local
// JWKS keypair + issuer/audience for the token verifier).
function buildApp(opts = {}) {
  const app = fastify({
    logger: opts.logger ?? { level: config.logLevel },
  });

  app.get("/api/health", async () => {
    await pool.query("SELECT 1");
    return { status: "ok" };
  });

  app.register(authPlugin, opts.auth || {});
  app.register(regionContextPlugin);
  app.register(
    async (api) => {
      api.register(authRoutes);
      api.register(meRoutes);
      api.register(recordRoutes);
      api.register(entityRoutes);
      api.register(adminRoutes);
      api.register(superadminRoutes);
      api.register(regionRoutes);
      api.register(formTypeRoutes);
      api.register(formSubmissionRoutes);
      api.register(serviceRoutes);
      api.register(recordExportRoutes);
    },
    { prefix: "/api/v1" },
  );

  return app;
}

module.exports = { buildApp };
