import { v4 as uuidv4 } from "uuid";

import { deepCopy } from "./misc";
import { SCHEMA_VERSION } from "../schema/version";

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
  resourceType: [],
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

function getBlankRecord() {
  const record = deepCopy(blankRecord);
  record.identifier = uuidv4();
  record.created = new Date().toISOString();
  // Stamped so conformance runs can tell a record written before the schema
  // existed from one that is actually broken. Optional in the schema — records
  // predating this are reported as "pre-schema", not as failures.
  record.schemaVersion = SCHEMA_VERSION;
  return record;
}

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

function getBlankContact() {
  return deepCopy(blankContact);
}

const blankInstrument = {
  id: "",
  manufacturer: "",
  version: "",
  type: { en: "", fr: "" },
  description: { en: "", fr: "" },
};

function getBlankInstrument() {
  return deepCopy(blankInstrument);
}

const blankPlatform = {
  type: "",
  id: "",
  description: { en: "", fr: "" },
};

function getBlankPlatform() {
  return deepCopy(blankPlatform);
}

export { getBlankRecord, getBlankContact, getBlankInstrument, getBlankPlatform};
