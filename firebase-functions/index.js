const { translate } = require("./src/translate");
const { notify } = require("./src/notify");
const {
  callWebhookPublished,
  callWebhookDeleted,
} = require("./src/call-webhook");
const admin = require("firebase-admin");

admin.initializeApp();

exports.translate = translate;
exports.notify = notify;
exports.callWebhookPublished = callWebhookPublished;
exports.callWebhookDeleted = callWebhookDeleted;
