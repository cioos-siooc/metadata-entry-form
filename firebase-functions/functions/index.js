const { translate } = require("./translate");
const { notify } = require("./notify");
const { callWebhookPublished, callWebhookDeleted } = require("./call-webhook");
const admin = require("firebase-admin");

admin.initializeApp();

exports.translate = translate;
exports.notify = notify;
exports.callWebhookPublished = callWebhookPublished;
exports.callWebhookDeleted = callWebhookDeleted;
