const { query } = require("../db");
const { validateSubmissionData } = require("../lib/formValidation");

// Submissions against form types. Drafts save without validation (partially
// filled forms must persist); the draft → submitted transition validates the
// data against the form type's current JSON Schema. No publish machinery —
// that stays with metadata records.

function toApi(row) {
  return {
    id: row.id,
    region: row.region,
    formTypeId: row.form_type_id,
    formTypeVersion: row.form_type_version,
    userID: row.user_id,
    status: row.status,
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.form_type_slug && {
      formType: { slug: row.form_type_slug, title: row.form_type_title },
    }),
    ...(row.owner_email && {
      userinfo: { userID: row.user_id, email: row.owner_email, displayName: row.owner_name },
    }),
  };
}

function canAccess(request, row) {
  return (
    row.user_id === request.user.id || request.roles.isReviewer || request.roles.isAdmin
  );
}

async function loadSubmission(region, id) {
  const result = await query("SELECT * FROM form_submissions WHERE region = $1 AND id = $2", [
    region,
    id,
  ]);
  return result.rows[0] || null;
}

async function formSubmissionRoutes(app) {
  const memberGuard = { preHandler: [app.authenticate, app.regionContext] };

  // Submissions for one form type. Reviewers/admins see all (with optional
  // ?ownerId= and ?status= filters); regular members only ever see their own.
  app.get(
    "/regions/:region/form-types/:formTypeId/submissions",
    memberGuard,
    async (request) => {
      const elevated = request.roles.isReviewer || request.roles.isAdmin;
      const conditions = ["s.region = $1", "s.form_type_id = $2"];
      const params = [request.region, request.params.formTypeId];

      const ownerId = elevated ? request.query.ownerId : "me";
      if (ownerId) {
        params.push(ownerId === "me" ? request.user.id : ownerId);
        conditions.push(`s.user_id = $${params.length}`);
      }
      if (request.query.status) {
        params.push(request.query.status);
        conditions.push(`s.status = $${params.length}`);
      }

      const result = await query(
        `SELECT s.*, u.email AS owner_email, u.display_name AS owner_name
         FROM form_submissions s JOIN users u ON u.id = s.user_id
         WHERE ${conditions.join(" AND ")}
         ORDER BY s.updated_at DESC`,
        params,
      );
      return result.rows.map(toApi);
    },
  );

  // The caller's submissions across all form types in the region.
  app.get("/regions/:region/form-submissions/mine", memberGuard, async (request) => {
    const result = await query(
      `SELECT s.*, t.slug AS form_type_slug, t.title AS form_type_title
       FROM form_submissions s JOIN form_types t ON t.id = s.form_type_id
       WHERE s.region = $1 AND s.user_id = $2
       ORDER BY s.updated_at DESC`,
      [request.region, request.user.id],
    );
    return result.rows.map(toApi);
  });

  // Create a draft. Data may be partial/invalid — validation happens on submit.
  app.post(
    "/regions/:region/form-types/:formTypeId/submissions",
    memberGuard,
    async (request, reply) => {
      const typeResult = await query(
        "SELECT * FROM form_types WHERE region = $1 AND id = $2 AND enabled",
        [request.region, request.params.formTypeId],
      );
      const formType = typeResult.rows[0];
      if (!formType) return reply.code(404).send({ error: "Form type not found" });

      const inserted = await query(
        `INSERT INTO form_submissions (region, form_type_id, form_type_version, user_id, data)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          request.region,
          formType.id,
          formType.version,
          request.user.id,
          JSON.stringify(request.body?.data ?? {}),
        ],
      );
      return reply.code(201).send(toApi(inserted.rows[0]));
    },
  );

  app.get("/regions/:region/form-submissions/:id", memberGuard, async (request, reply) => {
    const row = await loadSubmission(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Submission not found" });
    if (!canAccess(request, row)) return reply.code(403).send({ error: "No access" });
    return toApi(row);
  });

  app.put("/regions/:region/form-submissions/:id", memberGuard, async (request, reply) => {
    const row = await loadSubmission(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Submission not found" });
    if (!canAccess(request, row)) return reply.code(403).send({ error: "No access" });

    const data = request.body?.data ?? row.data;
    const status = request.body?.status ?? row.status;
    if (!["draft", "submitted"].includes(status)) {
      return reply.code(422).send({ error: `Invalid status: ${status}` });
    }

    if (status === "submitted") {
      const typeResult = await query("SELECT * FROM form_types WHERE id = $1", [
        row.form_type_id,
      ]);
      const { valid, errors } = validateSubmissionData(typeResult.rows[0], data);
      if (!valid) {
        return reply
          .code(422)
          .send({ error: "Submission data fails schema validation", validationErrors: errors });
      }
    }

    const updated = await query(
      `UPDATE form_submissions SET data = $3, status = $4, updated_at = now()
       WHERE region = $1 AND id = $2 RETURNING *`,
      [request.region, request.params.id, JSON.stringify(data), status],
    );
    return toApi(updated.rows[0]);
  });

  app.delete("/regions/:region/form-submissions/:id", memberGuard, async (request, reply) => {
    const row = await loadSubmission(request.region, request.params.id);
    if (!row) return reply.code(404).send({ error: "Submission not found" });
    if (!canAccess(request, row)) return reply.code(403).send({ error: "No access" });
    await query("DELETE FROM form_submissions WHERE id = $1", [row.id]);
    return { deleted: true };
  });
}

module.exports = { formSubmissionRoutes };
