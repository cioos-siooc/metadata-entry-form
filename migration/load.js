#!/usr/bin/env node
// Load migration-data.json (produced by transform.js) into Postgres.
//
// Usage: DATABASE_URL=... CREDENTIALS_ENC_KEY=... node load.js [migration-data.json]
//
// Idempotent: safe to re-run. Users upsert on firebase_uid (falling back to
// an email match), records on (region, firebase_key), saved entities on
// (region, user_id, firebase_key); permissions / projects / credentials /
// generator URLs are replaced per region. Everything runs in a single
// transaction. keycloak_sub stays NULL — server/src/plugins/auth.js
// JIT-links rows by verified email at first Keycloak login.

"use strict";

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
if (!process.env.CREDENTIALS_ENC_KEY) {
  console.error("CREDENTIALS_ENC_KEY is required (to encrypt region credentials)");
  process.exit(1);
}
// server/src/lib/crypto.js requires server/src/config.js, which insists on
// KEYCLOAK_ISSUER even though the migration never talks to Keycloak.
process.env.KEYCLOAK_ISSUER =
  process.env.KEYCLOAK_ISSUER || "http://keycloak.invalid/unused-by-migration";

const { encryptSecret } = require(
  path.join(__dirname, "..", "server", "src", "lib", "crypto"),
);

const warnings = [];
function warn(entry) {
  warnings.push(entry);
  console.warn("WARN:", JSON.stringify(entry));
}

async function upsertUser(client, user) {
  let { email } = user;
  if (!email) {
    // Schema requires an email; keep the account (it owns content) under a
    // recognizable placeholder. auth.js will never JIT-link it — an admin
    // must fix the address manually.
    email = `${user.firebase_uid}@no-email.invalid`;
    warn({
      type: "user_without_email_placeholder",
      firebase_uid: user.firebase_uid,
      placeholder_email: email,
    });
  }

  const byUid = await client.query(
    "SELECT id, email FROM users WHERE firebase_uid = $1",
    [user.firebase_uid],
  );
  if (byUid.rows.length) {
    const row = byUid.rows[0];
    // Only move the email if no OTHER row already owns it (citext unique).
    const emailTaken = await client.query(
      "SELECT id FROM users WHERE email = $1 AND id <> $2",
      [email, row.id],
    );
    if (emailTaken.rows.length) {
      warn({
        type: "email_conflict_kept_existing",
        firebase_uid: user.firebase_uid,
        wanted_email: email,
        kept_email: row.email,
      });
      await client.query(
        "UPDATE users SET display_name = COALESCE($2, display_name) WHERE id = $1",
        [row.id, user.display_name],
      );
    } else {
      await client.query(
        "UPDATE users SET email = $2, display_name = COALESCE($3, display_name) WHERE id = $1",
        [row.id, email, user.display_name],
      );
    }
    return row.id;
  }

  // Fall back to matching an existing row by email (e.g. user already
  // provisioned through Keycloak, or a previous partial run).
  const byEmail = await client.query(
    "SELECT id, firebase_uid FROM users WHERE email = $1",
    [email],
  );
  if (byEmail.rows.length) {
    const row = byEmail.rows[0];
    if (row.firebase_uid && row.firebase_uid !== user.firebase_uid) {
      warn({
        type: "email_owned_by_other_firebase_uid",
        email,
        firebase_uid: user.firebase_uid,
        existing_firebase_uid: row.firebase_uid,
      });
      return row.id; // attach content to the existing account, keep its uid
    }
    await client.query(
      "UPDATE users SET firebase_uid = $2, display_name = COALESCE($3, display_name) WHERE id = $1",
      [row.id, user.firebase_uid, user.display_name],
    );
    return row.id;
  }

  const inserted = await client.query(
    `INSERT INTO users (email, display_name, firebase_uid)
     VALUES ($1, $2, $3) RETURNING id`,
    [email, user.display_name, user.firebase_uid],
  );
  return inserted.rows[0].id;
}

async function upsertEntity(client, table, entity, userId) {
  const existing = await client.query(
    `SELECT id FROM ${table} WHERE region = $1 AND user_id = $2 AND firebase_key = $3`,
    [entity.region, userId, entity.firebase_key],
  );
  if (existing.rows.length) {
    await client.query(
      `UPDATE ${table} SET data = $2, updated_at = now() WHERE id = $1`,
      [existing.rows[0].id, entity.data],
    );
  } else {
    await client.query(
      `INSERT INTO ${table} (region, user_id, data, firebase_key) VALUES ($1, $2, $3, $4)`,
      [entity.region, userId, entity.data, entity.firebase_key],
    );
  }
}

async function main() {
  const dataPath = process.argv[2] || "migration-data.json";
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const stats = {
    users: 0,
    region_users: 0,
    records: 0,
    record_shares: 0,
    contacts: 0,
    platforms: 0,
    instruments: 0,
    permissions: 0,
    projects: 0,
    credentials: 0,
    region_urls: 0,
  };

  try {
    await client.query("BEGIN");

    // ---- Users
    const userIdByUid = new Map();
    for (const user of data.users) {
      const id = await upsertUser(client, user);
      userIdByUid.set(user.firebase_uid, id);
      stats.users += 1;
      for (const region of user.regions || []) {
        await client.query(
          `INSERT INTO region_users (region, user_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [region, id],
        );
        stats.region_users += 1;
      }
    }

    // ---- Records (+ shares)
    for (const rec of data.records) {
      const ownerId = userIdByUid.get(rec.firebase_uid_owner);
      if (!ownerId) {
        warn({
          type: "record_owner_missing_skipped",
          region: rec.region,
          firebase_key: rec.firebase_key,
          firebase_uid_owner: rec.firebase_uid_owner,
        });
        continue;
      }
      const c = rec.columns;
      const res = await client.query(
        `INSERT INTO records
           (region, user_id, status, title_en, title_fr, identifier,
            dataset_identifier, filename, created, time_first_published,
            last_edited_by, data, firebase_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (region, firebase_key) WHERE firebase_key IS NOT NULL
         DO UPDATE SET
           user_id = EXCLUDED.user_id,
           status = EXCLUDED.status,
           title_en = EXCLUDED.title_en,
           title_fr = EXCLUDED.title_fr,
           identifier = EXCLUDED.identifier,
           dataset_identifier = EXCLUDED.dataset_identifier,
           filename = EXCLUDED.filename,
           created = EXCLUDED.created,
           time_first_published = EXCLUDED.time_first_published,
           last_edited_by = EXCLUDED.last_edited_by,
           data = EXCLUDED.data,
           updated_at = now()
         RETURNING id`,
        [
          rec.region,
          ownerId,
          c.status,
          c.title_en,
          c.title_fr,
          c.identifier,
          c.dataset_identifier,
          c.filename,
          c.created,
          c.time_first_published,
          c.last_edited_by ?? {},
          rec.data,
          rec.firebase_key,
        ],
      );
      const recordId = res.rows[0].id;
      stats.records += 1;

      // Replace shares for this record.
      await client.query("DELETE FROM record_shares WHERE record_id = $1", [
        recordId,
      ]);
      for (const uid of rec.shared_with_firebase_uids || []) {
        const shareUserId = userIdByUid.get(uid);
        if (!shareUserId) {
          warn({
            type: "share_unknown_uid_skipped",
            region: rec.region,
            firebase_key: rec.firebase_key,
            shared_with_uid: uid,
          });
          continue;
        }
        if (shareUserId === ownerId) continue; // sharing with yourself is a no-op
        await client.query(
          `INSERT INTO record_shares (record_id, user_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [recordId, shareUserId],
        );
        stats.record_shares += 1;
      }
    }

    // ---- Saved entities
    const entityTables = [
      ["contacts", "saved_contacts"],
      ["platforms", "saved_platforms"],
      ["instruments", "saved_instruments"],
    ];
    for (const [key, table] of entityTables) {
      for (const entity of data[key] || []) {
        const ownerId = userIdByUid.get(entity.firebase_uid_owner);
        if (!ownerId) {
          warn({
            type: "entity_owner_missing_skipped",
            table,
            region: entity.region,
            firebase_key: entity.firebase_key,
            firebase_uid_owner: entity.firebase_uid_owner,
          });
          continue;
        }
        await upsertEntity(client, table, entity, ownerId);
        stats[key] += 1;
      }
    }

    // ---- Admin config: replace per region present in the source admin tree.
    const adminRegions = [
      ...new Set(
        (data.admin_regions && data.admin_regions.length
          ? data.admin_regions
          : [
              ...data.permissions.map((p) => p.region),
              ...data.projects.map((p) => p.region),
              ...data.credentials.map((c) => c.region),
              ...data.region_urls.map((r) => r.region),
            ]),
      ),
    ];

    if (adminRegions.length) {
      await client.query(
        "DELETE FROM region_permissions WHERE region = ANY($1)",
        [adminRegions],
      );
      await client.query("DELETE FROM region_projects WHERE region = ANY($1)", [
        adminRegions,
      ]);
      await client.query(
        "DELETE FROM region_credentials WHERE region = ANY($1)",
        [adminRegions],
      );
      await client.query(
        "UPDATE regions SET record_generator_url = NULL WHERE id = ANY($1)",
        [adminRegions],
      );
    }

    for (const p of data.permissions) {
      await client.query(
        `INSERT INTO region_permissions (region, email, role) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [p.region, p.email, p.role],
      );
      stats.permissions += 1;
    }

    for (const p of data.projects) {
      await client.query(
        `INSERT INTO region_projects (region, name) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [p.region, p.name],
      );
      stats.projects += 1;
    }

    for (const cred of data.credentials) {
      const secretEnc = cred.secret ? encryptSecret(cred.secret) : null;
      if (!cred.secret)
        warn({
          type: "credential_missing_secret",
          region: cred.region,
          kind: cred.kind,
        });
      await client.query(
        `INSERT INTO region_credentials (region, kind, config, secret_enc)
         VALUES ($1, $2, $3, $4)`,
        [cred.region, cred.kind, cred.config ?? {}, secretEnc],
      );
      stats.credentials += 1;
    }

    for (const r of data.region_urls) {
      await client.query(
        "UPDATE regions SET record_generator_url = $2 WHERE id = $1",
        [r.region, r.record_generator_url],
      );
      stats.region_urls += 1;
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }

  console.log("Loaded:", stats);
  if (warnings.length) {
    const warnPath = path.join(
      path.dirname(path.resolve(dataPath)),
      "migration-load-warnings.json",
    );
    fs.writeFileSync(warnPath, JSON.stringify(warnings, null, 2));
    console.warn(`${warnings.length} warning(s) written to ${warnPath}`);
  } else {
    console.log("No load warnings.");
  }
}

main().catch((err) => {
  console.error("Load failed (transaction rolled back):", err);
  process.exit(1);
});
