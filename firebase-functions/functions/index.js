const admin = require("firebase-admin");
const { translate } = require("./translate");
const { checkURLActive } = require("./serverUtils");
const { createDraftDoi, updateDraftDoi, deleteDraftDoi, getDoiStatus, recordToDataCite, createDraftDoi_PR78, updateDraftDoi_PR78, deleteDraftDoi_PR78 } = require("./datacite");
const { notifyReviewer, notifyUser } = require("./notify");
const {
  updatesRecordCreate,
  updatesRecordUpdate,
  updatesRecordDelete,
  downloadRecord,
  regenerateXMLforRecord,
} = require("./updates");

admin.initializeApp();

exports.translate = translate;
exports.notifyReviewer = notifyReviewer;
exports.notifyUser = notifyUser;
exports.updatesRecordUpdate = updatesRecordUpdate;
exports.updatesRecordDelete = updatesRecordDelete;
exports.updatesRecordCreate = updatesRecordCreate;
exports.downloadRecord = downloadRecord;
exports.regenerateXMLforRecord = regenerateXMLforRecord;
exports.createDraftDoi = createDraftDoi;
exports.deleteDraftDoi = deleteDraftDoi;
exports.updateDraftDoi = updateDraftDoi;
exports.getDoiStatus = getDoiStatus;
exports.checkURLActive = checkURLActive;
exports.recordToDataCite = recordToDataCite;
exports.createDraftDoi_PR78 = createDraftDoi_PR78;
exports.deleteDraftDoi_PR78 = deleteDraftDoi_PR78;
exports.updateDraftDoi_PR78 = updateDraftDoi_PR78;
