const admin = require("firebase-admin");
const { translate } = require("./translate");
const { notifyReviewer, notifyUser } = require("./notify");
const { callWebhookPublished, callWebhookDeleted } = require("./call-webhook");

admin.initializeApp();

exports.translate = translate;
exports.notifyReviewer = notifyReviewer;
exports.notifyUser = notifyUser;
exports.callWebhookPublished = callWebhookPublished;
exports.callWebhookDeleted = callWebhookDeleted;
