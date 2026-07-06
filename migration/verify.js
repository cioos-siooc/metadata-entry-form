#!/usr/bin/env node
// Verify a load: compare Postgres contents against migration-data.json.
//
// Usage: DATABASE_URL=... [CREDENTIALS_ENC_KEY=...] node verify.js [migration-data.json]
//
// (a) counts per region/status and per entity type vs the source;
// (b) deep-diff of every published record plus a deterministic ~10% sample
//     of the rest — both sides pushed through the same normalization
//     (recordSerializer toApi) so only real divergence is reported;
// (c) summary table. Exits non-zero on any mismatch.

"use strict";

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const { toApi } = require(
  path.join(__dirname, "..", "server", "src", "lib", "recordSerializer"),
);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

// Optional: only needed to verify credential secrets round-trip.
let decryptSecret = null;
if (process.env.CREDENTIALS_ENC_KEY) {
  process.env.KEYCLOAK_ISSUER =
    process.env.KEYCLOAK_ISSUER || "http://keycloak.invalid/unused-by-migration";
  ({ decryptSecret } = require(
    path.join(__dirname, "..", "server", "src", "lib", "crypto"),
  ));
}

const failures = [];
function fail(entry) {
  failures.push(entry);
  console.error("MISMATCH:", JSON.stringify(entry));
}

function normalizeTimestamp(v) {
  if (!v) return v;
  const t = Date.parse(v);
  return Number.isNaN(t) ? v : new Date(t).toISOString();
}

// Recursive diff returning [{path, source, db}] entries.
function deepDiff(a, b, prefix = "") {
  if (a === b) return [];
  const ta = Object.prototype.toString.call(a);
  const tb = Object.prototype.toString.call(b);
  if (ta !== tb) return [{ path: prefix || "(root)", source: a, db: b }];
  if (Array.isArray(a)) {
    const diffs = [];
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i += 1)
      diffs.push(...deepDiff(a[i], b[i], `${prefix}[${i}]`));
    return diffs;
  }
  if (a && typeof a === "object") {
    const diffs = [];
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
      diffs.push(...deepDiff(a[key], b[key], prefix ? `${prefix}.${key}` : key));
    return diffs;
  }
  return [{ path: prefix || "(root)", source: a, db: b }];
}

function apiShapeForDiff(row) {
  const record = toApi(row);
  // DB-generated / load-time fields that legitimately differ from the source.
  delete record.recordID;
  delete record.userID;
  delete record.updatedAt;
  record.created = normalizeTimestamp(record.created);
  record.timeFirstPublished = normalizeTimestamp(record.timeFirstPublished);
  return record;
}

async function main() {
  const dataPath = process.argv[2] || "migration-data.json";
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const summary = [];

  try {
    // ---------- (a) counts ----------

    // Records per region per status.
    const srcRecordCounts = new Map();
    for (const rec of data.records) {
      const key = `${rec.region}/${rec.columns.status}`;
      srcRecordCounts.set(key, (srcRecordCounts.get(key) || 0) + 1);
    }
    const dbRecordCounts = new Map();
    const recRes = await client.query(
      `SELECT region, status::text AS status, count(*)::int AS n
       FROM records WHERE firebase_key IS NOT NULL GROUP BY 1, 2`,
    );
    for (const r of recRes.rows)
      dbRecordCounts.set(`${r.region}/${r.status}`, r.n);
    for (const key of new Set([...srcRecordCounts.keys(), ...dbRecordCounts.keys()])) {
      const src = srcRecordCounts.get(key) || 0;
      const db = dbRecordCounts.get(key) || 0;
      summary.push({ check: `records ${key}`, source: src, db, ok: src === db });
      if (src !== db) fail({ type: "record_count", key, source: src, db });
    }

    // Saved entities per region.
    const entityTables = [
      ["contacts", "saved_contacts"],
      ["platforms", "saved_platforms"],
      ["instruments", "saved_instruments"],
    ];
    for (const [key, table] of entityTables) {
      const srcCounts = new Map();
      for (const e of data[key] || [])
        srcCounts.set(e.region, (srcCounts.get(e.region) || 0) + 1);
      const res = await client.query(
        `SELECT region, count(*)::int AS n FROM ${table}
         WHERE firebase_key IS NOT NULL GROUP BY 1`,
      );
      const dbCounts = new Map(res.rows.map((r) => [r.region, r.n]));
      for (const region of new Set([...srcCounts.keys(), ...dbCounts.keys()])) {
        const src = srcCounts.get(region) || 0;
        const db = dbCounts.get(region) || 0;
        summary.push({ check: `${table} ${region}`, source: src, db, ok: src === db });
        if (src !== db) fail({ type: "entity_count", table, region, source: src, db });
      }
    }

    // Users: every source firebase_uid must exist.
    const srcUids = data.users.map((u) => u.firebase_uid);
    const userRes = await client.query(
      "SELECT firebase_uid, id, email FROM users WHERE firebase_uid = ANY($1)",
      [srcUids],
    );
    const userByUid = new Map(userRes.rows.map((r) => [r.firebase_uid, r]));
    summary.push({
      check: "users (by firebase_uid)",
      source: srcUids.length,
      db: userByUid.size,
      ok: userByUid.size === srcUids.length,
    });
    for (const uid of srcUids)
      if (!userByUid.has(uid)) fail({ type: "user_missing", firebase_uid: uid });

    // Permissions per region (set equality).
    const srcPerms = new Set(
      data.permissions.map((p) => `${p.region}|${p.email}|${p.role}`),
    );
    const permRegions = [...new Set(data.permissions.map((p) => p.region))];
    const permRes = permRegions.length
      ? await client.query(
          "SELECT region, email::text AS email, role::text AS role FROM region_permissions WHERE region = ANY($1)",
          [permRegions],
        )
      : { rows: [] };
    const dbPerms = new Set(
      permRes.rows.map((p) => `${p.region}|${p.email.toLowerCase()}|${p.role}`),
    );
    summary.push({
      check: "region_permissions",
      source: srcPerms.size,
      db: dbPerms.size,
      ok: srcPerms.size === dbPerms.size,
    });
    for (const p of srcPerms)
      if (!dbPerms.has(p)) fail({ type: "permission_missing", entry: p });
    for (const p of dbPerms)
      if (!srcPerms.has(p)) fail({ type: "permission_unexpected", entry: p });

    // Projects per region (set equality).
    const srcProjects = new Set(data.projects.map((p) => `${p.region}|${p.name}`));
    const projRegions = [...new Set(data.projects.map((p) => p.region))];
    const projRes = projRegions.length
      ? await client.query(
          "SELECT region, name FROM region_projects WHERE region = ANY($1)",
          [projRegions],
        )
      : { rows: [] };
    const dbProjects = new Set(projRes.rows.map((p) => `${p.region}|${p.name}`));
    summary.push({
      check: "region_projects",
      source: srcProjects.size,
      db: dbProjects.size,
      ok: srcProjects.size === dbProjects.size,
    });
    for (const p of srcProjects)
      if (!dbProjects.has(p)) fail({ type: "project_missing", entry: p });
    for (const p of dbProjects)
      if (!srcProjects.has(p)) fail({ type: "project_unexpected", entry: p });

    // Credentials: config always; secret round-trip if the key is available.
    for (const cred of data.credentials) {
      const res = await client.query(
        "SELECT config, secret_enc FROM region_credentials WHERE region = $1 AND kind = $2",
        [cred.region, cred.kind],
      );
      if (!res.rows.length) {
        fail({ type: "credential_missing", region: cred.region, kind: cred.kind });
        continue;
      }
      const row = res.rows[0];
      const cfgDiffs = deepDiff(cred.config ?? {}, row.config ?? {});
      if (cfgDiffs.length)
        fail({ type: "credential_config", region: cred.region, kind: cred.kind, diffs: cfgDiffs });
      if (cred.secret) {
        if (!row.secret_enc) {
          fail({ type: "credential_secret_missing", region: cred.region, kind: cred.kind });
        } else if (decryptSecret) {
          const plain = decryptSecret(row.secret_enc);
          if (plain !== cred.secret)
            fail({ type: "credential_secret_mismatch", region: cred.region, kind: cred.kind });
        }
      }
    }
    summary.push({
      check: `region_credentials${decryptSecret ? " (incl. secrets)" : " (config only)"}`,
      source: data.credentials.length,
      db: data.credentials.length - failures.filter((f) => String(f.type).startsWith("credential")).length,
      ok: !failures.some((f) => String(f.type).startsWith("credential")),
    });

    // Record generator URLs.
    for (const r of data.region_urls) {
      const res = await client.query(
        "SELECT record_generator_url FROM regions WHERE id = $1",
        [r.region],
      );
      const db = res.rows[0]?.record_generator_url ?? null;
      if (db !== r.record_generator_url)
        fail({ type: "region_url", region: r.region, source: r.record_generator_url, db });
    }
    summary.push({
      check: "region record_generator_url",
      source: data.region_urls.length,
      db: data.region_urls.length - failures.filter((f) => f.type === "region_url").length,
      ok: !failures.some((f) => f.type === "region_url"),
    });

    // ---------- (b) deep-diff sample ----------

    const published = data.records.filter((r) => r.columns.status === "published");
    const others = data.records
      .filter((r) => r.columns.status !== "published")
      .sort((a, b) =>
        `${a.region}/${a.firebase_key}`.localeCompare(`${b.region}/${b.firebase_key}`),
      )
      // deterministic ~10% sample: sorted, every 10th — no randomness
      .filter((_, i) => i % 10 === 0);
    const sample = [...published, ...others];

    let diffed = 0;
    let diffFailures = 0;
    for (const rec of sample) {
      const res = await client.query(
        "SELECT * FROM records WHERE region = $1 AND firebase_key = $2",
        [rec.region, rec.firebase_key],
      );
      if (!res.rows.length) {
        fail({ type: "record_missing", region: rec.region, firebase_key: rec.firebase_key });
        diffFailures += 1;
        continue;
      }
      const row = res.rows[0];
      const c = rec.columns;
      // Source side: rebuild the same DB-row shape from migration-data
      // (fromApi output), then push BOTH sides through toApi.
      const sourceRow = {
        id: row.id,
        user_id: row.user_id,
        status: c.status,
        title_en: c.title_en,
        title_fr: c.title_fr,
        identifier: c.identifier,
        dataset_identifier: c.dataset_identifier,
        filename: c.filename,
        created: c.created,
        time_first_published: c.time_first_published,
        last_edited_by: c.last_edited_by,
        updated_at: null,
        data: rec.data,
      };
      const srcApi = apiShapeForDiff(sourceRow);
      const dbApi = apiShapeForDiff(row);
      const diffs = deepDiff(srcApi, dbApi);
      diffed += 1;
      if (diffs.length) {
        diffFailures += 1;
        fail({
          type: "record_diff",
          region: rec.region,
          firebase_key: rec.firebase_key,
          diffs: diffs.slice(0, 20),
        });
      }

      // Shares for the sampled record: expected = source uids that resolve to
      // a user (unknown uids were warn-skipped at load) minus the owner.
      const expectedShares = new Set(
        (rec.shared_with_firebase_uids || [])
          .filter((uid) => userByUid.has(uid))
          .filter((uid) => userByUid.get(uid).id !== row.user_id),
      );
      const shareRes = await client.query(
        `SELECT u.firebase_uid FROM record_shares rs
         JOIN users u ON u.id = rs.user_id WHERE rs.record_id = $1`,
        [row.id],
      );
      const dbShares = new Set(shareRes.rows.map((r) => r.firebase_uid));
      const shareDiffs = deepDiff([...expectedShares].sort(), [...dbShares].sort());
      if (shareDiffs.length) {
        diffFailures += 1;
        fail({
          type: "record_shares_diff",
          region: rec.region,
          firebase_key: rec.firebase_key,
          source: [...expectedShares].sort(),
          db: [...dbShares].sort(),
        });
      }
    }
    summary.push({
      check: `record deep-diff (${published.length} published + ${others.length} sampled)`,
      source: sample.length,
      db: diffed - diffFailures,
      ok: diffFailures === 0,
    });

    // ---------- (c) summary ----------
    console.log("");
    console.table(
      summary.map((s) => ({ ...s, ok: s.ok ? "OK" : "FAIL" })),
    );
  } finally {
    await client.end();
  }

  if (failures.length) {
    console.error(`\nVERIFY FAILED: ${failures.length} mismatch(es).`);
    process.exit(1);
  }
  console.log("\nVERIFY PASSED: Postgres matches the source export.");
}

main().catch((err) => {
  console.error("Verify errored:", err);
  process.exit(1);
});
