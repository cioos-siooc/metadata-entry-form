/**
 * Assembles the CIOOS metadata record JSON Schema.
 *
 * Two artifacts come out of here:
 *
 *   structural — what a record IS. Types, shapes, enums. This is the contract
 *                cioos-metadata-conversion and any future storage must honour.
 *                A published record that fails this means the SCHEMA is wrong.
 *
 *   submission — structural plus what a record must be to be publishable, i.e.
 *                today's recordIsValid(). A decade of drafts will fail this and
 *                that is expected.
 *
 * See schema/README.md for the decisions behind the split, the dialect choice,
 * and the type-fidelity rule.
 */

import { definitions } from "./defs";
import { submissionConditionals } from "./conditionals";
import { SCHEMA_VERSION, SCHEMA_MAJOR } from "./version";
import startProperties from "./properties/start";
import dataIdProperties from "./properties/dataId";
import spatialProperties from "./properties/spatial";
import contactsProperties from "./properties/contacts";
import resourcesProperties from "./properties/resources";
import platformProperties from "./properties/platform";
import taxaProperties from "./properties/taxa";
import systemProperties from "./properties/system";

export { SCHEMA_VERSION, SCHEMA_MAJOR };

const BASE_ID = "https://schema.cioos.ca/metadata-entry-form";

const DIALECTS = {
  "draft-07": {
    $schema: "http://json-schema.org/draft-07/schema#",
    definitionsKey: "definitions",
  },
  "2020-12": {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    definitionsKey: "$defs",
  },
};

export const recordProperties = {
  ...startProperties,
  ...dataIdProperties,
  ...spatialProperties,
  ...contactsProperties,
  ...resourcesProperties,
  ...platformProperties,
  ...taxaProperties,
  ...systemProperties,
};

/**
 * Record keys that are legitimately absent from blankRecord.js — they are set
 * at runtime by the app, the database path, or the publishing pipeline rather
 * than seeded on a new record.
 *
 * src/utils/createRecordFromSource.js imports this instead of keeping its own
 * EXTRA_ALLOWED_KEYS list, so the two cannot drift.
 */
export const KNOWN_EXTRA_KEYS = [
  "identifier",
  "created",
  "userID",
  "region",
  "userinfo",
  "sharedWith",
  "metadataScope",
  "metadataScopeIso",
  "verticalExtentEPSG",
  "noVerticalExtent",
  "noTaxa",
  "taxa",
  "projects",
  "schemaVersion",
];

/**
 * $refs are written as "#/definitions/..." throughout. When emitting 2020-12
 * they need to point at $defs instead, so rewrite them on the way out.
 */
function retargetRefs(node, definitionsKey) {
  if (definitionsKey === "definitions") return node;
  if (Array.isArray(node)) {
    return node.map((item) => retargetRefs(item, definitionsKey));
  }
  if (!node || typeof node !== "object") return node;

  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => {
      if (key === "$ref" && typeof value === "string") {
        return [key, value.replace("#/definitions/", `#/${definitionsKey}/`)];
      }
      return [key, retargetRefs(value, definitionsKey)];
    })
  );
}

function baseSchema({ dialect, id, title, description, fr }) {
  const { $schema, definitionsKey } = DIALECTS[dialect];

  return {
    $schema,
    $id: id,
    title,
    description,
    "x-i18n": { fr },
    "x-cioos-schema-version": SCHEMA_VERSION,
    type: "object",
    // Deliberately open: allOf/if/then composition breaks under
    // additionalProperties:false, and legacy records carry forgotten keys.
    // "No undeclared key" is a conformance report line instead.
    additionalProperties: true,
    [definitionsKey]: retargetRefs(definitions, definitionsKey),
  };
}

export function buildStructuralSchema({ dialect = "draft-07" } = {}) {
  const { definitionsKey } = DIALECTS[dialect];

  return {
    ...baseSchema({
      dialect,
      id: `${BASE_ID}/${SCHEMA_MAJOR}/record.schema.json`,
      title: "CIOOS Metadata Record",
      description:
        "Structural description of a CIOOS metadata record: types, shapes, and controlled vocabularies. Describes the normalized JavaScript object, not raw Realtime Database JSON — see schema/README.md §1.",
      fr: {
        title: "Enregistrement de métadonnées du SIOOC",
        description:
          "Description structurelle d'un enregistrement de métadonnées du SIOOC : types, formes et vocabulaires contrôlés. Décrit l'objet JavaScript normalisé, et non le JSON brut de la base de données en temps réel.",
      },
    }),
    properties: retargetRefs(recordProperties, definitionsKey),
  };
}

export function buildSubmissionSchema({ dialect = "draft-07" } = {}) {
  const { definitionsKey } = DIALECTS[dialect];

  return {
    ...baseSchema({
      dialect,
      id: `${BASE_ID}/${SCHEMA_MAJOR}/record.submission.schema.json`,
      title: "CIOOS Metadata Record (submission)",
      description:
        "A CIOOS metadata record that is complete enough to submit. Equivalent to recordIsValid() in src/utils/validate.js. Existing drafts are expected to fail this.",
      fr: {
        title: "Enregistrement de métadonnées du SIOOC (soumission)",
        description:
          "Un enregistrement de métadonnées du SIOOC suffisamment complet pour être soumis. Équivalent à recordIsValid() dans src/utils/validate.js. Les brouillons existants ne le satisferont pas.",
      },
    }),
    properties: retargetRefs(recordProperties, definitionsKey),
    allOf: retargetRefs(submissionConditionals, definitionsKey),
  };
}

export default buildStructuralSchema;
