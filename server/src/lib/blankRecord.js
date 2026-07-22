// Server-side port of src/utils/blankRecord.js + standardizeRecord from
// src/utils/firebaseRecordFunctions.js. Keep field lists in sync with the
// frontend — this is the canonical record shape.

const blankRecord = {
  title: { en: "", fr: "" },
  abstract: { en: "", fr: "" },
  keywords: { en: [], fr: [] },
  eov: [],
  progress: "",
  distribution: [],
  dateStart: null,
  dateEnd: null,
  map: { north: "", south: "", east: "", west: "", polygon: "" },
  verticalExtentMin: "",
  verticalExtentMax: "",
  datePublished: null,
  dateRevised: null,
  edition: "",
  recordID: "",
  instruments: [],
  platforms: [],
  language: "",
  license: "",
  contacts: [],
  status: "",
  comment: "",
  limitations: "",
  lastEditedBy: {},
  category: "",
  verticalExtentDirection: "",
  datasetIdentifier: "",
  doiCreationStatus: "",
  noPlatform: false,
  filename: "",
  organization: "",
  timeFirstPublished: "",
  history: [],
  associated_resources: [],
};

const blankContact = {
  role: [],
  orgName: "",
  orgEmail: "",
  orgURL: "",
  orgAdress: "",
  orgCity: "",
  orgCountry: "",
  orgRor: "",
  indPosition: "",
  indEmail: "",
  indOrcid: "",
  givenNames: "",
  lastName: "",
  inCitation: true,
};

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function standardizeContact(contact) {
  return { ...deepCopy(blankContact), ...contact };
}

// Fills in missing fields on older records.
function standardizeRecord(record) {
  const updated = { ...deepCopy(blankRecord), ...record };
  updated.contacts = (updated.contacts || []).map(standardizeContact);
  return updated;
}

function getRecordFilename(record) {
  return `${record.title[record.language].slice(0, 30)}_${record.identifier.slice(0, 5)}`
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, "_");
}

module.exports = { blankRecord, blankContact, standardizeRecord, standardizeContact, getRecordFilename };
