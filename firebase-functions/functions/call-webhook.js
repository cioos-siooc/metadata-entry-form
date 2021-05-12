const functions = require("firebase-functions");
const fetch = require("node-fetch");
const { pacdev1Auth } = require("./hooks-auth");

async function callPacDevWebHook() {
  const { username, password, hookID, url } = pacdev1Auth;

  const authString = Buffer.from(`${username}:${password}`).toString("base64");

  return fetch(`${url}/${hookID}`, {
    headers: {
      Authorization: `Basic ${authString}`,
    },
  }).catch((e) => {
    console.log(e);
  });
}

async function callWebHooks() {
  await callPacDevWebHook();
}

exports.callWebhookPublished = functions.database
  .ref("/{region}/users/{userID}/records/{recordID}/status")
  .onUpdate(({ before, after }, context) => {
    if (
      after.val() === "published" ||
      (before.val() === "published" && after.val() !== "published")
    )
      return callWebHooks();
    return false;
  });

exports.callWebhookDeleted = functions.database
  .ref("/{region}/users/{userID}/records/{recordID}")
  .onDelete((snapshot, context) => {
    const record = snapshot.toJSON();

    if (record.status === "published") {
      return callWebHooks();
    }
    return false;
  });
