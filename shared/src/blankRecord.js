import { v4 as uuidv4 } from "uuid";

import { deepCopy } from "./misc.js";

// The canonical record shape. Spread over every record on save, so a default
// added here becomes a default everywhere — see shared/src/__tests__/
// blankRecord.test.js, which pins the submit gate against exactly that.
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
  // Bilingual, matching every consumer. Records written before this fix may
  // still hold a bare string; components coerce on read.
  limitations: { en: "", fr: "" },
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

  // Previously written by the tabs but never declared here, which meant the
  // shape depended on which tabs a user happened to open.
  resourceType: [],
  metadataScope: "",
  metadataScopeIso: "",
  projects: [],
  taxa: [],
  noTaxa: false,
  noVerticalExtent: false,
  verticalExtentEPSG: "",
};

function getBlankRecord() {
  const record = deepCopy(blankRecord);
  record.identifier = uuidv4();
  record.created = new Date().toISOString();
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

export {
  getBlankRecord,
  getBlankContact,
  getBlankInstrument,
  getBlankPlatform,
};
