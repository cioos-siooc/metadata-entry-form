const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// region is used as a database path segment, so it must not contain path separators
const regionPattern = /^[A-Za-z0-9_-]+$/;

// The "share with..." picker needs to resolve everyone in a region to a display name and
// an email. It used to read $region/users straight from the client, which meant the
// database had to grant every authenticated user read access to that whole subtree -
// including every other user's draft records and the contact details inside them.
//
// This returns just the directory fields, read with the Admin SDK, so the broad client
// read grant is no longer needed. The shape matches what the picker previously got from
// the database so the component logic is unchanged.
exports.lookupRegionUsers = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { region } = request.data || {};
  if (!region) {
    throw new HttpsError("invalid-argument", "Region not provided.");
  }
  if (!regionPattern.test(region)) {
    throw new HttpsError("invalid-argument", "Invalid region.");
  }

  const snapshot = await admin
    .database()
    .ref(region)
    .child("users")
    .once("value");
  const users = snapshot.val() || {};

  // only members of a region can enumerate it
  if (!users[request.auth.uid]) {
    throw new HttpsError("permission-denied", "Not a member of this region.");
  }

  return Object.entries(users).reduce((directory, [uid, user]) => {
    const info = user && user.userinfo;
    if (info && info.email) {
      directory[uid] = {
        userinfo: {
          email: info.email,
          displayName: info.displayName || "",
        },
      };
    }
    return directory;
  }, {});
});
