/**
 * Submission requirements: everything a record must satisfy to be publishable.
 *
 * These compose on top of the structural schema via allOf. Every conditional is
 * kept at the ROOT so that if/then can reach across sibling properties (the map
 * rule needs both resourceType and map), and because json-schema-for-humans
 * renders nested conditionals poorly.
 *
 * Two traps worth restating, both easy to reintroduce:
 *
 *  1. An `if` MUST carry its own `required`. A bare `properties` block succeeds
 *     when the property is absent, so `if: {properties: {noTaxa: {const: true}}}`
 *     matches a record with no noTaxa key at all and the else-branch never runs.
 *
 *  2. `contains: {const: "biota"}` misses legacy records, which store the
 *     pre-ISO name "biological". Always match both.
 */

import {
  deprecatedEovValues,
  requiredContactRoles,
  lineageScopeCollectionSessionIso,
} from "./enums";

/** A record has a topic category if it's a non-empty array or a non-empty string. */
const hasResourceType = {
  anyOf: [
    { properties: { resourceType: { type: "array", minItems: 1 } }, required: ["resourceType"] },
    { properties: { resourceType: { type: "string", minLength: 1 } }, required: ["resourceType"] },
  ],
};

const requiredNonEmptyStrings = {
  required: ["metadataScope", "progress", "language", "license"],
  properties: {
    metadataScope: { minLength: 1 },
    progress: { minLength: 1 },
    language: { minLength: 1 },
    license: { minLength: 1 },
  },
};

const requiredBilingualText = {
  required: ["title", "abstract"],
  properties: {
    title: { $ref: "#/definitions/bilingualTextRequired" },
    abstract: { $ref: "#/definitions/bilingualTextRequired" },
  },
};

const requiredKeywords = {
  required: ["keywords"],
  properties: {
    keywords: {
      anyOf: [
        { required: ["en"], properties: { en: { minItems: 1 } } },
        { required: ["fr"], properties: { fr: { minItems: 1 } } },
      ],
    },
  },
};

/**
 * At least one EOV, none of them deprecated. The deprecation list is derived
 * from src/data/eovs.json, which is synced from cioos-commons — so retiring an
 * EOV upstream tightens this automatically.
 */
const requiredEov = {
  required: ["eov"],
  properties: {
    eov: {
      type: "array",
      minItems: 1,
      items: { not: { enum: deprecatedEovValues } },
    },
  },
};

/**
 * Every contact filled in, and the roster as a whole must contain each required
 * role plus at least one contact flagged for the citation.
 */
const requiredContacts = {
  allOf: [
    {
      required: ["contacts"],
      properties: {
        contacts: {
          type: "array",
          minItems: 1,
          items: { $ref: "#/definitions/contactFilled" },
        },
      },
    },
    ...requiredContactRoles.map((role) => ({
      properties: {
        contacts: {
          contains: {
            allOf: [
              { $ref: "#/definitions/contactFilled" },
              { properties: { role: { contains: { const: role } } } },
            ],
          },
        },
      },
    })),
    {
      properties: {
        contacts: {
          contains: {
            allOf: [
              { $ref: "#/definitions/contactFilled" },
              { properties: { inCitation: { const: true } }, required: ["inCitation"] },
            ],
          },
        },
      },
    },
  ],
};

const requiredDistribution = {
  required: ["distribution"],
  properties: {
    distribution: {
      type: "array",
      contains: {
        required: ["name", "url"],
        properties: {
          name: { minLength: 1 },
          url: { minLength: 1, format: "uri" },
        },
      },
    },
  },
};

const validRelatedWorks = {
  properties: {
    associated_resources: {
      items: {
        required: ["title", "authority", "code", "association_type"],
        properties: {
          title: { $ref: "#/definitions/bilingualTextRequired" },
          authority: { minLength: 1 },
          code: { minLength: 1 },
          association_type: { minLength: 1 },
        },
      },
    },
  },
};

/**
 * Lineage: every processing step and source needs a title and description, and
 * a step scoped to data collection needs a bilingual statement.
 *
 * NOTE: the statement rule keys off `scopeIso`, not `scope`. validate.js
 * compares `scope` against "collectionSession", but `scope` holds a
 * metadataScopeCodes KEY ("DataCollectionSampling") while "collectionSession"
 * is its isoValue — so the rule has never fired on a form-produced record.
 * This encodes the intent; the mismatch is tracked in KNOWN_DIVERGENCES and in
 * schema/README.md §11 open decision 3.
 */
const validLineage = {
  properties: {
    history: {
      items: {
        allOf: [
          {
            properties: {
              processingStep: {
                items: {
                  required: ["title", "description"],
                  properties: {
                    title: { minLength: 1 },
                    description: { minLength: 1 },
                  },
                },
              },
              source: {
                items: {
                  required: ["title", "description"],
                  properties: {
                    title: { minLength: 1 },
                    description: { minLength: 1 },
                  },
                },
              },
            },
          },
          {
            if: {
              required: ["scopeIso"],
              properties: {
                scopeIso: { const: lineageScopeCollectionSessionIso },
              },
            },
            then: {
              required: ["statement"],
              properties: {
                statement: { $ref: "#/definitions/bilingualTextRequired" },
              },
            },
          },
        ],
      },
    },
  },
};

/** Vertical extent is required unless the record declares it has none. */
const verticalExtent = {
  if: {
    required: ["noVerticalExtent"],
    properties: { noVerticalExtent: { const: true } },
  },
  then: true,
  else: {
    required: [
      "verticalExtentMin",
      "verticalExtentMax",
      "verticalExtentDirection",
    ],
    properties: {
      verticalExtentMin: { minLength: 1 },
      verticalExtentMax: { minLength: 1 },
      verticalExtentDirection: { minLength: 1 },
    },
  },
};

/** Taxonomic coverage is required unless the record declares it has none. */
const taxonomicCoverage = {
  if: { required: ["noTaxa"], properties: { noTaxa: { const: true } } },
  then: true,
  else: {
    required: ["taxa"],
    properties: { taxa: { type: "array", minItems: 1 } },
  },
};

/**
 * Platforms pass if the record declares it has none, OR every platform carries
 * a type and an ID, OR the record has no scope / is a model.
 */
const platformRequirements = {
  anyOf: [
    { required: ["noPlatform"], properties: { noPlatform: { const: true } } },
    {
      properties: {
        platforms: {
          type: "array",
          items: {
            required: ["type", "id"],
            properties: { type: { minLength: 1 }, id: { minLength: 1 } },
          },
        },
      },
    },
    { properties: { metadataScope: { const: "" } } },
    { not: { required: ["metadataScope"] } },
    {
      required: ["metadataScopeIso"],
      properties: { metadataScopeIso: { const: "model" } },
    },
  ],
};

/**
 * Instruments always need an ID; the platform association only becomes required
 * once two or more platforms are defined.
 */
const instrumentRequirements = {
  allOf: [
    {
      properties: {
        instruments: {
          items: { required: ["id"], properties: { id: { minLength: 1 } } },
        },
      },
    },
    {
      if: {
        required: ["platforms"],
        properties: { platforms: { type: "array", minItems: 2 } },
      },
      then: {
        properties: {
          instruments: {
            items: {
              required: ["platform"],
              properties: { platform: { minLength: 1 } },
            },
          },
        },
      },
    },
  ],
};

const bboxComplete = {
  required: ["north", "south", "east", "west"],
  properties: {
    // numericStringRequired, not numericString: the latter permits "", which
    // would make an entirely empty bbox count as a complete one.
    north: { $ref: "#/definitions/numericStringRequired" },
    south: { $ref: "#/definitions/numericStringRequired" },
    east: { $ref: "#/definitions/numericStringRequired" },
    west: { $ref: "#/definitions/numericStringRequired" },
  },
  "x-cioos-bbox-ordered": true,
  "x-cioos-coordinate-ranges": true,
};

const polygonPresent = {
  required: ["polygon"],
  properties: {
    polygon: {
      type: "string",
      pattern:
        "^-?\\d+(\\.\\d+)?,-?\\d+(\\.\\d+)?( -?\\d+(\\.\\d+)?,-?\\d+(\\.\\d+)?)+$",
      "x-cioos-polygon-closed": true,
    },
  },
};

const descriptionPresent = {
  required: ["description"],
  properties: {
    description: { $ref: "#/definitions/bilingualTextAtLeastOne" },
  },
};

/**
 * Spatial extent. A bbox or polygon always satisfies it; a text description
 * only satisfies it for Biota records. Records with no topic category selected
 * are exempt, mirroring validate.js — though resourceType is itself required,
 * so that branch is unreachable at submission time.
 */
const spatialExtent = {
  anyOf: [
    { not: hasResourceType },
    {
      allOf: [
        {
          if: {
            required: ["resourceType"],
            properties: {
              resourceType: {
                anyOf: [
                  { type: "array", contains: { enum: ["biota", "biological"] } },
                  { type: "string", enum: ["biota", "biological"] },
                ],
              },
            },
          },
          then: {
            required: ["map"],
            properties: {
              map: { anyOf: [bboxComplete, polygonPresent, descriptionPresent] },
            },
          },
          else: {
            required: ["map"],
            properties: {
              map: { anyOf: [bboxComplete, polygonPresent] },
            },
          },
        },
      ],
    },
  ],
};

/** Every rule a record must satisfy to be submitted, in tab order. */
export const submissionConditionals = [
  requiredBilingualText,
  hasResourceType,
  requiredNonEmptyStrings,
  requiredKeywords,
  requiredEov,
  spatialExtent,
  verticalExtent,
  taxonomicCoverage,
  requiredContacts,
  requiredDistribution,
  validRelatedWorks,
  validLineage,
  platformRequirements,
  instrumentRequirements,
];

export default submissionConditionals;
