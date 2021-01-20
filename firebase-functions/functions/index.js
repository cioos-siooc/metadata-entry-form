const { translate } = require("./translate");
const { notifyReviewer, notifyUser } = require("./notify");
const { callWebhookPublished, callWebhookDeleted } = require("./call-webhook");
const admin = require("firebase-admin");

admin.initializeApp();

exports.translate = translate;
exports.notifyReviewer = notifyReviewer;
exports.notifyUser = notifyUser;
exports.callWebhookPublished = callWebhookPublished;
exports.callWebhookDeleted = callWebhookDeleted;
