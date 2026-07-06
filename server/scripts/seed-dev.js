// Seeds the dev Keycloak users' roles so the docker-compose dev stack works
// out of the box: dev-reviewer reviews and dev-admin administers every region
// (dev-admin is additionally a superadmin via SUPERADMIN_EMAILS in
// docker-compose.dev.yml). Idempotent; refuses to run outside development.
const { Pool } = require("pg");

const SEED_ROLES = [
  { email: "reviewer@example.org", role: "reviewer" },
  { email: "admin@example.org", role: "admin" },
];

async function main() {
  if (process.env.NODE_ENV !== "development") {
    console.error("seed-dev.js only runs with NODE_ENV=development; refusing.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const regions = await pool.query("SELECT id FROM regions");
    for (const { id: region } of regions.rows) {
      for (const { email, role } of SEED_ROLES) {
        await pool.query(
          "INSERT INTO region_permissions (region, email, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [region, email, role],
        );
      }
    }
    console.log(`Seeded dev roles in ${regions.rows.length} regions.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
