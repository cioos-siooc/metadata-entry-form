const admin = require("firebase-admin");
admin.initializeApp();

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
const { 
  githubPublishRecord, 
  processOrganizationTask
} = require("./githubPublish");

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
exports.processOrganizationTask = processOrganizationTask;
