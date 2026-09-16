const admin = require("firebase-admin");
const { translate } = require("./translate");
const { checkURLActive } = require("./serverUtils");
const { createDraftDoi, updateDraftDoi, deleteDraftDoi, getDoiStatus, getCredentialsStored, getDatacitePrefix, testDataciteCredentials, publishDoi, registerDoi, hideDoi } = require("./datacite");
const { notifyReviewer, notifyUser } = require("./notify");
const {
  updatesRecordCreate,
  updatesRecordUpdate,
  updatesRecordDelete,
  downloadRecord,
  regenerateXMLforRecord,
} = require("./updates");
const { githubPublishRecord } = require("./githubPublish");
const {
  shareRecord,
  unshareRecord,
  claimInvites,
  transferRecord,
} = require("./sharing");

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
exports.getCredentialsStored = getCredentialsStored;
exports.getDatacitePrefix = getDatacitePrefix;
exports.testDataciteCredentials = testDataciteCredentials;
exports.publishDoi = publishDoi;
exports.registerDoi = registerDoi;
exports.hideDoi = hideDoi;
exports.githubPublishRecord = githubPublishRecord;
exports.shareRecord = shareRecord;
exports.unshareRecord = unshareRecord;
exports.claimInvites = claimInvites;
exports.transferRecord = transferRecord;
