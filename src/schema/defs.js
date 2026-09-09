/**
 * Reusable schema definitions.
 *
 * Emitted under `definitions` (draft-07) and referenced as
 * "#/definitions/<name>". See schema/README.md §3 for why draft-07.
 *
 * Nothing here sets additionalProperties:false unless the shape is genuinely
 * closed and confirmed against real records — legacy records carry keys nobody
 * remembers, and closing a subschema turns those into hard failures.
 */

import {
  contactRoleValues,
  associationTypeValues,
  identifierTypeValues,
  platformTypeValues,
  lineageScopeValues,
  lineageScopeIsoValues,
} from "./enums";

/**
 * Bbox edges and vertical extents are stored as STRINGS in the database
 * ("east": "-160"), and validate.js parseFloat()s them. Typing these as
 * `number` would fail nearly every record and would silently change the
 * emitted XML. See schema/README.md §5.
 */
/** A number that must actually be present. Used where a value is required. */
const numericStringRequired = {
  type: ["string", "number"],
  pattern: "^-?\\d+(\\.\\d+)?$",
  description: "A number stored as a string.",
  "x-i18n": {
    fr: { description: "Un nombre stocké sous forme de chaîne." },
  },
};

const numericString = {
  type: ["string", "number"],
  // The trailing `?` allows "", which is how every unset field is stored.
  pattern: "^(-?\\d+(\\.\\d+)?)?$",
  description:
    "A number stored as a string, or \"\" when unset. Bbox and vertical extent values are strings in the database.",
  "x-i18n": {
    fr: {
      description:
        "Un nombre stocké sous forme de chaîne, ou « » si non défini. Les valeurs de cadre de délimitation et d'étendue verticale sont des chaînes dans la base de données.",
    },
  },
};

/**
 * Machine-translation provenance written by BilingualTextInput.jsx alongside
 * the text itself. `message` is only present when `verified` is false.
 */
const translationProvenance = {
  type: "object",
  properties: {
    verified: { type: "boolean" },
    message: { type: "string" },
  },
  required: ["verified"],
};

/**
 * Keyed by the language that was machine-translated INTO, so typically only
 * one key is present.
 */
const translations = {
  type: "object",
  properties: {
    en: { $ref: "#/definitions/translationProvenance" },
    fr: { $ref: "#/definitions/translationProvenance" },
  },
  additionalProperties: false,
};

const bilingualText = {
  type: "object",
  properties: {
    en: { type: "string" },
    fr: { type: "string" },
    translations: { $ref: "#/definitions/translations" },
  },
  description: "Free text in English and French, with translation provenance.",
  "x-i18n": {
    fr: {
      description:
        "Texte libre en anglais et en français, avec la provenance de la traduction.",
    },
  },
};

const bilingualTextRequired = {
  allOf: [
    { $ref: "#/definitions/bilingualText" },
    {
      required: ["en", "fr"],
      properties: {
        en: { minLength: 1 },
        fr: { minLength: 1 },
      },
    },
  ],
};

const bilingualTextAtLeastOne = {
  allOf: [
    { $ref: "#/definitions/bilingualText" },
    {
      anyOf: [
        { required: ["en"], properties: { en: { minLength: 1 } } },
        { required: ["fr"], properties: { fr: { minLength: 1 } } },
      ],
    },
  ],
};

const bilingualKeywords = {
  type: "object",
  properties: {
    en: { type: "array", items: { type: "string" } },
    fr: { type: "array", items: { type: "string" } },
  },
};

/**
 * Geographic extent. A bbox, a polygon, or a description — which of those is
 * sufficient depends on the topic category, expressed as a root-level
 * conditional rather than here.
 *
 * Ordering (north >= south), coordinate ranges, and polygon closure are
 * VALIDITY rules, not shape — they live in the submission conditionals via the
 * x-cioos keywords, not here. A legacy record with a reversed box is still
 * structurally a record. See schema/README.md §7.
 */
const mapExtent = {
  type: "object",
  properties: {
    north: { $ref: "#/definitions/numericString" },
    south: { $ref: "#/definitions/numericString" },
    east: { $ref: "#/definitions/numericString" },
    west: { $ref: "#/definitions/numericString" },
    polygon: {
      type: "string",
      description:
        'Space-separated "lat,lon" pairs; at least two points, and the first pair must equal the last.',
      "x-i18n": {
        fr: {
          description:
            "Paires « lat,lon » séparées par des espaces ; au moins deux points, et la première paire doit être identique à la dernière.",
        },
      },
    },
    description: { $ref: "#/definitions/bilingualText" },
  },
};

/**
 * ajv's email/uri formats reject "", but "" is how every unset field in this
 * record is stored. Wrapping keeps unset values structurally valid while still
 * checking anything actually filled in.
 */
const emailOrEmpty = {
  type: "string",
  anyOf: [{ const: "" }, { format: "email" }],
};

const uriOrEmpty = {
  type: "string",
  anyOf: [{ const: "" }, { format: "uri" }],
};

const contact = {
  type: "object",
  properties: {
    role: {
      type: "array",
      items: { enum: contactRoleValues },
      description: "ISO 19115 CI_RoleCode values.",
      "x-i18n": { fr: { description: "Valeurs ISO 19115 CI_RoleCode." } },
    },
    orgName: { type: "string" },
    orgEmail: { $ref: "#/definitions/emailOrEmpty" },
    orgURL: { $ref: "#/definitions/uriOrEmpty" },
    orgAdress: { type: "string" },
    orgCity: { type: "string" },
    orgCountry: { type: "string" },
    orgRor: { type: "string" },
    indPosition: { type: "string" },
    indEmail: { $ref: "#/definitions/emailOrEmpty" },
    indOrcid: { type: "string" },
    givenNames: { type: "string" },
    lastName: { type: "string" },
    inCitation: { type: "boolean" },
    contactID: { type: "string" },
  },
};

/** A contact that carries a role and at least one form of name. */
const contactFilled = {
  allOf: [
    { $ref: "#/definitions/contact" },
    {
      required: ["role"],
      properties: { role: { minItems: 1 } },
      anyOf: [
        { required: ["orgName"], properties: { orgName: { minLength: 1 } } },
        {
          required: ["givenNames"],
          properties: { givenNames: { minLength: 1 } },
        },
        { required: ["lastName"], properties: { lastName: { minLength: 1 } } },
      ],
    },
  ],
};

const instrument = {
  type: "object",
  properties: {
    id: { type: "string" },
    manufacturer: { type: "string" },
    version: { type: "string" },
    type: { $ref: "#/definitions/bilingualText" },
    description: { $ref: "#/definitions/bilingualText" },
    platform: { type: "string" },
    instrumentID: { type: "string" },
  },
};

const platform = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["", ...platformTypeValues],
      description:
        "SeaVoX Platform Category (NERC L06). Stored as the English label.",
      "x-i18n": {
        fr: {
          description:
            "Catégorie de plateforme SeaVoX (NERC L06). Stockée sous forme d'étiquette anglaise.",
        },
      },
    },
    id: { type: "string" },
    description: { $ref: "#/definitions/bilingualText" },
    platformID: { type: "string" },
  },
};

const distributionResource = {
  type: "object",
  properties: {
    url: { $ref: "#/definitions/uriOrEmpty" },
    name: { type: "string" },
    description: { $ref: "#/definitions/bilingualText" },
  },
};

const relatedWork = {
  type: "object",
  properties: {
    title: { $ref: "#/definitions/bilingualText" },
    authority: { type: "string", enum: identifierTypeValues },
    code: { type: "string" },
    association_type: { type: "string", enum: associationTypeValues },
    association_type_iso: { type: "string" },
  },
};

/** Shared by lineage sources and processing steps. */
const lineageCitation = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    authority: { type: "string" },
    code: { type: "string" },
  },
};

const lineageDocumentation = {
  type: "object",
  properties: {
    title: { type: "string" },
    authority: { type: "string" },
    code: { type: "string" },
  },
};

const lineageStep = {
  type: "object",
  properties: {
    statement: { $ref: "#/definitions/bilingualText" },
    scope: {
      type: "string",
      enum: ["", ...lineageScopeValues],
      description:
        "A metadataScopeCodes KEY (e.g. DataCollectionSampling), not an ISO value.",
      "x-i18n": {
        fr: {
          description:
            "Une CLÉ de metadataScopeCodes (p. ex. DataCollectionSampling), et non une valeur ISO.",
        },
      },
    },
    scopeIso: {
      type: "string",
      enum: ["", ...lineageScopeIsoValues],
      description: "The ISO value corresponding to `scope`.",
      "x-i18n": { fr: { description: "La valeur ISO correspondant à « scope »." } },
    },
    additionalDocumentation: {
      type: "array",
      items: { $ref: "#/definitions/lineageDocumentation" },
    },
    source: { type: "array", items: { $ref: "#/definitions/lineageCitation" } },
    processingStep: {
      type: "array",
      items: { $ref: "#/definitions/lineageCitation" },
    },
  },
};

/**
 * Taxonomic record from the WoRMS/GBIF lookup. Deliberately open: the upstream
 * response carries more fields than the form reads, and they are stored as-is.
 */
const taxon = {
  type: "object",
  properties: {
    scientificName: { type: "string" },
    canonicalName: { type: "string" },
    rank: { type: "string" },
    kingdom: { type: "string" },
    phylum: { type: "string" },
    class: { type: "string" },
    order: { type: "string" },
    family: { type: "string" },
    genus: { type: "string" },
    species: { type: "string" },
    parent: { type: "string" },
  },
};

const lastEditedBy = {
  type: "object",
  properties: {
    displayName: { type: "string" },
    email: { $ref: "#/definitions/emailOrEmpty" },
    uid: { type: "string" },
  },
};

const userinfo = {
  type: "object",
  properties: {
    displayName: { type: "string" },
    email: { $ref: "#/definitions/emailOrEmpty" },
  },
};

/** An ISO-8601 datetime as written by DateInput — full precision, not a date. */
const isoDateTime = {
  type: ["string", "null"],
  description:
    "Full ISO-8601 datetime with milliseconds, e.g. 2023-10-01T19:00:00.000Z.",
  "x-i18n": {
    fr: {
      description:
        "Date-heure ISO-8601 complète avec millisecondes, p. ex. 2023-10-01T19:00:00.000Z.",
    },
  },
};

export const definitions = {
  numericString,
  numericStringRequired,
  isoDateTime,
  translationProvenance,
  translations,
  bilingualText,
  bilingualTextRequired,
  bilingualTextAtLeastOne,
  bilingualKeywords,
  emailOrEmpty,
  uriOrEmpty,
  mapExtent,
  contact,
  contactFilled,
  instrument,
  platform,
  distributionResource,
  relatedWork,
  lineageCitation,
  lineageDocumentation,
  lineageStep,
  taxon,
  lastEditedBy,
  userinfo,
};

export default definitions;
