/**
 * DataCite payload assembly.
 *
 * The converter service turns a record into DataCite JSON; this is everything
 * that happens after it — the catalogue URL, the API envelope, and the
 * create-vs-update difference. Shared because both clients send to the same
 * DataCite account, and a payload that differs between them would produce DOIs
 * whose metadata depends on which device registered them.
 */

/**
 * Wraps a converted DataCite object in the API structure.
 *
 * `forUpdate` omits `type` and `prefix`: DataCite rejects them on a PUT to an
 * existing DOI.
 */
export function buildDataCitePayload({
  dataciteObject,
  catalogueUrl,
  identifier,
  datacitePrefix = undefined,
  forUpdate = false,
}) {
  if (typeof dataciteObject !== "object" || dataciteObject === null || Array.isArray(dataciteObject)) {
    throw new Error("DataCite response is not a valid object");
  }
  if (!catalogueUrl) throw new Error("No catalogue URL for this region and language");

  const attributes = {
    ...dataciteObject,
    // The permanent home of the dataset once published — the DOI resolves here.
    url: `${catalogueUrl}dataset/ca-cioos_${identifier}`,
  };

  if (forUpdate) return { data: { attributes } };
  if (!datacitePrefix) throw new Error("A create needs a DataCite prefix");

  return {
    data: {
      type: "dois",
      attributes: { ...attributes, prefix: datacitePrefix },
    },
  };
}

/** A bare DOI from whatever URL form the record stores it in. */
export function bareDoi(datasetIdentifier) {
  return String(datasetIdentifier ?? "").replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "");
}

/**
 * The payload for a brand-new draft.
 *
 * Deliberately minimal: full metadata is pushed on submit or publish, and a
 * draft created from a half-finished record would otherwise register that
 * half-finished state at DataCite.
 */
export function draftDoiPayload(datacitePrefix) {
  return { data: { type: "dois", attributes: { prefix: datacitePrefix } } };
}
