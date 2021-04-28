const admin = require("firebase-admin");
const { translate } = require("./src/translate");
const { notify } = require("./src/notify");
const {
  callWebhookPublished,
  callWebhookDeleted,
} = require("./src/call-webhook");

admin.initializeApp();

exports.translate = translate;
exports.notify = notify;
exports.callWebhookPublished = callWebhookPublished;
exports.callWebhookDeleted = callWebhookDeleted;
