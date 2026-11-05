// Record access: sharing by email address, claiming invitations on sign-up,
// and transferring ownership. All of it runs here rather than in the browser so
// that the client never needs to download the region's user list to map an email
// address to a user ID.
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {
  regionNames,
  mailOptionsRecordShared,
  mailOptionsShareInvitation,
  mailOptionsReviewer,
} = require("./mailoutText");
const transporter = require("./mailer");
const { findCustodianOrgName } = require("./notify");

// Firebase keys can't contain . # $ / [ ]
const emailKey = (email) =>
  email
    .toLowerCase()
    .trim()
    .replace(/[.#$/[\]]/g, ",");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ponytail: flat per-record cap, not a real rate limit. These functions can mail
// arbitrary addresses, so if that gets abused add a per-user daily quota.
const MAX_SHARES_PER_RECORD = 20;

function normalizeEmail(email) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (normalized.length > 254 || !EMAIL_RE.test(normalized)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A valid email address is required.",
    );
  }
  return normalized;
}

function checkRegion(region) {
  if (!regionNames[region]) {
    throw new functions.https.HttpsError("invalid-argument", "Unknown region.");
  }
}

function requireAuth(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }
  return context.auth;
}

async function getUserByEmail(email) {
  try {
    return await admin.auth().getUserByEmail(email);
  } catch (e) {
    if (e.code === "auth/user-not-found") return null;
    throw e;
  }
}

// Loads a record the caller owns, or throws.
async function getOwnedRecord(region, ownerID, recordID) {
  if (!recordID) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The record must be saved before it can be shared.",
    );
  }
  const snapshot = await admin
    .database()
    .ref(`${region}/users/${ownerID}/records/${recordID}`)
    .once("value");

  const record = snapshot.val();
  if (!record) {
    throw new functions.https.HttpsError("not-found", "Record not found.");
  }
  return record;
}

async function send(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (e) {
    // The access change already happened; don't undo it because the mail bounced.
    functions.logger.error("Failed to send share email", e);
    return false;
  }
}

/*
Share a record with an email address. If that address has an account it gets
access immediately; if not, an invitation is recorded and claimed on sign-up.
*/
exports.shareRecord = functions.https.onCall(async (data, context) => {
  const { uid: ownerID, token } = requireAuth(context);
  const { region, recordID, language } = data || {};

  checkRegion(region);
  const email = normalizeEmail(data && data.email);

  if (email === String(token.email || "").toLowerCase()) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "You cannot share a record with yourself.",
    );
  }

  const record = await getOwnedRecord(region, ownerID, recordID);
  const sharedWith = record.sharedWith || {};
  const pendingShares = record.pendingShares || {};

  if (
    Object.keys(sharedWith).length + Object.keys(pendingShares).length >=
    MAX_SHARES_PER_RECORD
  ) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      `A record can be shared with at most ${MAX_SHARES_PER_RECORD} people.`,
    );
  }

  const titleEn = record.title && record.title.en;
  const titleFr = record.title && record.title.fr;
  const mailArgs = [
    email,
    titleEn,
    titleFr,
    region,
    token.name || "",
    token.email,
    ownerID,
    recordID,
    language || record.language,
  ];

  const db = admin.database();
  const recordPath = `${region}/users/${ownerID}/records/${recordID}`;
  const user = await getUserByEmail(email);

  if (user) {
    if (sharedWith[user.uid]) return { status: "already-shared", email };

    await db.ref().update({
      [`${recordPath}/sharedWith/${user.uid}`]: email,
      [`${region}/shares/${user.uid}/${ownerID}/${recordID}`]: { shared: true },
    });

    const emailSent = await send(mailOptionsRecordShared(...mailArgs));
    return { status: "shared", email, emailSent };
  }

  const key = emailKey(email);
  if (pendingShares[key]) return { status: "already-invited", email };

  await db.ref().update({
    [`${recordPath}/pendingShares/${key}`]: email,
    [`invites/${key}/${region}/${ownerID}/${recordID}`]: {
      email,
      invitedBy: token.email || ownerID,
      invitedAt: new Date().toISOString(),
    },
  });

  const emailSent = await send(mailOptionsShareInvitation(...mailArgs));
  return { status: "invited", email, emailSent };
});

/*
Remove a user's access to a record, or withdraw a pending invitation.
Pass either uid (existing share) or inviteKey (pending invitation).
*/
exports.unshareRecord = functions.https.onCall(async (data, context) => {
  const { uid: ownerID } = requireAuth(context);
  const { region, recordID, uid, inviteKey } = data || {};

  checkRegion(region);
  await getOwnedRecord(region, ownerID, recordID);

  const recordPath = `${region}/users/${ownerID}/records/${recordID}`;

  if (uid) {
    await admin
      .database()
      .ref()
      .update({
        [`${recordPath}/sharedWith/${uid}`]: null,
        [`${region}/shares/${uid}/${ownerID}/${recordID}`]: null,
      });
    return { status: "unshared" };
  }

  if (inviteKey) {
    await admin
      .database()
      .ref()
      .update({
        [`${recordPath}/pendingShares/${inviteKey}`]: null,
        [`invites/${inviteKey}/${region}/${ownerID}/${recordID}`]: null,
      });
    return { status: "invite-withdrawn" };
  }

  throw new functions.https.HttpsError(
    "invalid-argument",
    "Either uid or inviteKey is required.",
  );
});

/*
When someone signs up, grant them any records that were shared with their email
address before they had an account. This is an auth trigger rather than a
database one so that it fires no matter which region they sign up in.
*/
exports.claimInvites = functions.auth.user().onCreate(async (user) => {
  if (!user.email) return;

  const key = emailKey(user.email);
  const db = admin.database();
  const invites = (await db.ref(`invites/${key}`).once("value")).val();
  if (!invites) return;

  const updates = {};

  await Promise.all(
    Object.entries(invites).flatMap(([region, authors]) =>
      Object.entries(authors).flatMap(([authorID, records]) =>
        Object.keys(records).map(async (recordID) => {
          const recordPath = `${region}/users/${authorID}/records/${recordID}`;
          // The record may have been deleted since the invitation was sent;
          // writing sharedWith would resurrect it as a stub.
          const exists = (await db.ref(recordPath).once("value")).exists();
          if (!exists) return;

          updates[`${recordPath}/sharedWith/${user.uid}`] = user.email;
          updates[`${recordPath}/pendingShares/${key}`] = null;
          updates[`${region}/shares/${user.uid}/${authorID}/${recordID}`] = {
            shared: true,
          };
        }),
      ),
    ),
  );

  updates[`invites/${key}`] = null;
  await db.ref().update(updates);
});

async function getPermissions(region) {
  const permissions =
    (
      await admin.database().ref(`admin/${region}/permissions`).once("value")
    ).val() || {};
  const emails = (list) =>
    (list || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  return {
    admins: emails(permissions.admins),
    reviewers: emails(permissions.reviewers),
  };
}

const isReviewerOrAdmin = ({ admins, reviewers }, email) =>
  [...admins, ...reviewers].includes(String(email || "").toLowerCase());

// DOIs minted from the form use the DataCite credentials of the record's region
const MANAGED_DOI_STATES = ["draft", "registered", "findable"];

/*
Transfer ownership of a record to another user, by email address, optionally
moving it to another region. Reviewers and admins of the region only.

A reviewer of both regions moves the record as is. Otherwise it is sent to the
destination region's review: it arrives as submitted and its reviewers are
emailed, so a region never ends up with a published record it didn't approve.
*/
exports.transferRecord = functions.https.onCall(async (data, context) => {
  const { token } = requireAuth(context);
  const { region, recordID, sourceUserID } = data || {};
  const destinationRegion = (data && data.destinationRegion) || region;

  checkRegion(region);
  checkRegion(destinationRegion);
  // Without an email the record changes region and keeps its owner.
  const keepOwner = !(data && data.email) && destinationRegion !== region;
  const email = keepOwner ? null : normalizeEmail(data && data.email);

  if (!isReviewerOrAdmin(await getPermissions(region), token.email)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "User must be an admin or reviewer.",
    );
  }
  const destinationPermissions =
    destinationRegion === region
      ? null
      : await getPermissions(destinationRegion);
  const sentForReview =
    destinationPermissions &&
    !isReviewerOrAdmin(destinationPermissions, token.email);

  const destination = keepOwner
    ? await admin.auth().getUser(sourceUserID)
    : await getUserByEmail(email);
  if (!destination) return { success: false, reason: "user-not-found" };

  const db = admin.database();
  const sourcePath = `${region}/users/${sourceUserID}/records/${recordID}`;
  const record = (await db.ref(sourcePath).once("value")).val();
  if (!record) {
    throw new functions.https.HttpsError("not-found", "Record not found.");
  }

  // The destination region's DataCite account couldn't update the DOI. It has
  // to be moved between DataCite repositories first.
  if (
    destinationRegion !== region &&
    MANAGED_DOI_STATES.includes(record.doiCreationStatus)
  ) {
    return { success: false, reason: "has-doi" };
  }

  const newRef = db
    .ref(`${destinationRegion}/users/${destination.uid}/records`)
    .push();
  const newRecordID = newRef.key;

  // The new owner doesn't need to also be in their own sharedWith list.
  const sharedWith = { ...record.sharedWith };
  delete sharedWith[destination.uid];

  const updates = {
    [`${destinationRegion}/users/${destination.uid}/records/${newRecordID}`]: {
      ...record,
      recordID: newRecordID,
      userID: destination.uid,
      sharedWith,
      ...(sentForReview && { status: "submitted" }),
    },
    [sourcePath]: null,
  };

  // Repoint the reverse index, otherwise "Shared with me" points at a record
  // that no longer exists at that path.
  Object.keys(record.sharedWith || {}).forEach((sharedUID) => {
    updates[`${region}/shares/${sharedUID}/${sourceUserID}/${recordID}`] = null;
    if (sharedUID !== destination.uid) {
      updates[
        `${destinationRegion}/shares/${sharedUID}/${destination.uid}/${newRecordID}`
      ] = {
        shared: true,
      };
    }
  });

  // Same for invitations that haven't been claimed yet.
  Object.entries(record.pendingShares || {}).forEach(([key, pendingEmail]) => {
    updates[`invites/${key}/${region}/${sourceUserID}/${recordID}`] = null;
    updates[
      `invites/${key}/${destinationRegion}/${destination.uid}/${newRecordID}`
    ] = {
      email: pendingEmail,
      invitedBy: token.email || "",
      invitedAt: new Date().toISOString(),
    };
  });

  await db.ref().update(updates);

  if (sentForReview && destinationPermissions.reviewers.length) {
    await send(
      mailOptionsReviewer(
        destinationPermissions.reviewers,
        record.title && record.title.en,
        record.title && record.title.fr,
        destinationRegion,
        destination.displayName || "",
        destination.email || email,
        findCustodianOrgName(record),
        destination.uid,
        newRecordID,
        record.language,
      ),
    );
  }

  return {
    success: true,
    sentForReview: Boolean(sentForReview),
    recordID: newRecordID,
    userID: destination.uid,
    region: destinationRegion,
  };
});

exports.emailKey = emailKey;
