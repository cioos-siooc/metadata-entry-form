const functions = require("firebase-functions");
const fetch = require("node-fetch");
const { githubAuth, pacdev1Auth } = require("./hooks-auth");

async function callGithubWebHook() {
  const { token } = githubAuth;

  return fetch(
    "https://api.github.com/repos/n-a-t-e/cioos-datasets/dispatches",
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.everest-preview+json",
        Authorization: `token ${token} `,
      },
      body: JSON.stringify({ event_type: "pull-datasets-from-firebase" }),
    }
  ).catch((e) => {
    console.log(e);
  });
}

async function callPacDevWebHook() {
  const { username, password, hookID } = pacdev1Auth;

  const authString = Buffer.from(`${username}:${password}`).toString("base64");

  return fetch(`https://pac-dev1.cioos.org/webhook/hooks/${hookID}`, {
    headers: {
      Authorization: "Basic " + authString,
    },
  }).catch((e) => {
    console.log(e);
  });
}

async function callWebHooks() {
  await callPacDevWebHook();
  return callGithubWebHook();
}

exports.callWebhookPublished = functions.database
  .ref("/{region}/users/{userID}/records/{recordID}/status")
  .onUpdate(({ before, after }, context) => {
    if (
      after.val() === "published" ||
      (before.status === "published" && after.status !== "published")
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
