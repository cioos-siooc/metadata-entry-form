import { v4 as uuidv4 } from "uuid";

import { deepCopy } from "./misc";

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

export { getBlankRecord, getBlankContact, getBlankInstrument, getBlankPlatform};
