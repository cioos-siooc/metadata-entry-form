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
  recordID: "",
  instruments: [],
  platformID: "",
  platformDescription: "",
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

export default getBlankRecord;
