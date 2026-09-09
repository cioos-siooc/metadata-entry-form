import axios from "axios";

import { getBlankRecord } from "./blankRecord";
import { standardizeContact } from "./firebaseRecordFunctions";
import { getPythonFunctionUrl } from "./pythonFunctionUrl";

const DOI_URL_RE = /^https?:\/\/(dx\.)?doi\.org\//i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CCIN_RE = /^\d+$/;

/**
 * Works out which catalogue an identifier belongs to.
 *
 * DOI is tested first on purpose: a DOI URL such as https://doi.org/10.21963/13172
 * ends in digits and would otherwise look like a PDC CCIN number.
 *
 * @param {string} input - A DOI, OBIS dataset id/URL, or PDC CCIN/URL
 * @returns {"doi"|"obis"|"pdc"|null} null when nothing matches
 */
export function detectSourceType(input) {
  const value = (input || "").trim();
  if (!value) return null;

  if (DOI_URL_RE.test(value) || value.startsWith("10.") || value.toLowerCase().startsWith("doi:"))
    return "doi";

  if (value.includes("polardata.ca") || CCIN_RE.test(value)) return "pdc";

  if (value.includes("obis.org/dataset/") || UUID_RE.test(value)) return "obis";

  return null;
}

/**
 * Fetches a metadata record from an external catalogue and returns it in the
 * Firebase record shape, via the Python create_record_from_source function.
 *
 * @param {"doi"|"obis"|"pdc"} sourceType
 * @param {string} identifier
 * @returns {Promise<Object>} The record as returned by cioos-metadata-conversion
 * @throws {Error} With the server's message when the source can't be retrieved
 */
export async function createRecordFromSource(sourceType, identifier) {
  const url = getPythonFunctionUrl("create_record_from_source");

  try {
    const response = await axios.post(url, {
      data: { source_type: sourceType, identifier },
    });

    const record = response?.data?.data;
    if (!record || typeof record !== "object")
      throw new Error("The conversion service returned an empty record.");

    return record;
  } catch (e) {
    const serverMessage = e.response?.data?.error;
    if (serverMessage) throw new Error(serverMessage);
    throw e;
  }
}

// Fields the loaders populate from the source record but which describe *this*
// form's copy of it. A freshly imported record has not been saved, has no owner
// and no status, so these must never carry over. PDC is the loudest offender: it
// sets recordID and filename to "ccin-<n>".
const OWNED_BY_THIS_FORM = {
  recordID: "",
  status: "",
  userID: "",
  region: "",
  filename: "",
  lastEditedBy: {},
  timeFirstPublished: "",
};

// Fields the form reads that getBlankRecord() doesn't declare. Filtering strictly
// to the blank record's keys would silently drop these: noTaxa is read by TaxaTab
// and metadataScope by ApaPreview.
// Deliberately narrower than the schema's KNOWN_EXTRA_KEYS: a remote source
// must never be able to set userID, region, sharedWith, or schemaVersion.
// src/schema/__tests__/agreement.test.js asserts this stays a subset of the
// schema's properties without widening it.
export const EXTRA_ALLOWED_KEYS = [
  "noTaxa",
  "noVerticalExtent",
  "metadataScope",
  "resourceType",
  "projects",
];

/**
 * Turns a record from cioos-metadata-conversion into one this form can hold in
 * state. The three loaders don't agree with each other, or with the form, on
 * every field, so the raw output is not safe to spread into state directly.
 *
 * @param {Object} remote - Record as returned by createRecordFromSource
 * @returns {Object} A record in the getBlankRecord() shape
 */
export function normalizePrefilledRecord(remote) {
  const blank = getBlankRecord();
  const allowed = new Set([...Object.keys(blank), ...EXTRA_ALLOWED_KEYS]);

  const source = { ...(remote || {}) };

  // PDC calls it "comments"; the form field is "comment".
  if (source.comments !== undefined && source.comment === undefined) {
    source.comment = source.comments;
    delete source.comments;
  }

  // OBIS emits a bare string where DataCite and PDC emit a list.
  if (typeof source.resourceType === "string")
    source.resourceType = source.resourceType ? [source.resourceType] : [];

  const record = { ...blank };

  Object.entries(source).forEach(([key, value]) => {
    // null would clobber the blank record's "" and then be written to the
    // Realtime DB on save (PDC returns null for the vertical extents).
    if (value === null || value === undefined) return;
    if (!allowed.has(key)) return;
    record[key] = value;
  });

  Object.assign(record, OWNED_BY_THIS_FORM);

  // identifier drives the catalogue and DataCite URLs, so it has to be the uuid
  // this form minted, not the one the loader made up (PDC: "ccin-<uuid>").
  record.identifier = blank.identifier;

  // PDC reports a DOI state even when it found no DOI to attach.
  if (!record.datasetIdentifier) record.doiCreationStatus = "";

  record.contacts = (record.contacts || []).map(standardizeContact);

  return record;
}
