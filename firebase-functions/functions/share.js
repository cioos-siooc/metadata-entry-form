const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { defineString } = require("firebase-functions/params");
const {
  mailOptionsShareNotice,
  mailOptionsShareInvite,
} = require("./mailoutText");

const gmailUser = defineString("GMAIL_USER");
const gmailPass = defineString("GMAIL_PASS");

function getTransporter() {
  const user = process.env.GMAIL_USER || gmailUser.value();
  const pass = process.env.GMAIL_PASS || gmailPass.value();
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function emailHash(email) {
  return crypto
    .createHash("sha256")
    .update(normalizeEmail(email))
    .digest("hex");
}

function isValidEmail(email) {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

async function getAuthorDisplayName(region, authorUid) {
  const snap = await admin
    .database()
    .ref(`${region}/users/${authorUid}/userinfo`)
    .once("value");
  const info = snap.val() || {};
  return info.displayName || info.email || "A CIOOS user";
}

async function getRecordTitle(region, authorUid, recordID) {
  const snap = await admin
    .database()
    .ref(`${region}/users/${authorUid}/records/${recordID}`)
    .once("value");
  const record = snap.val() || {};
  const title = record.title || {};
  return title.en || title.fr || recordID;
}

// Share a record with another user by email. The recipient's existence is
// resolved server-side; the same response shape is returned whether or not
// the email matches a known account, so the caller cannot use this function
// as a directory oracle.
exports.shareRecord = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  const { region, recordID, recipientEmail } = data || {};
  if (!region || !recordID || !isValidEmail(recipientEmail)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing or invalid parameters."
    );
  }

  const authorUid = context.auth.uid;
  const authorEmail = normalizeEmail(context.auth.token && context.auth.token.email);
  const normalizedEmail = normalizeEmail(recipientEmail);

  const recordSnap = await admin
    .database()
    .ref(`${region}/users/${authorUid}/records/${recordID}`)
    .once("value");
  if (!recordSnap.exists()) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You can only share records you own."
    );
  }

  if (normalizedEmail === authorEmail) {
    return { status: "ok" };
  }

  const authorName = await getAuthorDisplayName(region, authorUid);
  const recordTitle = await getRecordTitle(region, authorUid, recordID);

  let recipient = null;
  try {
    recipient = await admin.auth().getUserByEmail(normalizedEmail);
  } catch (err) {
    if (err.code !== "auth/user-not-found") {
      functions.logger.error("getUserByEmail failed", err);
      throw new functions.https.HttpsError(
        "internal",
        "Could not process the share request."
      );
    }
  }

  const transporter = getTransporter();
  const sharedAt = admin.database.ServerValue.TIMESTAMP;

  if (recipient) {
    const recipientUid = recipient.uid;
    const updates = {};
    updates[`${region}/shares/${recipientUid}/${authorUid}/${recordID}`] = {
      shared: true,
      sharedAt,
    };
    updates[
      `${region}/users/${authorUid}/records/${recordID}/sharedWith/${recipientUid}`
    ] = {
      displayName: recipient.displayName || normalizedEmail,
      email: normalizedEmail,
      sharedAt,
    };
    await admin.database().ref().update(updates);

    transporter.sendMail(
      mailOptionsShareNotice(normalizedEmail, authorName, recordTitle, region),
      (e) => {
        if (e) functions.logger.error("share notice mail failed", e);
      }
    );
  } else {
    const hash = emailHash(normalizedEmail);
    await admin
      .database()
      .ref(`${region}/pendingShares/${hash}/${authorUid}/${recordID}`)
      .set({ sharedAt });

    transporter.sendMail(
      mailOptionsShareInvite(normalizedEmail, authorName, recordTitle, region),
      (e) => {
        if (e) functions.logger.error("share invite mail failed", e);
      }
    );
  }

  return { status: "ok" };
});

// Revoke a share. Only the record owner can call.
exports.unshareRecord = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  const { region, recordID, recipientUid } = data || {};
  if (!region || !recordID || !recipientUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing parameters."
    );
  }

  const authorUid = context.auth.uid;
  const recordSnap = await admin
    .database()
    .ref(`${region}/users/${authorUid}/records/${recordID}`)
    .once("value");
  if (!recordSnap.exists()) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You can only unshare records you own."
    );
  }

  const updates = {};
  updates[`${region}/shares/${recipientUid}/${authorUid}/${recordID}`] = null;
  updates[
    `${region}/users/${authorUid}/records/${recordID}/sharedWith/${recipientUid}`
  ] = null;
  await admin.database().ref().update(updates);

  return { status: "ok" };
});

// Promote any pending shares addressed to the caller's email into real
// share entries. Called from the client on login.
exports.claimPendingShares = functions.https.onCall(async (data, context) => {
  if (
    !context.auth ||
    !context.auth.token ||
    !context.auth.token.email
  ) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  const { region } = data || {};
  if (!region) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Region is required."
    );
  }

  const callerUid = context.auth.uid;
  const callerEmail = normalizeEmail(context.auth.token.email);
  const callerDisplayName = context.auth.token.name || callerEmail;
  const hash = emailHash(callerEmail);

  const pendingRef = admin
    .database()
    .ref(`${region}/pendingShares/${hash}`);
  const snap = await pendingRef.once("value");
  if (!snap.exists()) {
    return { claimed: 0 };
  }

  const sharedAt = admin.database.ServerValue.TIMESTAMP;
  const updates = {};
  let count = 0;

  snap.forEach((authorChild) => {
    const authorUid = authorChild.key;
    authorChild.forEach((recordChild) => {
      const recordID = recordChild.key;
      updates[`${region}/shares/${callerUid}/${authorUid}/${recordID}`] = {
        shared: true,
        sharedAt,
      };
      updates[
        `${region}/users/${authorUid}/records/${recordID}/sharedWith/${callerUid}`
      ] = {
        displayName: callerDisplayName,
        email: callerEmail,
        sharedAt,
      };
      count += 1;
    });
  });

  updates[`${region}/pendingShares/${hash}`] = null;
  await admin.database().ref().update(updates);

  return { claimed: count };
});
