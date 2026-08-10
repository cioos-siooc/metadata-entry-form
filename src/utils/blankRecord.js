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
  return record;
}

const blankContact = {
  role: [],
  orgSlug: "",
  orgName: "",
  orgNameEn: "",
  orgNameFr: "",
  orgDescriptionEn: "",
  orgDescriptionFr: "",
  orgLogoEn: "",
  orgLogoFr: "",
  orgAcceptedNames: [],
  orgEmail: "",
  orgURL: "",
  orgAddress: "",
  orgCity: "",
  orgCountry: "",
  orgRor: "",
  orgRorVersion: "",
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

const blankOrganization = {
  orgNameEn: "",
  orgNameFr: "",
  orgDescriptionEn: "",
  orgDescriptionFr: "",
  orgSlug: "",
  orgLogoEn: "",
  orgLogoFr: "",
  orgAcceptedNames: [],
  orgEmail: "",
  orgURL: "",
  orgAddress: "",
  orgCity: "",
  orgCountry: "",
  orgRor: "",
  orgRorVersion: "",
  status: "",
  approvedBy: "",
  approvedAt: null,
};

function getBlankOrganization() {
  return deepCopy(blankOrganization);
}

const blankOrganizationRequest = {
  orgNameEn: "",
  orgNameFr: "",
  orgDescriptionEn: "",
  orgDescriptionFr: "",
  orgLogoEn: "",
  orgLogoFr: "",
  orgAcceptedNames: [],
  orgEmail: "",
  orgURL: "",
  orgAddress: "",
  orgCity: "",
  orgCountry: "",
  orgRor: "",
  orgRorVersion: "",
  requestedBy: "",
  requestedByEmail: "",
  requestedFromRegion: "",
  requestedAt: null,
  status: "pending",
  reviewNote: "",
};

function getBlankOrganizationRequest() {
  return deepCopy(blankOrganizationRequest);
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
  getBlankOrganization,
  getBlankOrganizationRequest,
  getBlankInstrument,
  getBlankPlatform,
};
