const crypto = require("crypto");
const { query, withTransaction } = require("../db");
const { toApi, fromApi, STATUS_TO_DB } = require("../lib/recordSerializer");
const { getRecordFilename } = require("../lib/blankRecord");
const { fireRecordChange } = require("../services/recordHooks");
const { getTransporter } = require("../lib/mailer");
const {
  mailOptionsRecordShared,
  mailOptionsShareInvitation,
} = require("../services/mailoutText");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// ponytail: flat per-record cap, not a real rate limit. Sharing mails arbitrary
// addresses; add a per-user daily quota if that gets abused.
const MAX_SHARES_PER_RECORD = 20;

async function loadRecordRow(region, id) {
  const result = await query("SELECT * FROM records WHERE region = $1 AND id = $2", [region, id]);
  return result.rows[0] || null;
}

// {userID: email} for users the record is shared with.
async function loadSharedWith(recordId) {
  const result = await query(
    "SELECT s.user_id, u.email FROM record_shares s JOIN users u ON u.id = s.user_id WHERE s.record_id = $1",
    [recordId],
  );
  if (!result.rows.length) return null;
  return Object.fromEntries(result.rows.map((r) => [r.user_id, r.email]));
}

// {inviteKey: email} for invitations not yet claimed. The key is the email.
async function loadPendingShares(recordId) {
  const result = await query("SELECT email FROM record_share_invites WHERE record_id = $1", [
    recordId,
  ]);
  if (!result.rows.length) return null;
  return Object.fromEntries(result.rows.map((r) => [r.email, r.email]));
}

async function shareFields(recordId) {
  return {
    sharedWith: await loadSharedWith(recordId),
    pendingShares: await loadPendingShares(recordId),
  };
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
      ...(await shareFields(row.id)),
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
    return toApi(updated, await shareFields(updated.id));
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
    await query("DELETE FROM record_shares WHERE record_id = $1 AND user_id = $2", [
      row.id,
      destination.rows[0].id,
    ]);
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

  // shareRecord replacement: share by email. An existing account gets access
  // immediately; otherwise an invitation is stored and claimed on sign-up.
  // Body: {email, language}. Returns {status, email, emailSent}.
  app.post("/regions/:region/records/:id/shares", guarded, async (request, reply) => {
    const row = await loadRecordRow(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Record not found" });
    if (row.user_id !== request.user.id && !(request.roles.isReviewer || request.roles.isAdmin)) {
      return reply.code(403).send({ error: "Not allowed to share this record" });
    }

    const email = String(request.body?.email || "").trim().toLowerCase();
    if (email.length > 254 || !EMAIL_RE.test(email)) {
      return reply.code(422).send({ error: "A valid email address is required." });
    }

    const owner = await userinfoFor(row.user_id);
    if (email === owner?.email?.toLowerCase()) {
      return reply.code(422).send({ error: "You cannot share a record with its owner." });
    }

    const { sharedWith, pendingShares } = await shareFields(row.id);
    if (
      Object.keys(sharedWith || {}).length + Object.keys(pendingShares || {}).length >=
      MAX_SHARES_PER_RECORD
    ) {
      return reply
        .code(429)
        .send({ error: `A record can be shared with at most ${MAX_SHARES_PER_RECORD} people.` });
    }

    const record = toApi(row);
    const mailArgs = [
      email,
      record.title?.en,
      record.title?.fr,
      request.region,
      request.user.display_name || "",
      request.user.email,
      row.user_id,
      row.id,
      request.body?.language || record.language,
    ];
    const send = async (mailOptions) => {
      try {
        await getTransporter().sendMail(mailOptions);
        return true;
      } catch (err) {
        // Access already changed; don't undo it because the mail bounced.
        request.log.error({ err: err.message }, "failed to send share email");
        return false;
      }
    };

    const user = (await query("SELECT id FROM users WHERE email = $1", [email])).rows[0];
    if (user) {
      const inserted = await query(
        "INSERT INTO record_shares (record_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING 1",
        [row.id, user.id],
      );
      if (!inserted.rows.length) return { status: "already-shared", email };
      return { status: "shared", email, emailSent: await send(mailOptionsRecordShared(...mailArgs)) };
    }

    const invited = await query(
      "INSERT INTO record_share_invites (record_id, email, invited_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING 1",
      [row.id, email, request.user.id],
    );
    if (!invited.rows.length) return { status: "already-invited", email };
    return { status: "invited", email, emailSent: await send(mailOptionsShareInvitation(...mailArgs)) };
  });

  // unshareRecord replacement. Body: {uid} (existing share) or {inviteKey}.
  app.delete("/regions/:region/records/:id/shares", guarded, async (request, reply) => {
    const row = await loadRecordRow(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Record not found" });
    if (row.user_id !== request.user.id && !(request.roles.isReviewer || request.roles.isAdmin)) {
      return reply.code(403).send({ error: "Not allowed to share this record" });
    }

    const { uid, inviteKey } = request.body || {};
    if (uid) {
      await query("DELETE FROM record_shares WHERE record_id = $1 AND user_id = $2", [row.id, uid]);
      return { status: "unshared" };
    }
    if (inviteKey) {
      await query("DELETE FROM record_share_invites WHERE record_id = $1 AND email = $2", [
        row.id,
        String(inviteKey).toLowerCase(),
      ]);
      return { status: "invite-withdrawn" };
    }
    return reply.code(422).send({ error: "Either uid or inviteKey is required." });
  });
}

module.exports = { recordRoutes };
