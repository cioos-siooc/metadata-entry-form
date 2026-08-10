const crypto = require("crypto");
const functions = require("firebase-functions");
const admin = require("firebase-admin");

const TOKEN_PREFIX = "cmef";

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateRawToken(region) {
  const random = crypto.randomBytes(32).toString("base64url");
  return `${TOKEN_PREFIX}_${region}_${random}`;
}

async function assertRegionAdmin(email, region) {
  const snap = await admin
    .database()
    .ref(`admin/${region}/permissions/admins`)
    .once("value");
  const admins = (snap.val() || "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!email || !admins.includes(email)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "User must be an admin of this region."
    );
  }
}

exports.mintApiToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }
  const { region, label } = data || {};
  if (!region || typeof region !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "region is required.");
  }
  await assertRegionAdmin(context.auth.token.email, region);

  const rawToken = generateRawToken(region);
  const tokenId = crypto.randomBytes(8).toString("hex");
  const tokenHash = hashToken(rawToken);

  await admin.database().ref(`admin/${region}/apiTokens/${tokenId}`).set({
    hash: tokenHash,
    label: (label || "").toString().slice(0, 100),
    createdBy: context.auth.token.email,
    createdAt: Date.now(),
    lastUsedAt: null,
  });

  return { tokenId, token: rawToken };
});

exports.listApiTokens = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }
  const { region } = data || {};
  if (!region) {
    throw new functions.https.HttpsError("invalid-argument", "region is required.");
  }
  await assertRegionAdmin(context.auth.token.email, region);

  const snap = await admin.database().ref(`admin/${region}/apiTokens`).once("value");
  const tokens = snap.val() || {};
  return Object.entries(tokens).map(([id, t]) => ({
    id,
    label: t.label || "",
    createdBy: t.createdBy || "",
    createdAt: t.createdAt || null,
    lastUsedAt: t.lastUsedAt || null,
  }));
});

exports.revokeApiToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }
  const { region, tokenId } = data || {};
  if (!region || !tokenId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "region and tokenId are required."
    );
  }
  await assertRegionAdmin(context.auth.token.email, region);

  await admin.database().ref(`admin/${region}/apiTokens/${tokenId}`).remove();
  return { ok: true };
});

async function findTokenRecord(region, rawToken) {
  const expectedHash = hashToken(rawToken);
  const snap = await admin.database().ref(`admin/${region}/apiTokens`).once("value");
  const tokens = snap.val() || {};
  for (const [id, t] of Object.entries(tokens)) {
    if (t && t.hash === expectedHash) {
      return { id, ...t };
    }
  }
  return null;
}

function extractBearer(req) {
  const header = req.get("Authorization") || req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

// HTTPS REST API:
//   GET /records/:region                 -> all records in region (optional ?status=draft|submitted|published)
//   GET /records/:region/:userId/:recId  -> single record
exports.api = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawToken = extractBearer(req);
  if (!rawToken) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  // Path comes in as e.g. "/records/pacific" or "/records/pacific/<uid>/<rid>"
  const pathParts = (req.path || "").split("/").filter(Boolean);
  if (pathParts[0] !== "records" || pathParts.length < 2) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const region = pathParts[1];

  const tokenRecord = await findTokenRecord(region, rawToken);
  if (!tokenRecord) {
    res.status(403).json({ error: "Invalid token for this region" });
    return;
  }

  // Best-effort touch of lastUsedAt; do not block the response on failure.
  admin
    .database()
    .ref(`admin/${region}/apiTokens/${tokenRecord.id}/lastUsedAt`)
    .set(Date.now())
    .catch(() => {});

  try {
    if (pathParts.length === 2) {
      // List records in region
      const statusFilter = (req.query.status || "").toString().toLowerCase();
      const usersSnap = await admin.database().ref(`${region}/users`).once("value");
      const usersVal = usersSnap.val() || {};
      const out = [];
      for (const [userId, userData] of Object.entries(usersVal)) {
        const records = (userData && userData.records) || {};
        for (const [recordId, record] of Object.entries(records)) {
          if (statusFilter && (record.status || "") !== statusFilter) continue;
          out.push({ userId, recordId, region, record });
        }
      }
      res.status(200).json({ count: out.length, records: out });
      return;
    }

    if (pathParts.length === 4) {
      const [, , userId, recordId] = pathParts;
      const recSnap = await admin
        .database()
        .ref(`${region}/users/${userId}/records/${recordId}`)
        .once("value");
      const record = recSnap.val();
      if (!record) {
        res.status(404).json({ error: "Record not found" });
        return;
      }
      res.status(200).json({ userId, recordId, region, record });
      return;
    }

    res.status(404).json({ error: "Not found" });
  } catch (err) {
    console.error("API error", err);
    res.status(500).json({ error: "Internal error" });
  }
});
