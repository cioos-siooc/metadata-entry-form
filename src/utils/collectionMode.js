// Helpers for the Collections metadata profile prototype.
// A record is in "Collection mode" when its ISO resource scope is "collection".

export const isCollection = (record) =>
  Boolean(record) && record.metadataScopeIso === "collection";

// Tabs that are not part of the Collections profile.
export const tabsHiddenForCollections = ["taxa", "platform"];

// MD_ProgressCode values the Collections profile allows for status.
export const collectionProgressCodes = ["onGoing", "completed"];
