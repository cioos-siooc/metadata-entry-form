/**
 * Controlled vocabularies for the record schema.
 *
 * Every enum here is DERIVED from the module the form itself renders from.
 * Never hardcode a value list: the whole point of issue #526 is to stop
 * creating parallel copies of these vocabularies that drift apart. PR #484
 * replaced the entire topic-category list in one commit — a hand-written enum
 * would have silently gone stale.
 */

import {
  roleCodes,
  progressCodes,
  depthDirections,
  metadataScopeCodes,
  associationTypeCode,
  identifierType,
} from "../isoCodeLists";
import { topicCategories, legacyThemeMapping } from "../utils/themes";
import licenses from "../utils/licenses";
import { eovs } from "../eovs";
import platformTypes from "../platforms.json";
import regions from "../regions";
import tabs from "../utils/tabs";

/** ISO 19115 MD_TopicCategoryCode values, plus the legacy names still in the DB. */
export const resourceTypeValues = [
  ...Object.keys(topicCategories),
  ...Object.keys(legacyThemeMapping),
];

/** Only the ISO values — what new records should be written with. */
export const isoTopicCategoryValues = Object.keys(topicCategories);

/** Every EOV, including deprecated ones (legacy records still carry them). */
export const eovValues = eovs.map((e) => e.value);

/**
 * EOVs flagged deprecated upstream in cioos-commons. Selecting one blocks
 * submission but does not make an existing record structurally invalid.
 */
export const deprecatedEovValues = eovs
  .filter((e) => e.deprecated)
  .map((e) => e.value);

export const contactRoleValues = Object.keys(roleCodes);

/**
 * Roles that at least one contact must hold. Derived from the `required` flag
 * in roleCodes rather than hardcoding ["custodian", "owner"], so adding a
 * required role upstream propagates automatically.
 */
export const requiredContactRoles = Object.entries(roleCodes)
  .filter(([, code]) => code.required)
  .map(([key]) => key);

export const progressValues = Object.keys(progressCodes);

export const depthDirectionValues = Object.keys(depthDirections);

/** The user-facing metadata scope keys (e.g. "Book", "Dataset"). */
export const metadataScopeValues = Object.keys(metadataScopeCodes);

/** The ISO values those keys map to, stored alongside as metadataScopeIso. */
export const metadataScopeIsoValues = [
  ...new Set(Object.values(metadataScopeCodes).map((c) => c.isoValue)),
];

export const associationTypeValues = Object.keys(associationTypeCode);

/** Identifier authorities for related works (already a flat array upstream). */
export const identifierTypeValues = [...identifierType];

export const licenseValues = Object.keys(licenses);

/** platform.type stores the English label — see PlatformEditor.jsx's SelectInput. */
export const platformTypeValues = platformTypes.map((p) => p.label_en);

export const regionValues = Object.keys(regions);

/** Tab keys, used to validate every x-cioos-tab annotation. */
export const tabValues = Object.keys(tabs);

/** Record lifecycle: "" is draft. */
export const recordStatusValues = ["", "submitted", "published"];

/** DataCite DOI lifecycle, from DOI_STATE_TRANSITIONS in DOIInput.jsx. "" is none. */
export const doiCreationStatusValues = ["", "draft", "registered", "findable"];

/**
 * A lineage step's `scope` stores a metadataScopeCodes KEY (Lineage.jsx renders
 * `Object.keys(filteredMetadataScopeCodes)`), while `scopeIso` stores that
 * entry's `isoValue`.
 *
 * Note this is why validate.js's "statement required for data collection" rule
 * never fires: it compares `scope` against the ISO value "collectionSession",
 * but no metadataScopeCodes key has that name — the key is
 * "DataCollectionSampling". See schema/README.md §11 open decision 3.
 */
export const lineageScopeCollectionSessionKey = "DataCollectionSampling";
export const lineageScopeCollectionSessionIso = "collectionSession";

export const lineageScopeValues = metadataScopeValues;
export const lineageScopeIsoValues = metadataScopeIsoValues;
