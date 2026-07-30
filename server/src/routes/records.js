const crypto = require("crypto");
const { query, withTransaction } = require("../db");
const { toApi, fromApi, STATUS_TO_DB } = require("../lib/recordSerializer");
const { getRecordFilename } = require("../lib/blankRecord");
const { fireRecordChange } = require("../services/recordHooks");

async function loadRecordRow(region, id) {
  const result = await query("SELECT * FROM records WHERE region = $1 AND id = $2", [region, id]);
  return result.rows[0] || null;
}

async function loadSharedWith(recordId) {
  const result = await query("SELECT user_id FROM record_shares WHERE record_id = $1", [recordId]);
  if (!result.rows.length) return null;
  return Object.fromEntries(result.rows.map((r) => [r.user_id, true]));
}

async function canWriteRecord(request, row) {
  if (row.user_id === request.user.id) return true;
  if (request.roles.isReviewer || request.roles.isAdmin) return true;
  const share = await query(
    "SELECT 1 FROM record_shares WHERE record_id = $1 AND user_id = $2",
    [row.id, request.user.id],
  );
  return share.rows.length > 0;
}

async function userinfoFor(userId) {
  const result = await query("SELECT id, email, display_name FROM users WHERE id = $1", [userId]);
  const row = result.rows[0];
  if (!row) return null;
  return { userID: row.id, email: row.email, displayName: row.display_name };
}

const RECORD_COLUMNS =
  "(region, user_id, status, title_en, title_fr, identifier, dataset_identifier, filename, created, time_first_published, last_edited_by, data, client_record_id)";
const RECORD_VALUES = "($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)";

function insertParams(region, userId, columns, data) {
  return [
    region,
    userId,
    columns.status,
    columns.title_en,
    columns.title_fr,
    columns.identifier,
    columns.dataset_identifier,
    columns.filename,
    columns.created,
    columns.time_first_published,
    JSON.stringify(columns.last_edited_by),
    JSON.stringify(data),
    columns.client_record_id,
  ];
}

async function recordRoutes(app) {
  const guarded = { preHandler: [app.authenticate, app.regionContext] };

  // List region records, optionally filtered by owner and status.
  // ?ownerId=me|<uuid>  ?status=,submitted,published (API-shape statuses)
  app.get("/regions/:region/records", guarded, async (request) => {
    const { ownerId, status } = request.query;

    const conditions = ["r.region = $1"];
    const params = [request.region];

    if (ownerId) {
      params.push(ownerId === "me" ? request.user.id : ownerId);
      conditions.push(`r.user_id = $${params.length}`);
    }
    if (status !== undefined) {
      const dbStatuses = String(status)
        .split(",")
        .map((s) => STATUS_TO_DB[s.trim()])
        .filter(Boolean);
      params.push(dbStatuses);
      conditions.push(`r.status = ANY($${params.length}::record_status[])`);
    }

    const result = await query(
      `SELECT r.*, u.email AS owner_email, u.display_name AS owner_name
       FROM records r JOIN users u ON u.id = r.user_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY r.created DESC`,
      params,
    );

    return result.rows.map((row) =>
      toApi(row, {
        userinfo: { userID: row.user_id, email: row.owner_email, displayName: row.owner_name },
      }),
    );
  });

  // Records other users shared with me.
  app.get("/regions/:region/records/shared-with-me", guarded, async (request) => {
    const result = await query(
      `SELECT r.*, u.email AS owner_email, u.display_name AS owner_name
       FROM record_shares s
       JOIN records r ON r.id = s.record_id
       JOIN users u ON u.id = r.user_id
       WHERE s.user_id = $1 AND r.region = $2
       ORDER BY r.created DESC`,
      [request.user.id, request.region],
    );
    return result.rows.map((row) =>
      toApi(row, {
        userinfo: { userID: row.user_id, email: row.owner_email, displayName: row.owner_name },
      }),
    );
  });

  app.get("/regions/:region/records/:id", guarded, async (request, reply) => {
    const row = await loadRecordRow(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Record not found" });
    return toApi(row, {
      sharedWith: await loadSharedWith(row.id),
      userinfo: await userinfoFor(row.user_id),
    });
  });

  app.post("/regions/:region/records", guarded, async (request, reply) => {
    const { columns, data } = fromApi(request.body || {});

    // Idempotent when the client supplies a key, which an offline client must:
    // a create retried after a lost response would otherwise duplicate the
    // record. Deliberately DO NOTHING rather than DO UPDATE — a replayed
    // create must never clobber edits the server has already accepted from
    // another device.
    const result = await query(
      `INSERT INTO records ${RECORD_COLUMNS} VALUES ${RECORD_VALUES}
       ON CONFLICT (region, user_id, client_record_id) WHERE client_record_id IS NOT NULL
       DO NOTHING
       RETURNING *`,
      insertParams(request.region, request.user.id, columns, data),
    );

    if (!result.rows.length) {
      // The key already exists, so this is a replay. Return the record we
      // already have, as 200 rather than 201 so the client can tell the
      // difference, and skip the hooks below — re-firing them would re-send
      // reviewer notification emails and regenerate the WAF XML.
      const existing = await query(
        `SELECT * FROM records WHERE region = $1 AND user_id = $2 AND client_record_id = $3`,
        [request.region, request.user.id, columns.client_record_id],
      );
      if (!existing.rows.length) {
        // Conflicted against a row we cannot then read: only possible if the
        // owner changed between the two statements.
        return reply.code(409).send({ error: "Record already exists" });
      }
      return reply.code(200).send(toApi(existing.rows[0]));
    }

    const row = result.rows[0];

    if (row.status !== "draft") {
      fireRecordChange(request.log, {
        region: request.region,
        record: toApi(row),
        before: null,
        after: { status: row.status },
        kind: "create",
      });
    }
    return reply.code(201).send(toApi(row));
  });

  app.put("/regions/:region/records/:id", guarded, async (request, reply) => {
    const row = await loadRecordRow(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Record not found" });
    if (!(await canWriteRecord(request, row))) {
      return reply.code(403).send({ error: "Not allowed to edit this record" });
    }

    // Optimistic concurrency: client sends the updated_at it loaded.
    const expected = request.headers["if-unmodified-since"];
    if (expected && new Date(expected).getTime() !== new Date(row.updated_at).getTime()) {
      return reply.code(409).send({ error: "Record was changed by someone else" });
    }

    const { columns, data } = fromApi(request.body || {});

    // Publishing is reviewer-only; status changes via PUT are otherwise
    // allowed (e.g. demotion to draft on incomplete edit).
    if (
      columns.status === "published" &&
      row.status !== "published" &&
      !(request.roles.isReviewer || request.roles.isAdmin)
    ) {
      return reply.code(403).send({ error: "Only reviewers can publish records" });
    }

    const result = await query(
      `UPDATE records SET
         status = $3, title_en = $4, title_fr = $5, identifier = $6,
         dataset_identifier = $7, filename = $8,
         time_first_published = $9, last_edited_by = $10, data = $11,
         updated_at = now()
       WHERE region = $1 AND id = $2 RETURNING *`,
      [
        request.region,
        row.id,
        columns.status,
        columns.title_en,
        columns.title_fr,
        columns.identifier,
        columns.dataset_identifier,
        columns.filename,
        columns.time_first_published,
        JSON.stringify(columns.last_edited_by),
        JSON.stringify(data),
      ],
    );
    const updated = result.rows[0];

    if (updated.status !== row.status) {
      fireRecordChange(request.log, {
        region: request.region,
        record: toApi(updated),
        before: { status: row.status },
        after: { status: updated.status },
        kind: "update",
      });
    }
    return toApi(updated, { sharedWith: await loadSharedWith(updated.id) });
  });

  // submitRecord / returnRecordToDraft replacement. Body: {status} in API shape.
  app.put("/regions/:region/records/:id/status", guarded, async (request, reply) => {
    const row = await loadRecordRow(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Record not found" });
    if (!(await canWriteRecord(request, row))) {
      return reply.code(403).send({ error: "Not allowed to edit this record" });
    }

    const newStatus = STATUS_TO_DB[request.body?.status ?? ""];
    if (!newStatus) return reply.code(422).send({ error: "Invalid status" });

    if (
      newStatus === "published" &&
      row.status !== "published" &&
      !(request.roles.isReviewer || request.roles.isAdmin)
    ) {
      return reply.code(403).send({ error: "Only reviewers can publish records" });
    }

    // Backfill filename on first submit/publish, as submitRecord does.
    let { filename } = row;
    if (!filename) {
      const record = toApi(row);
      if (record.title?.[record.language]) filename = getRecordFilename(record);
    }

    const result = await query(
      `UPDATE records SET
         status = $3::record_status,
         time_first_published = CASE WHEN $3::record_status = 'published' AND time_first_published IS NULL
                                     THEN now() ELSE time_first_published END,
         filename = $4,
         updated_at = now()
       WHERE region = $1 AND id = $2 RETURNING *`,
      [request.region, row.id, newStatus, filename],
    );
    const updated = result.rows[0];

    if (updated.status !== row.status) {
      fireRecordChange(request.log, {
        region: request.region,
        record: toApi(updated, { userinfo: await userinfoFor(updated.user_id) }),
        before: { status: row.status },
        after: { status: updated.status },
        kind: "update",
      });
    }
    return toApi(updated);
  });

  app.delete("/regions/:region/records/:id", guarded, async (request, reply) => {
    const row = await loadRecordRow(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Record not found" });
    if (!(await canWriteRecord(request, row))) {
      return reply.code(403).send({ error: "Not allowed to delete this record" });
    }

    await query("DELETE FROM records WHERE id = $1", [row.id]);

    fireRecordChange(request.log, {
      region: request.region,
      record: toApi(row),
      before: { status: row.status },
      after: null,
      kind: "delete",
    });
    return { deleted: true };
  });

  // cloneRecord replacement: copies a record into the caller's records.
  app.post("/regions/:region/records/:id/clone", guarded, async (request, reply) => {
    const row = await loadRecordRow(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Record not found" });

    const record = toApi(row);
    record.recordID = "";
    record.status = "";
    record.lastEditedBy = {};
    record.created = new Date().toISOString();
    record.filename = "";
    record.timeFirstPublished = "";
    if (record.title.en) record.title.en = `${record.title.en} (Copy)`;
    if (record.title.fr) record.title.fr = `${record.title.fr} (Copte)`;
    record.identifier = crypto.randomUUID();
    // A clone is a new request, not a replay of the original. Carrying the
    // source's idempotency key over would collide with the unique index.
    record.clientRecordId = "";

    const { columns, data } = fromApi(record);
    const result = await query(
      `INSERT INTO records ${RECORD_COLUMNS} VALUES ${RECORD_VALUES} RETURNING *`,
      insertParams(request.region, request.user.id, columns, data),
    );
    return reply.code(201).send(toApi(result.rows[0]));
  });

  // transferRecord replacement: ownership UPDATE keyed by destination email.
  app.post("/regions/:region/records/:id/transfer", guarded, async (request, reply) => {
    const row = await loadRecordRow(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Record not found" });
    if (row.user_id !== request.user.id && !(request.roles.isReviewer || request.roles.isAdmin)) {
      return reply.code(403).send({ error: "Not allowed to transfer this record" });
    }

    const email = (request.body?.email || "").trim().toLowerCase();
    if (!email) return reply.code(422).send({ error: "email is required" });

    const destination = await query(
      `SELECT u.id FROM users u JOIN region_users ru ON ru.user_id = u.id
       WHERE ru.region = $1 AND u.email = $2`,
      [request.region, email],
    );
    if (!destination.rows.length) {
      return reply.code(404).send({ error: `No user with email ${email} in this region` });
    }

    const result = await query(
      "UPDATE records SET user_id = $2, updated_at = now() WHERE id = $1 RETURNING *",
      [row.id, destination.rows[0].id],
    );
    const updated = result.rows[0];

    // Matches updatesRecordCreate: a transferred submitted/published record
    // gets its XML regenerated (path/ownership changed).
    if (updated.status !== "draft") {
      fireRecordChange(request.log, {
        region: request.region,
        record: toApi(updated, { userinfo: await userinfoFor(updated.user_id) }),
        before: null,
        after: { status: updated.status },
        kind: "create",
      });
    }
    return { transferred: true };
  });

  // updateSharedRecord replacement: full replacement of the share set.
  app.put("/regions/:region/records/:id/shares", guarded, async (request, reply) => {
    const row = await loadRecordRow(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Record not found" });
    if (row.user_id !== request.user.id && !(request.roles.isReviewer || request.roles.isAdmin)) {
      return reply.code(403).send({ error: "Not allowed to share this record" });
    }

    const userIds = request.body?.userIds;
    if (!Array.isArray(userIds)) return reply.code(422).send({ error: "userIds array required" });

    await withTransaction(async (client) => {
      await client.query("DELETE FROM record_shares WHERE record_id = $1", [row.id]);
      for (const userId of userIds) {
        await client.query(
          "INSERT INTO record_shares (record_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [row.id, userId],
        );
      }
    });

    return { sharedWith: Object.fromEntries(userIds.map((u) => [u, true])) };
  });
}

module.exports = { recordRoutes };
