// A record lives in one (home) region but can also be published in the WAF of
// other regions, listed in its `alsoPublishTo`. Records can't be queried across
// regions, so this keeps a reverse index that the forms function reads:
//   {targetRegion}/publishedFrom/{homeRegion}/{userID}/{recordID}: true
// Clients can't write the index (database rules), only this trigger does.
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { regionNames } = require("./mailoutText");

// Known regions other than the home region, from an array or object value.
function publishRegions(value, homeRegion) {
  return [...new Set(Object.values(value || {}))].filter(
    (region) => regionNames[region] && region !== homeRegion,
  );
}

function publishRegionsIndexUpdates(region, userID, recordID, before, after) {
  if (!regionNames[region]) return {};
  const previous = publishRegions(before, region);
  const current = publishRegions(after, region);
  const indexPath = (target) =>
    `${target}/publishedFrom/${region}/${userID}/${recordID}`;

  const updates = {};
  previous
    .filter((target) => !current.includes(target))
    .forEach((target) => {
      updates[indexPath(target)] = null;
    });
  current.forEach((target) => {
    updates[indexPath(target)] = true;
  });
  return updates;
}

exports.publishRegionsIndexUpdates = publishRegionsIndexUpdates;

// Also fires when the record is deleted or transferred to another user, which
// removes or moves its index entries.
exports.updatesRecordPublishRegions = functions.database
  .ref("/{region}/users/{userID}/records/{recordID}/alsoPublishTo")
  .onWrite(({ before, after }, context) => {
    const { region, userID, recordID } = context.params;
    const updates = publishRegionsIndexUpdates(
      region,
      userID,
      recordID,
      before.val(),
      after.val(),
    );
    if (!Object.keys(updates).length) return null;
    return admin.database().ref().update(updates);
  });
