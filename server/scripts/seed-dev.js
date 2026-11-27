// Seeds dev users + roles so the docker-compose dev stack works out of the box.
// Creates local password accounts (email + password "password", pre-verified)
// for author/reviewer/admin and grants reviewer/admin their region roles in
// every region (admin is additionally a superadmin via SUPERADMIN_EMAILS in
// docker-compose.dev.yml). Idempotent; refuses to run outside development.
const { Pool } = require("pg");
const argon2 = require("@node-rs/argon2");

const DEV_PASSWORD = process.env.SEED_DEV_PASSWORD || "password";

const SEED_USERS = [
  { email: "author@example.org", name: "Dev Author" },
  { email: "reviewer@example.org", name: "Dev Reviewer" },
  { email: "admin@example.org", name: "Dev Admin" },
];

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
    const passwordHash = await argon2.hash(DEV_PASSWORD);
    for (const { email, name } of SEED_USERS) {
      const row = await pool.query(
        `INSERT INTO users (email, display_name, password_hash, email_verified)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, email_verified = true
         RETURNING id`,
        [email, name, passwordHash],
      );
      await pool.query(
        `INSERT INTO user_identities (user_id, provider, provider_subject, email)
         VALUES ($1, 'local', $2, $3) ON CONFLICT (provider, provider_subject) DO NOTHING`,
        [row.rows[0].id, row.rows[0].id, email],
      );
    }

    const regions = await pool.query("SELECT id FROM regions");
    for (const { id: region } of regions.rows) {
      for (const { email, role } of SEED_ROLES) {
        await pool.query(
          "INSERT INTO region_permissions (region, email, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [region, email, role],
        );
      }
    }
    console.log(
      `Seeded ${SEED_USERS.length} dev users (password "${DEV_PASSWORD}") and roles in ${regions.rows.length} regions.`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
